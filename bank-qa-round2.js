(()=>{
'use strict';
const PB=window.practiceBank||{};
const EXPECTED={math:25,rus:13,history:23,social:20,physics:22,chemistry:23,informatics:16,biology:26,geography:30,literature:5,english:38,german:38,french:38,spanish:38,'ege-rus':27,'ege-math-base':21,'ege-math-profile':20,'ege-physics':26,'ege-chemistry':34,'ege-informatics':27,'ege-biology':28,'ege-history':22,'ege-geography':29,'ege-social':25,'ege-literature':11,'ege-english':42,'ege-german':42,'ege-french':42,'ege-spanish':42,'ege-chinese':32};
const norm=s=>String(s??'').toLowerCase().replace(/<[^>]*>/g,' ').replace(/^\s*вариант\s*\d+[.:]?\s*/,'').replace(/\s+/g,' ').trim();
const sem=s=>norm(s).replace(/\d+(?:[.,]\d+)?/g,'#').replace(/[₀-₉]+/g,'#').replace(/[«»"'()[\]{}:;,.!?—–-]/g,' ').replace(/\s+/g,' ').trim();
const report={version:'round2-qa-2',checked:'2026-09-04',subjects:{},errors:[],warnings:[]};
const globalIds=new Map();
function issue(level,sub,q,msg){const row={sub,task:q?.task??null,id:q?.id??null,msg};report[level].push(row);(q.qaIssues??=[]).push(msg)}
function typeOf(q){if(q.type)return q.type;if(Array.isArray(q.opts)&&q.opts.length)return'choice';return'text'}
for(const [sub,total] of Object.entries(EXPECTED)){
 const items=[...(Array.isArray(PB[sub])?PB[sub]:[])];
 const tasks={};for(let t=1;t<=total;t++)tasks[t]=[];
 for(const q of items){
   q.qaIssues=[];q.qaRound=2;
   if(!q.id)issue('errors',sub,q,'Нет стабильного id');
   else if(globalIds.has(q.id))issue('errors',sub,q,`Дублирующийся id; впервые в ${globalIds.get(q.id)}`);
   else globalIds.set(q.id,sub);
   if(!Number.isInteger(Number(q.task))||Number(q.task)<1||Number(q.task)>total)issue('errors',sub,q,`Номер задания вне диапазона 1–${total}`);
   else tasks[Number(q.task)].push(q);
   if(!norm(q.q))issue('errors',sub,q,'Пустой текст задания');
   if(!q.topic)issue('warnings',sub,q,'Не указана тема');
   if(!q.source)issue('warnings',sub,q,'Не указан источник/статус задания');
   if(/текст\w* преподавателя|выданному тексту/i.test(norm(q.q))&&!q.passage)issue('errors',sub,q,'Задание ссылается на отсутствующий внешний текст');
   if(/author-base|artificial|generic|10x/i.test(String(q.source||'')+' '+String(q.quality||'')+' '+String(q.id||'')))issue('errors',sub,q,'Искусственный или устаревший вопрос запрещён в рабочем банке');
   const tp=typeOf(q);
   if(tp==='choice'){
     if(!Array.isArray(q.opts)||q.opts.length<2)issue('errors',sub,q,'Choice без вариантов ответа');
     if(!Number.isInteger(q.a)||q.a<0||q.a>=q.opts.length)issue('errors',sub,q,'Некорректный индекс правильного ответа');
   }else if(tp==='multi'){
     if(!Array.isArray(q.opts)||q.opts.length<2)issue('errors',sub,q,'Multi без вариантов ответа');
     const a=q.answers||q.a;
     if(!Array.isArray(a)||!a.length)issue('errors',sub,q,'Multi без массива правильных ответов');
     else if(a.some(x=>!Number.isInteger(Number(x))||Number(x)<0||Number(x)>=q.opts.length))issue('errors',sub,q,'Multi содержит индекс вне диапазона');
   }else if(tp==='essay'){
     if(!q.criteria)issue('warnings',sub,q,'Развёрнутый ответ без критериев самопроверки');
   }else if(q.answer===undefined&&!(Array.isArray(q.answers)&&q.answers.length))issue('errors',sub,q,'Нет проверяемого ответа');
   const suspicious=norm(`${q.q} ${q.ex||''}`).match(/требует проверки|заменить формулировку|заглушк|неверн(ый|ая|ое)|внимание: исходн/);
   if(suspicious)issue('warnings',sub,q,'Обнаружена служебная/сомнительная формулировка');
   q.qaPass=!q.qaIssues.some(x=>/Нет |Некоррект|Пустой|вне диапазона|без вариантов|без массива|индекс вне|Нет проверяемого/.test(x));
 }
 let missing=[],oneModel=[],semanticDupes=0,exactDupes=0;
 for(let t=1;t<=total;t++){
   const arr=tasks[t];if(!arr.length){missing.push(t);continue}
   const exact=new Set(),models=new Set();
   for(const q of arr){const e=norm(q.q),m=sem(q.q);if(exact.has(e))exactDupes++;else exact.add(e);if(models.has(m))semanticDupes++;else models.add(m)}
   if(models.size<2)oneModel.push(t);
   tasks[t]={questions:arr.length,models:models.size,qaPass:arr.filter(q=>q.qaPass).length};
 }
 report.subjects[sub]={expectedTasks:total,totalQuestions:items.length,missingTasks:missing,oneModelTasks:oneModel,exactDuplicateCount:exactDupes,semanticDuplicateCount:semanticDupes,tasks};
}
report.ok=report.errors.length===0&&Object.values(report.subjects).every(x=>x.missingTasks.length===0&&x.oneModelTasks.length===0);
window.bankQaRound2=report;
console.groupCollapsed('[ОГЭ/ЕГЭ 2027] QA round 2');console.log(report);console.groupEnd();
})();
