(()=>{
const PB=window.practiceBank||{};
const id='ege-informatics';
if(Array.isArray(PB[id])) PB[id]=PB[id].filter(q=>!(Number(q.task)===27&&String(q.q||'').includes('Как в ЕГЭ-2027 по информатике записывается ответ задания 27')));
window.fipi2027Corrections={checked:'2026-09-04'};
})();