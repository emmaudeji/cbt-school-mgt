'use client';
import { FormEvent,useState } from 'react';
import { useRouter } from 'next/navigation';
export default function CandidateEntryPage(){
 const router=useRouter();const [exam,setExam]=useState('');const [candidate,setCandidate]=useState('');
 const [code,setCode]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');
  try {
   const r=await fetch('/api/cbt/login',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({entry_code:exam,candidate_code:candidate,access_code:code}),cache:'no-store'});
   const data=await r.json();if(!r.ok)throw new Error(data.error||'Unable to sign in');
   router.replace(data.next||'/candidate/my-exam');
  }catch(e){setError(e instanceof Error?e.message:'Unable to sign in');}finally{setBusy(false);}
 }
 return <main className="mx-auto max-w-md px-4 py-12">
  <form onSubmit={submit} className="space-y-4 rounded-xl border border-t-4 border-t-primary p-6">
   <h1 className="text-xl font-semibold">Enter your examination</h1>
   <p className="text-sm text-muted-foreground">Enter the details on the slip your teacher or examiner gave you.</p>
   <label className="block space-y-1 text-sm">Exam code<input autoComplete="off" required value={exam} onChange={e=>setExam(e.target.value)} className="w-full rounded-md border bg-background p-3" /></label>
   <label className="block space-y-1 text-sm">Candidate ID<input autoComplete="off" required value={candidate} onChange={e=>setCandidate(e.target.value)} className="w-full rounded-md border bg-background p-3" /></label>
   <label className="block space-y-1 text-sm">Access code<input autoComplete="off" required value={code} onChange={e=>setCode(e.target.value)} className="w-full rounded-md border bg-background p-3" /></label>
   {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
   <button className="w-full rounded-md bg-primary p-3 font-medium text-primary-foreground disabled:opacity-50" disabled={busy}>{busy?'Checking…':'Continue'}</button>
  </form>
 </main>;
}
