// Проверка банков заданий без браузера: выполняет цепочку из index.html в эмуляции DOM
// и падает, если bankQaRound2 содержит ошибки или сломался порядок загрузки.
// Запуск: node scripts/audit-banks.mjs
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const R=path.resolve(new URL('..',import.meta.url).pathname);
const mkEl=()=>{const el={style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},dataset:{},children:[],childNodes:[],hidden:false,open:false,value:'',textContent:'',innerHTML:'',
 appendChild(c){this.children.push(c);return c},append(){},prepend(){},insertBefore(){},insertAdjacentElement(){},insertAdjacentHTML(){},remove(){},replaceChildren(){},setAttribute(){},getAttribute(){return null},removeAttribute(){},
 addEventListener(){},removeEventListener(){},querySelector(){return mkEl()},querySelectorAll(){return []},closest(){return null},showModal(){this.open=true},close(){this.open=false},focus(){},scrollIntoView(){},getBoundingClientRect(){return{top:0,left:0,width:0,height:0}},contains(){return false},click(){}};
 return new Proxy(el,{get(t,k){if(k in t)return t[k];if(['parentNode','parentElement','firstElementChild','lastElementChild','nextElementSibling'].includes(k))return null;return undefined},set(t,k,v){t[k]=v;return true}})};
const store={};const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear(){for(const k in store)delete store[k]}};
const document={body:mkEl(),head:mkEl(),documentElement:mkEl(),createElement:()=>mkEl(),createTextNode:()=>mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],getElementById:()=>mkEl(),addEventListener(){},readyState:'complete'};
const window={document,localStorage,addEventListener(){},removeEventListener(){},setTimeout,clearTimeout,setInterval,clearInterval,console:{...console,log(){},groupCollapsed(){},groupEnd(){},warn(){}},location:{search:'',hash:'',pathname:'/',href:'http://localhost/'},navigator:{userAgent:'node',clipboard:{}},matchMedia:()=>({matches:false,addEventListener(){}}),innerWidth:1280,innerHeight:800,requestAnimationFrame:f=>setTimeout(f,0),getComputedStyle:()=>({}),history:{replaceState(){}},MutationObserver:class{observe(){}disconnect(){}},ResizeObserver:class{observe(){}disconnect(){}},WebSocket:class{},crypto:{randomUUID:()=>'x'},alert(){},confirm(){return true},prompt(){return null},structuredClone,JSON,Math,Date,Number,String,Array,Object,Set,Map,Promise,RegExp,Error,Intl,isFinite,isNaN,parseInt,parseFloat,encodeURIComponent,decodeURIComponent};
window.window=window;window.self=window;window.top={};
const ctx=vm.createContext(window);
const problems=[];
const run=(name,code)=>{try{vm.runInContext(code,ctx,{filename:name});return true}catch(e){problems.push(`Ошибка выполнения ${name}: ${e.message}`);return false}};
const html=fs.readFileSync(path.join(R,'oge-trainer-2026.html'),'utf8');
for(const [i,m] of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].entries())run('oge-trainer-2026.html#'+i,m[1]);
const idx=fs.readFileSync(path.join(R,'index.html'),'utf8');
const listCode=idx.match(/const files=\[[\s\S]*?(?=\n let i=0)/);
if(!listCode){console.error('Не найден список files в index.html');process.exit(1)}
const files=vm.runInNewContext(listCode[0]+';files');
for(const f of files){const p=path.join(R,f+'.js');if(!fs.existsSync(p)){problems.push(`В index.html указан отсутствующий файл ${f}.js`);continue}run(f,fs.readFileSync(p,'utf8'))}
const g=k=>vm.runInContext(k,ctx);
const qa=g('window.bankQaRound2'),prec=g('window.reviewedBankPrecedence2027'),pol=g('window.bankSourcePolicy2027'),v4=g('window.bankAudit2027V4');
if(!qa)problems.push('bankQaRound2 не создан');
if(!prec)problems.push('reviewedBankPrecedence2027 не создан');
if(!pol)problems.push('bankSourcePolicy2027 не создан');
if(!v4)problems.push('bankAudit2027V4 не создан: trainer-upgrade-v4 не выполнился');
if(qa){for(const e of qa.errors)problems.push(`QA: ${e.sub} №${e.task} ${e.id}: ${e.msg}`)}
const fixes=g('window.bankContentFixes2027');
if(!fixes)problems.push('bankContentFixes2027 не создан: bank-content-fixes не выполнился');
else if(fixes.missing.length)problems.push('bank-content-fixes: не найдены задания '+fixes.missing.join(', '));
// повторы формулировок, видимые заглушки, нерешаемые ключи
const PBall=g('window.practiceBank');const normQ=s=>String(s??'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const seenQ=new Map();const stubRe=/прототип|Требуется оригинальн|тренировочного варианта|任务|根据(短文|语境|录音)/i;let longKeys=0,choiceFirst=0,choiceAll=0;
for(const [sub,items] of Object.entries(PBall)){if(!Array.isArray(items))continue;for(const q of items){const k=normQ(q.q);if(k){if(seenQ.has(k))problems.push(`Повтор формулировки: ${sub}/${q.id} = ${seenQ.get(k)}`);else seenQ.set(k,sub+'/'+q.id)}
 if(stubRe.test(q.q)&&!q.excludeFromFullExam)problems.push(`Заглушка видна пользователю: ${sub}/${q.id}`);
 if(q.type==='choice'){choiceAll++;if(q.a===0)choiceFirst++}
 if(q.type==='text'){const a=String(q.answer??(q.answers||[])[0]??'');if(a.split(/\s+/).length>5)longKeys++}}}
console.log(`Исправлений контента применено: ${fixes?fixes.applied:0}, заглушек скрыто: ${fixes?fixes.stubsHidden:0}. Текстовых ключей длиннее 5 слов: ${longKeys}. Choice с ответом на первой позиции: ${choiceFirst}/${choiceAll} (варианты перемешиваются при показе).`);
const kept=pol?Object.values(pol.kept).reduce((a,b)=>a+b,0):0;
console.log(`Файлов в цепочке: ${files.length}. Заданий после политики источников: ${kept}.`);
if(qa){let tot=0,one=0,miss=0;const rows=[];for(const [k,s] of Object.entries(qa.subjects)){tot+=s.totalQuestions;one+=s.oneModelTasks.length;miss+=s.missingTasks.length;if(s.missingTasks.length)rows.push(`  ${k}: нет номеров ${s.missingTasks.join(',')}`)}
 console.log(`Заданий: ${tot}. Номеров без заданий: ${miss}. Номеров с одной моделью: ${one}. Предупреждений QA: ${qa.warnings.length}.`);rows.forEach(r=>console.log(r))}
if(problems.length){console.error('\nПРОБЛЕМЫ:');problems.forEach(p=>console.error(' - '+p));process.exit(1)}
console.log('Аудит банков пройден.');
