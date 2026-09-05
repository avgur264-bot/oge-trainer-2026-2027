(()=>{
'use strict';
const MISTAKE_KEY='oge-ege-2027-mistakes-v1';
let mode='exam';
let queue=null;
let queuePos=0;
let lastSubject=null;

for(const [sub,items] of Object.entries(examBank)) items.forEach((q,i)=>{if(!q.id)q.id=`${sub}-${String(i+1).padStart(2,'0')}`});

const css=document.createElement('style');
css.textContent=`
.practice-modes{margin:0 0 22px}.practice-modes h2{font-size:21px;margin:0 0 5px;letter-spacing:-.035em}.practice-modes>p{margin:0 0 13px;color:var(--muted);font-size:12px}.practice-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.practice-mode{border:1px solid var(--line);background:var(--card);border-radius:16px;padding:15px;text-align:left;cursor:pointer;min-height:105px;transition:.18s}.practice-mode:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(29,48,35,.08)}.practice-mode.active{border-color:var(--green);background:var(--green2)}.practice-mode b{display:block;font-size:14px;margin:6px 0 4px}.practice-mode span{display:block;color:var(--muted);font-size:11px;line-height:1.4}.practice-mode i{font-style:normal;font-size:21px}.mistake-count{display:inline-flex!important;min-width:22px;height:22px;align-items:center;justify-content:center;border-radius:99px;background:var(--red);color:#fff!important;font-size:10px!important;margin-left:5px}
.picker-dialog{padding:0;border:0;border-radius:22px;width:min(720px,calc(100% - 24px));background:var(--card);color:var(--ink);box-shadow:0 30px 90px rgba(0,0,0,.25)}.picker-dialog::backdrop{background:rgba(17,27,21,.65)}.picker-wrap{padding:24px}.picker-head{display:flex;justify-content:space-between;align-items:start;gap:14px}.picker-head h2{margin:4px 0;font-size:24px}.picker-head p{margin:0;color:var(--muted);font-size:12px}.picker-close{border:0;background:#edf0eb;border-radius:50%;width:38px;height:38px;font-size:20px}.picker-list{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px;max-height:52vh;overflow:auto}.picker-item{border:1px solid var(--line);background:#fff;border-radius:12px;padding:12px;text-align:left;cursor:pointer}.picker-item b{display:block;font-size:12px}.picker-item span{display:block;color:var(--muted);font-size:10px;margin-top:4px;line-height:1.35}.mistake-list{grid-template-columns:1fr}.qid{font-size:10px;color:var(--muted);font-weight:800;letter-spacing:.06em;margin-bottom:3px}.similar-btn{border:1px solid var(--green);background:transparent;color:var(--green);border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer;margin-top:10px}.mode-note{background:#fff2c9;color:#6b5115;border-radius:10px;padding:9px 11px;font-size:11px;font-weight:700;margin-top:10px}
@media(max-width:700px){.practice-grid{grid-template-columns:1fr 1fr}.picker-list{grid-template-columns:1fr 1fr}}@media(max-width:420px){.practice-grid,.picker-list{grid-template-columns:1fr}.practice-mode{min-height:auto}}
`;
document.head.appendChild(css);

function loadMistakes(){try{return JSON.parse(localStorage.getItem(MISTAKE_KEY)||'[]')}catch{return []}}
function saveMistakes(v){localStorage.setItem(MISTAKE_KEY,JSON.stringify(v));updateMistakeCount()}
function subjectName(id){return subjects.find(s=>s.id===id)?.name||id}
function addMistake(sub,index,q){let a=loadMistakes().filter(x=>x.id!==q.id);a.unshift({id:q.id,sub,index,topic:q.topic,q:q.q,when:Date.now()});saveMistakes(a.slice(0,200))}
function clearMistake(id){const a=loadMistakes();const n=a.filter(x=>x.id!==id);if(n.length!==a.length)saveMistakes(n)}
function updateMistakeCount(){const n=loadMistakes().length;const el=document.querySelector('.mistake-count');if(el)el.textContent=n}

const anchor=document.querySelector('.my-subjects')||document.querySelector('.exam-switch');
if(anchor){
 const sec=document.createElement('section');sec.className='practice-modes';
 sec.innerHTML=`<h2>Как тренируемся?</h2><p>Выберите режим, затем предмет. Можно решать полный вариант, отдельные номера, темы или возвращаться к ошибкам.</p><div class="practice-grid">
 <button class="practice-mode active" data-mode="exam"><i>📝</i><b>Экзамен целиком</b><span>Полный тренировочный вариант по структуре экзамена.</span></button>
 <button class="practice-mode" data-mode="task"><i>🎯</i><b>По заданиям</b><span>Выберите конкретный номер и отработайте его отдельно.</span></button>
 <button class="practice-mode" data-mode="topic"><i>🧩</i><b>По темам</b><span>Соберите тренировку только из вопросов одной темы.</span></button>
 <button class="practice-mode" data-mode="mistakes"><i>↻</i><b>Мои ошибки <span class="mistake-count">0</span></b><span>Повторите вопросы, в которых раньше ошибались.</span></button>
 </div>`;
 anchor.insertAdjacentElement('afterend',sec);
 sec.querySelectorAll('.practice-mode').forEach(b=>b.onclick=()=>{
  if(b.dataset.mode==='mistakes'){showMistakes();return}
  mode=b.dataset.mode;queue=null;queuePos=0;
  sec.querySelectorAll('.practice-mode').forEach(x=>x.classList.toggle('active',x===b));
  document.querySelector('#subjects')?.scrollIntoView({behavior:'smooth',block:'start'});
 });
}

const picker=document.createElement('dialog');picker.className='picker-dialog';picker.innerHTML='<div class="picker-wrap"></div>';document.body.appendChild(picker);
picker.addEventListener('click',e=>{if(e.target===picker)picker.close()});
function pickerShell(title,lead){const w=picker.querySelector('.picker-wrap');w.innerHTML=`<div class="picker-head"><div><h2>${title}</h2><p>${lead}</p></div><button class="picker-close">×</button></div><div class="picker-list"></div>`;w.querySelector('.picker-close').onclick=()=>picker.close();return w.querySelector('.picker-list')}
function beginAt(sub,indices){if(!indices?.length)return;lastSubject=sub;queue=indices.slice();queuePos=0;state={sub,i:queue[0],score:0,answered:false,selected:null};picker.close();document.querySelector('#quiz').showModal();renderQ();shareState()}
function chooseTask(id){const list=pickerShell(`${subjectName(id)} · по заданиям`,'Выберите номер задания. Каждый вопрос имеет собственный ID и сохраняется отдельно.');examBank[id].forEach((q,i)=>{const b=document.createElement('button');b.className='picker-item';b.innerHTML=`<b>Задание ${i+1}</b><span>${q.topic}</span><span>${q.id}</span>`;b.onclick=()=>beginAt(id,[i]);list.appendChild(b)});picker.showModal()}
function chooseTopic(id){const groups={};examBank[id].forEach((q,i)=>(groups[q.topic]??=[]).push(i));const list=pickerShell(`${subjectName(id)} · по темам`,'Выберите тему — в тренировку войдут только задания этой темы.');Object.entries(groups).forEach(([topic,indices])=>{const b=document.createElement('button');b.className='picker-item';b.innerHTML=`<b>${topic}</b><span>${indices.length} задан${indices.length===1?'ие':indices.length<5?'ия':'ий'}</span>`;b.onclick=()=>beginAt(id,indices);list.appendChild(b)});picker.showModal()}
function showMistakes(){const mistakes=loadMistakes();const list=pickerShell('Мои ошибки',mistakes.length?'Нажмите на вопрос, чтобы решить его ещё раз. Правильный ответ удалит его из списка.':'Ошибок пока нет — отличный старт.');list.classList.add('mistake-list');if(!mistakes.length){list.innerHTML='<div class="mode-note">Здесь автоматически появятся задания, на которые был дан неверный ответ.</div>';picker.showModal();return}mistakes.forEach(x=>{const q=examBank[x.sub]?.[x.index];if(!q)return;const b=document.createElement('button');b.className='picker-item';b.innerHTML=`<div class="qid">${subjectName(x.sub)} · ${q.id}</div><b>${q.topic}</b><span>${q.q}</span>`;b.onclick=()=>beginAt(x.sub,[x.index]);list.appendChild(b)});picker.showModal()}

const nativeStart=start;
start=function(id){
 if(collabRole==='student')return nativeStart(id);
 if(mode==='task')return chooseTask(id);
 if(mode==='topic')return chooseTopic(id);
 queue=null;queuePos=0;lastSubject=id;return nativeStart(id);
};

const nativeRenderQ=renderQ;
renderQ=function(){
 nativeRenderQ();
 const q=examBank[state.sub]?.[state.i],m=document.querySelector('#modal');if(!q||!m)return;
 const crumb=m.querySelector('.crumb');if(crumb)crumb.insertAdjacentHTML('beforeend',` · <span class="qid">${q.id}</span>`);
 const h=m.querySelector('.mhead h2');if(h){if(mode==='task'||(queue&&queue.length===1))h.textContent='Тренировка отдельного задания';else if(mode==='topic'||(queue&&queue.length>1))h.textContent='Тренировка по теме'}
 const chip=m.querySelector('.meta .chip');if(chip&&queue){chip.textContent=`В подборке ${queuePos+1} из ${queue.length}`}
};

const nativeCheck=check;
check=function(){
 const sub=state.sub,index=state.i,q=examBank[sub]?.[index],choice=state.selected;
 nativeCheck();
 if(!q)return;
 const ok=choice===q.a;if(ok)clearMistake(q.id);else addMistake(sub,index,q);
 const f=document.querySelector('#modal .feedback');if(f){
   const same=examBank[sub].map((x,i)=>x.topic===q.topic&&i!==index?i:-1).filter(i=>i>=0);
   if(same.length){const b=document.createElement('button');b.type='button';b.className='similar-btn';b.textContent='Решить похожее →';b.onclick=()=>{const nextIndex=same.find(i=>!queue||!queue.includes(i))??same[0];queue=[nextIndex];queuePos=0;state.i=nextIndex;state.answered=false;state.selected=null;renderQ();shareState()};f.appendChild(document.createElement('br'));f.appendChild(b)}
 }
};

const nativeNext=next;
next=function(){
 if(queue){
   if(queuePos<queue.length-1){queuePos++;state.i=queue[queuePos];state.answered=false;state.selected=null;partnerAnswer=null;renderQ();shareState();return}
   const total=queue.length,pct=Math.round(state.score/Math.max(1,total)*100),m=document.querySelector('#modal');
   m.innerHTML=`<div class="result"><div class="score">${state.score}/${total}</div><h2>${pct>=80?'Отличная работа!':pct>=60?'Хороший темп':'Нужно повторить'}</h2><p>${pct}% правильных ответов в выбранной тренировке.</p><div class="actions" style="justify-content:center;gap:10px"><button class="option" id="repeatMode">Повторить</button><button class="next" style="display:block" id="doneMode">К предметам</button></div></div>`;
   m.querySelector('#repeatMode').onclick=()=>beginAt(lastSubject,queue);m.querySelector('#doneMode').onclick=()=>document.querySelector('#quiz').close();return;
 }
 return nativeNext();
};

updateMistakeCount();
})();