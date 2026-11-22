import { NextRequest, NextResponse } from 'next/server';
import { credentialVerifier, makeSessionToken, sourceKey, tokenHash } from '@/lib/crypto';
// import { serviceClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/utils/supabase/secrete-client';
export const runtime='nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string,unknown>;
    const entryCode = String(body.entry_code || '').trim().toUpperCase();
    const candidateCode = String(body.candidate_code || '').trim().toUpperCase();
    const secret = String(body.access_code || '').trim().toUpperCase();
    const invalid = () => NextResponse.json({error:'Invalid exam details or exam unavailable'},{status:401,headers:{'Cache-Control':'no-store'}});
    if (!/^[A-Z0-9]{6,32}$/.test(entryCode) || !/^[A-Z0-9_-]{3,64}$/.test(candidateCode)
        || !/^[A-Z0-9]{10,64}$/.test(secret)) return invalid();
    // Trust only the first reverse-proxy forwarded address IF your deployment
    // controls the proxy and strips user-supplied x-forwarded-for headers.
    // Otherwise replace with a trusted platform IP source before production.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const token = makeSessionToken();
    const {data,error} = await supabaseAdmin.rpc('cbt_login_with_access_code', {
      p_entry_code:entryCode, p_candidate_code:candidateCode,
      p_verifier:credentialVerifier(secret),p_token_hash:tokenHash(token),
      p_ip_key:sourceKey('ip',ip),p_candidate_key:sourceKey('candidate',entryCode+':'+candidateCode),
    });
    if (error || !data?.ok) return invalid();
    const response = NextResponse.json({ok:true, next:'/candidate/my-exam'}, {headers:{'Cache-Control':'no-store'}});
    response.cookies.set('cbt_access',token,{
      httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',
      path:'/',expires:new Date(data.expires_at),
    });
    return response;
  } catch {
    return NextResponse.json({error:'Invalid exam details or exam unavailable'},{status:401});
  }
}
