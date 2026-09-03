(()=>{
'use strict';
const KEY='oge-ege-2027-my-subjects-v1';
const oge=['Русский язык','Математика','Физика','Химия','Информатика','Биология','История','География','Обществознание','Литература','Английский язык','Немецкий язык','Французский язык','Испанский язык'];
const ege=['Русский язык','Математика базовая','Математика профильная','Физика','Химия','Информатика','Биология','История','География','Обществознание','Литература','Английский язык','Немецкий язык','Французский язык','Испанский язык','Китайский язык'];
const css=document.createElement('style');
css.textContent=`
.my-subjects{margin:0 0 22px;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 8px 30px rgba(29,48,35,.06)}
.my-subjects-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.my-subjects-head h2{margin:0;font-size:21px;letter-spacing:-.035em}.my-subjects-head p{margin:4px 0 0;color:var(--muted);font-size:12px}.my-edit{border:1px solid var(--line);background:transparent;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:800;cursor:pointer;color:var(--green)}
.my-list{display:flex;gap:9px;flex-wrap:wrap}.my-chip{border:0;background:var(--green);color:white;border-radius:13px;padding:12px 15px;min-height:44px;font-weight:800;cursor:pointer}.my-chip small{display:block;font-size:9px;opacity:.72;margin-top:2px;letter-spacing:.08em}
.my-empty{color:var(--muted);font-size:13px;padding:5px 0}.my-picker{margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}.my-picker[hidden]{display:none}.my-tabs{display:flex;gap:7px;margin-bottom:12px}.my-tab{border:1px solid var(--line);background:transparent;border-radius:99px;padding:8px 12px;font-size:12px;font-weight:800;cursor:pointer}.my-tab.active{background:var(--ink);color:#fff;border-color:var(--ink)}
.my-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.my-option{display:flex;align-items:center;gap:8px;border:1px solid var(--line);padding:10px;border-radius:11px;font-size:12px;background:#fff}.my-option input{width:18px;height:18px}.my-save{margin-top:13px;border:0;background:var(--green);color:#fff;border-radius:11px;padding:11px 16px;font-weight:800;cursor:pointer}.my-note{font-size:11px;color:var(--muted);margin-left:10px}
@media(max-width:700px){.my-options{grid-template-columns:1fr 1fr}.my-subjects{padding:16px}.my-chip{flex:1 1 calc(50% - 9px);text-align:left}}@media(max-width:420px){.my-options{grid-template-columns:1fr}.my-chip{flex-basis:100%}}
`;
document.head.appendChild(css);
const main=document.querySelector('main'); const examSwitch=document.querySelector('.exam-switch');
if(!main||!examSwitch) return;
const box=document.createElement('section'); box.className='my-subjects';
box.innerHTML=`<div class="my-subjects-head"><div><h2>Мои предметы</h2><p>Экзамены, которые ты сдаёшь — всегда под рукой</p></div><button type="button" class="my-edit">Изменить</button></div><div class="my-list"></div><div class="my-picker" hidden><div class="my-tabs"><button type="button" class="my-tab active" data-level="oge">ОГЭ · 9 класс</button><button type="button" class="my-tab" data-level="ege">ЕГЭ · 11 класс</button></div><div class="my-options"></div><div><button type="button" class="my-save">Сохранить предметы</button><span class="my-note">Можно выбрать несколько</span></div></div>`;
main.insertBefore(box,examSwitch);
const list=box.querySelector('.my-list'),picker=box.querySelector('.my-picker'),opts=box.querySelector('.my-options');
let level='oge';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}}
function save(v){localStorage.setItem(KEY,JSON.stringify(v))}
function keyOf(x){return x.level+'|'+x.name}
function renderList(){const selected=load();list.innerHTML='';if(!selected.length){list.innerHTML='<div class="my-empty">Выбери предметы, которые будешь сдавать — они появятся здесь сверху.</div>';picker.hidden=false;renderPicker();return}selected.forEach(item=>{const b=document.createElement('button');b.type='button';b.className='my-chip';b.innerHTML=`${item.name}<small>${item.level.toUpperCase()}</small>`;b.addEventListener('click',()=>openSubject(item));list.appendChild(b)})}
function renderPicker(){const selected=new Set(load().map(keyOf));const arr=level==='oge'?oge:ege;opts.innerHTML='';arr.forEach(name=>{const lab=document.createElement('label');lab.className='my-option';const input=document.createElement('input');input.type='checkbox';input.value=name;input.checked=selected.has(level+'|'+name);input.dataset.level=level;lab.append(input,document.createTextNode(name));opts.appendChild(lab)})}
function openSubject(item){const tab=[...document.querySelectorAll('.exam-button')].find(b=>b.dataset.exam===item.level);if(tab) tab.click();let tries=0;const timer=setInterval(()=>{tries++;const cards=[...document.querySelectorAll('#subjects .subject')];const target=cards.find(c=>c.textContent.toLowerCase().includes(item.name.toLowerCase().replace(' базовая','').replace(' профильная','')));if(target){clearInterval(timer);target.click()}else if(tries>15)clearInterval(timer)},60)}
box.querySelector('.my-edit').addEventListener('click',()=>{picker.hidden=!picker.hidden;if(!picker.hidden)renderPicker()});
box.querySelectorAll('.my-tab').forEach(t=>t.addEventListener('click',()=>{box.querySelectorAll('.my-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');level=t.dataset.level;renderPicker()}));
box.querySelector('.my-save').addEventListener('click',()=>{const prev=load().filter(x=>x.level!==level);const now=[...opts.querySelectorAll('input:checked')].map(i=>({level:i.dataset.level,name:i.value}));save([...prev,...now]);picker.hidden=true;renderList()});
renderList();
})();