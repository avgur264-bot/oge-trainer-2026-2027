(()=>{
'use strict';
const PB=window.practiceBank||{};
const EXPECTED={math:25,rus:13,history:23,social:20,physics:22,chemistry:23,informatics:16,biology:26,geography:30,literature:5,english:38,german:38,french:38,spanish:38,'ege-rus':27,'ege-math-base':21,'ege-math-profile':20,'ege-physics':26,'ege-chemistry':34,'ege-informatics':27,'ege-biology':28,'ege-history':22,'ege-geography':29,'ege-social':25,'ege-literature':11,'ege-english':42,'ege-german':42,'ege-french':42,'ege-spanish':42,'ege-chinese':32};
window.examBankLegacy2027=window.examBankLegacy2027||{};
const report={version:'reviewed-precedence-1',subjects:{}};
for(const [id,total] of Object.entries(EXPECTED)){
 const items=Array.isArray(PB[id])?PB[id]:[];
 const reviewed=items.filter(q=>q&&(['author-reviewed','FIPI-2027'].includes(q.source)||q.official==='FIPI-2027-change'));
 const tasks=new Set(reviewed.map(q=>Number(q.task)).filter(n=>n>=1&&n<=total));
 if(!reviewed.length){report.subjects[id]={mode:'legacy-fallback',reviewedTasks:0,expected:total};continue}
 // Как только для предмета существует предметно размеченный проверенный банк, старый циклический examBank
 // больше не участвует в случайном выборе. Отсутствующий номер лучше честно показать как пробел, чем подменить заглушкой.
 if(Array.isArray(examBank[id])&&examBank[id].length)window.examBankLegacy2027[id]=examBank[id].slice();
 examBank[id]=[];
 PB[id]=reviewed;
 report.subjects[id]={mode:'reviewed-only',reviewedTasks:tasks.size,expected:total,missing:[...Array(total)].map((_,i)=>i+1).filter(n=>!tasks.has(n))};
}
window.reviewedBankPrecedence2027=report;
})();