import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { credentialVerifier, makeAccessCode, makeCandidateCode } from '@/lib/crypto';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

export const runtime = 'nodejs';

type Candidate = { candidate_code?: string; first_name: string; last_name?: string };

function cell(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
    if ('result' in value && value.result != null) return String(value.result).trim();
    return '';
  }
  return String(value).trim();
}
async function parseUpload(file: File): Promise<Candidate[]> {
  if (file.size > 2_000_000) throw new Error('File exceeds 2MB');
  const ext = file.name.toLowerCase().split('.').pop();
  let rows: Record<string, string>[];
  if (ext === 'csv') {
    rows = parse(Buffer.from(await file.arrayBuffer()).toString('utf8'), {
      columns: (header: string[]) => header.map(x => x.trim().toLowerCase()),
      skip_empty_lines: true, trim: true, bom: true, relax_quotes: false,
    });
  } else if (ext === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as any);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('Workbook is empty');
    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (v, n) => { headers[n-1] = cell(v.value).toLowerCase(); });
    rows = [];
    sheet.eachRow((row,n) => {
      if (n===1) return;
      const obj: Record<string,string> = {};
      headers.forEach((h,i) => { if (h) obj[h] = cell(row.getCell(i+1).value); });
      if (Object.values(obj).some(Boolean)) rows.push(obj);
    });
  } else throw new Error('Upload a .csv or .xlsx file');
  if (rows.length < 1 || rows.length > 300) throw new Error('Upload between 1 and 300 candidates');
  return rows.map((r,i) => {
    const full = (r.name || '').trim().split(/\s+/).filter(Boolean);
    const first_name = (r.first_name || full[0] || '').trim();
    const last_name = (r.last_name || (full.length>1 ? full.slice(1).join(' ') : '')).trim();
    if (!first_name) throw new Error(`Row ${i+2}: first_name or name is required`);
    return { candidate_code: (r.candidate_code || r.student_id || '').trim(), first_name, last_name };
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(); // Supabase cookie auth helper already used in School app
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error:'Sign in as an examiner' }, {status:401});
    const form = await request.formData();
    const organizationId = String(form.get('organization_id') || '');
    const publicationId = String(form.get('publication_id') || '');
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({error:'Candidate CSV/XLSX file is required'},{status:400});
    const candidates = await parseUpload(file);
    const items = candidates.map(c => {
      const candidate_code = c.candidate_code?.toUpperCase() || makeCandidateCode();
      const access_code = makeAccessCode();
      return { candidate_code, first_name:c.first_name, last_name:c.last_name || '', access_code,
        verifier: credentialVerifier(access_code) };
    });
    // Caller JWT is used by this RPC: checks exams.manage, organization ownership,
    // sealed access-code publication, and creates all assignments atomically.
    const {data,error} = await supabase.rpc('cbt_assign_candidates_with_codes', {
      p_organization_id:organizationId, p_publication_id:publicationId,
      p_rows:items.map(({access_code,...rest})=>rest),
    });
    if (error) {
      // Do not return SQL detail / constraint names to browser.
      return NextResponse.json({error:'Assignment failed. Check candidate IDs, existing assignments and exam access mode.'},{status:409});
    }
    const assigned = (data || []) as { candidate_code: string; candidate_id:string; assignment_id:string }[];
    // Printable slips issued ONCE only; no plaintext secrets stored in DB.
    return NextResponse.json({ assigned: assigned.map(row => {
      const match = items.find(item=>item.candidate_code===row.candidate_code)!;
      return { ...row, first_name:match.first_name, last_name:match.last_name, access_code:match.access_code };
    }) }, {headers:{'Cache-Control':'no-store'}});
  } catch(e) {
    return NextResponse.json({error:e instanceof Error ? e.message : 'Invalid import'}, {status:400});
  }
}
