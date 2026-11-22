'use client';
import { useState } from 'react';

type Slip = {candidate_id:string;assignment_id:string;candidate_code:string;first_name:string;last_name:string;access_code:string};
function csvCell(v:string) { return '"'+v.replaceAll('"','""')+'"'; }
export function CandidateBulkAssign({organizationId,publicationId,entryCode}:{organizationId:string;publicationId:string;entryCode:string}) {
  const [file,setFile] = useState<File|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [slips,setSlips] = useState<Slip[]>([]);
  async function upload() {
    if (!file || busy) return;
    setBusy(true); setError('');
    try {
      const body = new FormData();
      body.set('file',file);body.set('organization_id',organizationId);body.set('publication_id',publicationId);
      const r = await fetch('/api/admin/cbt/assign-candidates',{method:'POST',body,cache:'no-store'});
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || 'Candidate assignment failed');
      setSlips(result.assigned);
    } catch(e) {setError(e instanceof Error ? e.message:'Assignment failed');}
    finally {setBusy(false);}
  }
  function exportCsv() {
    const rows = [['Exam Code','Candidate ID','Name','Access Code'], ...slips.map(s=>[entryCode,s.candidate_code,`${s.first_name} ${s.last_name}`.trim(),s.access_code])];
    const blob = new Blob(['\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url;a.download='cbt-candidate-slips.csv';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="space-y-4 rounded-xl border border-t-4 border-t-primary p-5">
    <h2 className="text-lg font-semibold">Assign candidates</h2>
    <p className="text-sm text-muted-foreground">Upload CSV or XLSX with first_name, last_name and optional candidate_code. Up to 300 candidates.</p>
    <input aria-label="Candidate spreadsheet" type="file" accept=".csv,.xlsx" onChange={e=>setFile(e.target.files?.[0]||null)} />
    <button type="button" disabled={!file||busy||slips.length>0} onClick={upload} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{busy?'Assigning…':'Assign and generate codes'}</button>
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    {slips.length>0&&<div className="space-y-3">
      <p className="font-medium">{slips.length} candidates assigned. Download and securely distribute codes now; they cannot be retrieved again.</p>
      <div className="flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={exportCsv} className="rounded-md border px-3 py-2">Download CSV</button>
        <button type="button" onClick={()=>window.print()} className="rounded-md border px-3 py-2">Print slips</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{slips.map(s=><article key={s.assignment_id} className="rounded-lg border p-4 text-sm break-words">
        <strong>CBT examination</strong><p>Name: {s.first_name} {s.last_name}</p><p>Exam code: <strong>{entryCode}</strong></p><p>Candidate ID: <strong>{s.candidate_code}</strong></p><p>Access code: <strong>{s.access_code}</strong></p>
      </article>)}</div>
    </div>}
  </section>;
}
