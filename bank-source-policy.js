(()=>{
'use strict';
const PB=window.practiceBank=window.practiceBank||{};
const keep=q=>{
 const id=String(q?.id||'');
 if(q?.official==='FIPI-2027-change') return true;
 if(id.startsWith('hist-')||id.startsWith('soc-')) return true;
 if(q?.source==='FIPI-2027' || q?.source==='author-reviewed') return true;
 return false;
};
const report={version:'2027-source-policy-1',removed:{},kept:{}};
for(const [id,items] of Object.entries(PB)){
 if(!Array.isArray(items)) continue;
 const before=items.length;
 const clean=items.filter(keep);
 PB[id]=clean;
 report.removed[id]=before-clean.length;
 report.kept[id]=clean.length;
}
window.bankSourcePolicy2027=report;
})();