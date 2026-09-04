(()=>{
'use strict';
const d=document,SERVER='wss://oge-room-server.avgur264.workers.dev';
const result=d.querySelector('#roomResult'),roomButton=d.querySelector('#roomOpen'),createBtn=d.querySelector('#createRoom'),joinBtn=d.querySelector('#joinRoom'),joinInput=d.querySelector('#joinCode'),roomDialog=d.querySelector('#roomDialog');
if(!result||!createBtn||!joinBtn||!joinInput||!window.WebSocket)return;

const css=d.createElement('style');
css.textContent=`
#collabWorkspace{width:min(680px,calc(100% - 24px));max-height:90vh;border:0;border-radius:24px;padding:0;background:#fffdf8;color:#17231d;box-shadow:0 24px 80px #071b1280}
#collabWorkspace::backdrop{background:#10271db8;backdrop-filter:blur(5px)}
.cw-wrap{padding:26px}.cw-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.cw-head h2{margin:4px 0 6px;font-size:clamp(25px,5vw,38px)}
.cw-kicker{font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:#187653;font-weight:800}.cw-close{border:0;border-radius:50%;width:42px;height:42px;font-size:24px;cursor:pointer}
.cw-state{margin:18px 0;padding:14px 16px;border-radius:14px;background:#e8f6ef;color:#12603f;font-weight:700}.cw-state.wait{background:#fff4d7;color:#72520b}.cw-state.bad{background:#fae9e7;color:#8b2821}
.cw-code{font-size:30px;font-weight:900;letter-spacing:.25em;margin:8px 0 18px}.cw-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.cw-actions button,.cw-send{border:0;border-radius:12px;padding:13px 18px;background:#187653;color:white;font-weight:800;cursor:pointer}.cw-actions .secondary{background:#e8eee9;color:#183d2c}.cw-actions .leave{background:#fae9e7;color:#8b2821}
.cw-log{height:210px;overflow:auto;border:1px solid #d8dfd9;border-radius:15px;padding:12px;background:#fafbf8}.cw-msg{margin:7px 0;padding:9px 11px;border-radius:11px;background:#eef2ee}.cw-msg.mine{background:#dff3e8;margin-left:30px}.cw-msg.system{background:#fff4d7;color:#62490e;text-align:center;font-size:14px}
.cw-compose{display:flex;gap:8px;margin-top:10px}.cw-compose input{min-width:0;flex:1;border:1px solid #ccd6cf;border-radius:12px;padding:13px;font-size:16px}
@media(max-width:520px){.cw-wrap{padding:20px}.cw-log{height:180px}.cw-compose{flex-direction:column}.cw-send{width:100%}}
`;
d.head.append(css);

const panel=d.createElement('dialog');
panel.id='collabWorkspace';
panel.innerHTML=`<div class="cw-wrap"><div class="cw-head"><div><div class="cw-kicker">Совместное занятие</div><h2>Комната занятия</h2><div id="cwRole"></div></div><button class="cw-close" type="button" aria-label="Закрыть">×</button></div><div id="cwState" class="cw-state wait">Подключаемся…</div><div id="cwCodeBox" hidden>Код для ученика<div id="cwCode" class="cw-code"></div></div><div class="cw-actions"><button id="cwChoose" type="button">Выбрать задание</button><button id="cwCopy" class="secondary" type="button">Скопировать код</button><button id="cwLeave" class="leave" type="button">Выйти из комнаты</button></div><div id="cwLog" class="cw-log" aria-live="polite"></div><form id="cwForm" class="cw-compose"><input id="cwInput" maxlength="500" placeholder="Напишите сообщение…" autocomplete="off"><button class="cw-send" type="submit">Отправить</button></form></div>`;
d.body.append(panel);
const stateEl=panel.querySelector('#cwState'),roleEl=panel.querySelector('#cwRole'),codeBox=panel.querySelector('#cwCodeBox'),codeEl=panel.querySelector('#cwCode'),chooseBtn=panel.querySelector('#cwChoose'),copyBtn=panel.querySelector('#cwCopy'),log=panel.querySelector('#cwLog'),input=panel.querySelector('#cwInput');
panel.querySelector('.cw-close').onclick=()=>panel.close();

let socket=null,role='',code='',opened=false,retries=0,reconnectTimer=0,leaving=false,studentSeen=false;
const bridge=window.collabBridge=window.collabBridge||{};
Object.defineProperties(bridge,{role:{configurable:true,get:()=>role},connected:{configurable:true,get:()=>!!(socket&&socket.readyState===WebSocket.OPEN)},code:{configurable:true,get:()=>code}});
bridge.send=data=>{if(bridge.connected)socket.send(JSON.stringify(data))};

function status(text,bad=false){result.innerHTML=`<div class="room-status"${bad?' style="background:#faecea"':''}>${text}</div>`}
function panelState(text,kind=''){stateEl.textContent=text;stateEl.className='cw-state '+kind}
function addMessage(who,text,kind=''){
  const item=d.createElement('div');item.className='cw-msg '+kind;item.textContent=who?`${who}: ${text}`:text;log.append(item);log.scrollTop=log.scrollHeight;
}
function showPanel(){
  roleEl.textContent=role==='tutor'?'Вы вошли как репетитор':'Вы вошли как ученик';
  codeBox.hidden=role!=='tutor';chooseBtn.hidden=role!=='tutor';copyBtn.hidden=role!=='tutor';codeEl.textContent=code;
  if(roomDialog&&roomDialog.open)roomDialog.close();
  if(!panel.open)panel.showModal();
}
function closeSocket(){clearTimeout(reconnectTimer);if(socket){socket.onclose=null;try{socket.close()}catch{}}socket=null}
function connected(isRetry){
  opened=true;retries=0;
  if(roomButton){roomButton.textContent=role==='tutor'?`● Комната ${code}`:'● На занятии';roomButton.classList.add('live')}
  const text=role==='tutor'?'Вход выполнен. Отправьте код ученику.':'Вход выполнен. Ждите задание репетитора.';
  status(text);panelState(text,role==='tutor'&&!studentSeen?'wait':'');showPanel();
  addMessage('',isRetry?'Связь восстановлена.':'Вход в комнату выполнен.','system');
  if(role==='tutor'&&typeof window.shareCollabV4==='function')window.shareCollabV4();
}
function connect(nextRole,nextCode,isRetry=false){
  closeSocket();role=nextRole;code=nextCode;opened=false;
  if(!isRetry){studentSeen=false;log.replaceChildren();status('Подключаемся к комнате…');panelState('Подключаемся…','wait');showPanel()}
  const ws=socket=new WebSocket(`${SERVER}/room/${code}?role=${role}`);
  const timer=setTimeout(()=>{if(ws===socket&&!opened)try{ws.close()}catch{}},12000);
  ws.onopen=()=>{clearTimeout(timer);if(ws===socket)connected(isRetry)};
  ws.onmessage=ev=>{
    let data;try{data=JSON.parse(ev.data)}catch{return}
    if(data.type==='presence'){
      if(role==='tutor'){
        const hasStudent=Number(data.student)>0;
        panelState(hasStudent?'Ученик подключён. Можно начинать.':'Комната создана. Ждём ученика.',hasStudent?'':'wait');
        status(`<b>Код комнаты</b><div class="room-code">${code}</div>${hasStudent?'Ученик подключён. Можно начинать.':'Отправьте код ученику и дождитесь подключения.'}`);
        if(hasStudent&&!studentSeen){studentSeen=true;addMessage('','Ученик вошёл в комнату.','system')}
      }
      return;
    }
    if(data.type==='v4-chat'){addMessage(data.from==='tutor'?'Репетитор':'Ученик',String(data.text||''));return}
    if(data.type==='v4-state'&&role==='student'&&panel.open)panel.close();
    if(typeof window.onCollabV4Data==='function'&&window.onCollabV4Data(data)!==false)return;
    if(typeof window.receiveShared==='function')window.receiveShared(data);
  };
  ws.onerror=()=>{};
  ws.onclose=()=>{
    clearTimeout(timer);if(ws!==socket||leaving)return;opened=false;
    if(roomButton){roomButton.textContent='Восстанавливаем связь…';roomButton.classList.remove('live')}
    panelState('Связь прервалась. Переподключаемся автоматически…','bad');status('Восстанавливаем связь с комнатой…',true);
    const delay=Math.min(1000*(2**Math.min(retries++,3)),8000);reconnectTimer=setTimeout(()=>connect(role,code,true),delay);
  };
}

panel.querySelector('#cwChoose').onclick=()=>{panel.close();const target=d.querySelector('#subjects')||d.querySelector('.subjects')||d.body;target.scrollIntoView({behavior:'smooth',block:'start'})};
panel.querySelector('#cwCopy').onclick=async()=>{try{await navigator.clipboard.writeText(code);addMessage('','Код скопирован.','system')}catch{addMessage('','Код комнаты: '+code,'system')}};
panel.querySelector('#cwLeave').onclick=()=>{
  leaving=true;closeSocket();role='';code='';opened=false;studentSeen=false;
  if(roomButton){roomButton.textContent='Учимся вместе';roomButton.classList.remove('live')}
  status('Вы вышли из комнаты. Можно создать новую комнату или подключиться снова.');
  panel.close();leaving=false;
};
panel.querySelector('#cwForm').onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text||!bridge.connected)return;bridge.send({type:'v4-chat',from:role,text});addMessage(role==='tutor'?'Репетитор':'Ученик',text,'mine');input.value=''};
createBtn.onclick=()=>connect('tutor',String(Math.floor(100000+Math.random()*900000)));
joinBtn.onclick=()=>{const next=joinInput.value.replace(/\D/g,'');if(next.length!==6){status('Введите шестизначный код комнаты.',true);return}connect('student',next)};
if(roomButton)roomButton.onclick=()=>{if(role&&code)showPanel();else if(roomDialog&&!roomDialog.open)roomDialog.showModal()};
window.addEventListener('pagehide',()=>{leaving=true;closeSocket()},{once:true});
})();
