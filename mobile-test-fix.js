(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
#v4check{display:block!important;min-width:120px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#quiz{max-height:94dvh;overflow:auto}
#modal{max-height:94dvh;overflow:auto;-webkit-overflow-scrolling:touch}
@media(max-width:560px){
  #quiz{width:calc(100% - 16px);max-height:96dvh;margin:auto}
  #modal .actions{position:sticky;bottom:0;z-index:3;background:var(--card);padding:12px 0 calc(4px + var(--sab,env(safe-area-inset-bottom,0px)));gap:10px}
  #modal .actions .counter{flex:1}
  #v4check{display:block!important;flex:0 0 auto;min-height:46px;padding:12px 18px}
  #modal .option{min-height:46px;touch-action:manipulation}
  .v4input,.v4textarea,.v4check{font-size:16px}
}
`;
document.head.appendChild(style);

function ensureVisible(){
  const b=document.querySelector('#v4check');
  if(b){
    b.style.display='block';
    b.type='button';
  }
}

const mo=new MutationObserver(ensureVisible);
mo.observe(document.body,{subtree:true,childList:true});
ensureVisible();
})();
