(()=>{
'use strict';
const PB=window.practiceBank=window.practiceBank||{};
const badRe=/(требует проверки|заменить формулировку|учебная заглушка|placeholder|meta[- ]question|не использовать в экзамене)/i;
const mediaRe=/(аудиоматериал|требует аудио|запись голоса|устн(ая|ое) часть)/i;
const report={removed:[],fixedMulti:0,mediaExcluded:0,semanticDuplicates:[],checked:'2026-09-04'};
const norm=s=>String(s??'').toLowerCase().replace(/<[^>]*>/g,' ').replace(/\d+(?:[.,]\d+)?/g,'#').replace(/\s+/g,' ').trim();
for(const [sub,items] of Object.entries(PB)){
 if(!Array.isArray(items)) continue;
 const seen=new Map(),out=[];
 for(const q0 of items){
  const q={...q0};
  if(q.type==='multi'){
   if(!Array.isArray(q.answers)) q.answers=Array.isArray(q.a)?q.a:(q.a!==undefined&&q.a!==null?[q.a]:[]);
   q.answers=q.answers.map(Number).filter(Number.isFinite);
   report.fixedMulti++;
  }
  const text=[q.q,q.ex,q.criteria].filter(Boolean).join(' ');
  if(badRe.test(text)){
   report.removed.push({sub,id:q.id,task:q.task,reason:'unsafe-placeholder'});
   continue;
  }
  if(q.mediaRequired||q.audioRequired||q.requiresAudio||mediaRe.test(text)){
   q.excludeFromFullExam=true;
   q.mediaRequired=true;
   report.mediaExcluded++;
  }
  if(q.type==='essay') q.manualCheck=true;
  if(q.type==='number' && q.answer!==undefined) q.answer=String(q.answer).replace(',','.');
  const key=`${q.task}|${norm(q.q)}|${norm([...(q.left||[]),...(q.items||[]),...(q.opts||[]),q.passage||''].join(' '))}`;
  if(norm(q.q)&&seen.has(key)){
   report.semanticDuplicates.push({sub,task:q.task,kept:seen.get(key),dropped:q.id});
   continue;
  }
  if(norm(q.q)) seen.set(key,q.id);
  out.push(q);
 }
 PB[sub]=out;
}
window.bankRound2Hardening=report;
})();