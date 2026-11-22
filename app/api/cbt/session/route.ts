import { NextRequest,NextResponse } from 'next/server';
import { tokenHash } from '@/lib/crypto';
import { supabaseAdmin } from '@/utils/supabase/secrete-client';
export const runtime='nodejs';

export async function GET(request:NextRequest) {
  const token = request.cookies.get('cbt_access')?.value;
  if (!token || !/^[a-zA-Z0-9_-]{40,100}$/.test(token)) return NextResponse.json({ok:false},{status:401});
  const {data,error} = await supabaseAdmin.rpc('cbt_verify_candidate_session',{p_token_hash:tokenHash(token)});
  if (error || !data?.ok) return NextResponse.json({ok:false},{status:401,headers:{'Cache-Control':'no-store'}});
  return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
}
