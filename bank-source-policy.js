(()=>{
'use strict';
const PB=window.practiceBank=window.practiceBank||{};
const prohibitedBrand=/(\u0443\u043c\u0441\u043a\u0443\u043b\u043b?|\u0075\u006d\u0073\u0063\u0068\u006f\u006f\u006c)/i;
const keep=q=>{
 const id=String(q?.id||'');
 const publicText=[q?.q,q?.ex,q?.criteria,q?.sourceName].filter(Boolean).join(' ');
 if(prohibitedBrand.test(publicText)) return false;
 if(q?.official==='FIPI-2027-change') return true;
 if(id.startsWith('hist-')||id.startsWith('soc-')) return true;
 if(q?.source==='FIPI-2027' || q?.source==='author-reviewed') return true;
 return false;
};
const report={version:'2027-source-policy-2',removed:{},kept:{},prohibitedBrandCheck:true};
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
