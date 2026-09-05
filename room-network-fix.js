(()=>{
'use strict';
const d=document,SERVER='wss://oge-room-server.avgur264.workers.dev';
const result=d.querySelector('#roomResult'),roomButton=d.querySelector('#roomOpen'),createBtn=d.querySelector('#createRoom'),joinBtn=d.querySelector('#joinRoom'),joinInput=d.querySelector('#joinCode'),roomDialog=d.querySelector('#roomDialog');
if(!result||!createBtn||!joinBtn||!joinInput||!window.WebSocket)return;

const css=d.createElement('style');
css.textContent=`
#collabWorkspace{width:min(680px,calc(100% - 24px));max-height:90vh;overflow:hidden;border:0;border-radius:24px;padding:0;background:#fffdf8;color:#17231d;box-shadow:0 24px 80px #071b1280}
#collabWorkspace::backdrop{background:#10271db8;backdrop-filter:blur(5px)}
#collabWorkspace *{max-width:100%;box-sizing:border-box}.cw-actions[hidden],.cw-actions button[hidden],.cw-log[hidden],.cw-compose[hidden],.cw-entry[hidden],.cw-review[hidden],#cwCodeBox[hidden]{display:none!important}.cw-wrap{padding:26px;max-height:min(90vh,calc(100dvh - 24px));overflow:auto;overscroll-behavior:contain}.cw-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.cw-head h2{margin:4px 0 6px;font-size:clamp(25px,5vw,38px)}
.cw-kicker{font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:#187653;font-weight:800}.cw-close{flex:0 0 auto;border:0;border-radius:50%;width:42px;height:42px;font-size:24px;cursor:pointer}
.cw-state{margin:18px 0;padding:14px 16px;border-radius:14px;background:#e8f6ef;color:#12603f;font-weight:700}.cw-state.wait{background:#fff4d7;color:#72520b}.cw-state.bad{background:#fae9e7;color:#8b2821}
.cw-entry{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.cw-entry-card{border:1px solid #d8dfd9;border-radius:16px;padding:18px;background:#fff}.cw-entry-card h3{margin:0 0 8px;font-size:22px}.cw-entry-card p{margin:0 0 16px;color:#667269;font-size:13px;line-height:1.5}.cw-entry-card input{width:100%;border:1px solid #ccd6cf;border-radius:12px;padding:13px;text-align:center;letter-spacing:.18em;font-size:16px;font-weight:800;margin-bottom:10px}.cw-entry-card button{width:100%;border:0;border-radius:12px;padding:13px 18px;background:#187653;color:white;font-weight:800;cursor:pointer}
.cw-code{font-size:30px;font-weight:900;letter-spacing:.25em;margin:8px 0 18px}.cw-actions{position:sticky;bottom:-1px;z-index:2;display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 0;padding:10px 0 0;background:#fffdf8;box-shadow:0 -10px 18px rgba(255,253,248,.92)}.cw-actions button,.cw-send{border:0;border-radius:12px;padding:13px 18px;background:#187653;color:white;font-weight:800;cursor:pointer}.cw-actions .secondary{background:#e8eee9;color:#183d2c}.cw-actions .leave{background:#fae9e7;color:#8b2821}
.cw-log{height:210px;overflow:auto;border:1px solid #d8dfd9;border-radius:15px;padding:12px;background:#fafbf8}.cw-msg{margin:7px 0;padding:9px 11px;border-radius:11px;background:#eef2ee;overflow-wrap:anywhere}.cw-msg.mine{background:#dff3e8;margin-left:30px}.cw-msg.system{background:#fff4d7;color:#62490e;text-align:center;font-size:14px}
.cw-compose{display:flex;gap:8px;margin-top:10px}.cw-compose input{min-width:0;flex:1;border:1px solid #ccd6cf;border-radius:12px;padding:13px;font-size:16px}.cw-send{flex:0 0 auto}
.cw-review{margin:12px 0;padding:14px;border:1px solid #cddbd2;border-radius:14px;background:#f4f8f5}.cw-review b,.cw-review span{display:block}.cw-review span{margin:8px 0;white-space:pre-wrap;overflow-wrap:anywhere}.cw-review-actions{display:flex;gap:8px}.cw-review-actions button{border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}.cw-ok{background:#187653;color:#fff}.cw-rework{background:#fae9e7;color:#8b2821}
@media(max-width:780px){#collabWorkspace{width:calc(100% - 20px);max-height:calc(100vh - 20px);max-height:calc(100dvh - 20px)}.cw-wrap{max-height:calc(100vh - 20px);max-height:calc(100dvh - 20px);padding-bottom:118px}.cw-actions{position:fixed;left:50%;right:auto;bottom:calc(var(--sab,env(safe-area-inset-bottom,0px)) + 10px);width:min(640px,calc(100% - 52px));transform:translateX(-50%);margin:0;padding:10px;border-radius:16px;box-shadow:0 -8px 26px rgba(255,253,248,.96),0 10px 30px rgba(7,27,18,.18)}}
@media(max-width:520px){#collabWorkspace{width:calc(100% - 16px);max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px);border-radius:20px}.cw-wrap{padding:18px 18px 118px;max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px)}.cw-head{gap:10px}.cw-head h2{font-size:28px}.cw-entry{grid-template-columns:1fr}.cw-entry-card{padding:16px}.cw-entry-card h3{font-size:20px}.cw-actions{display:grid;width:calc(100% - 36px)}.cw-actions button{width:100%;min-height:48px}.cw-actions .leave{order:-1}.cw-code{font-size:28px}.cw-log{height:150px}.cw-compose{flex-direction:column}.cw-send{width:100%}.cw-review-actions{display:grid}}
`;
d.head.append(css);

const panel=d.createElement('dialog');
panel.id='collabWorkspace';
panel.innerHTML=`<div class="cw-wrap"><div class="cw-head"><div><div class="cw-kicker">Совместное занятие</div><h2>Комната занятия</h2><div id="cwRole"></div></div><button class="cw-close" type="button" aria-label="Закрыть">×</button></div><div id="cwState" class="cw-state wait">Создайте комнату или введите код ученика.</div><div id="cwEntry" class="cw-entry"><section class="cw-entry-card"><h3>Я репетитор</h3><p>Создайте комнату, отправьте ученику код и выбирайте задания.</p><button id="cwCreateRoom" type="button">Создать комнату</button></section><section class="cw-entry-card"><h3>Я ученик</h3><p>Введите шестизначный код, который прислал репетитор.</p><input id="cwJoinCode" inputmode="numeric" maxlength="6" placeholder="000000" aria-label="Код комнаты"><button id="cwJoinRoom" type="button">Подключиться</button></section></div><div id="cwReview" class="cw-review" hidden><b>Ответ ученика</b><span id="cwAnswer"></span><div class="cw-review-actions"><button id="cwCorrect" class="cw-ok" type="button">Зачесть</button><button id="cwRework" class="cw-rework" type="button">Отправить на доработку</button></div></div><div id="cwCodeBox" hidden>Код для ученика<div id="cwCode" class="cw-code"></div></div><div id="cwActions" class="cw-actions"><button id="cwChoose" type="button" hidden>Выбрать задание</button><button id="cwCopy" class="secondary" type="button" hidden>Скопировать код</button><button id="cwLeave" class="leave" type="button" hidden>Выйти из комнаты</button><button id="cwCloseEntry" class="secondary" type="button">Закрыть</button></div><div id="cwLog" class="cw-log" aria-live="polite" hidden></div><form id="cwForm" class="cw-compose" hidden><input id="cwInput" maxlength="500" placeholder="Напишите сообщение…" autocomplete="off"><button class="cw-send" type="submit">Отправить</button></form></div>`;
d.body.append(panel);
const stateEl=panel.querySelector('#cwState'),roleEl=panel.querySelector('#cwRole'),entryEl=panel.querySelector('#cwEntry'),codeBox=panel.querySelector('#cwCodeBox'),codeEl=panel.querySelector('#cwCode'),chooseBtn=panel.querySelector('#cwChoose'),copyBtn=panel.querySelector('#cwCopy'),leaveBtn=panel.querySelector('#cwLeave'),closeEntryBtn=panel.querySelector('#cwCloseEntry'),actionsEl=panel.querySelector('#cwActions'),reviewBox=panel.querySelector('#cwReview'),answerEl=panel.querySelector('#cwAnswer'),log=panel.querySelector('#cwLog'),form=panel.querySelector('#cwForm'),input=panel.querySelector('#cwInput'),entryCreateBtn=panel.querySelector('#cwCreateRoom'),entryJoinBtn=panel.querySelector('#cwJoinRoom'),entryJoinInput=panel.querySelector('#cwJoinCode');
panel.querySelector('.cw-close').onclick=()=>panel.close();

let socket=null,role='',code='',opened=false,retries=0,reconnectTimer=0,leaving=false,roomEnded=false,studentSeen=false,lastSubmission=null;
const bridge=window.collabBridge=window.collabBridge||{};
Object.defineProperties(bridge,{role:{configurable:true,get:()=>role},connected:{configurable:true,get:()=>!!(socket&&socket.readyState===WebSocket.OPEN)},code:{configurable:true,get:()=>code}});
bridge.send=data=>{if(bridge.connected)socket.send(JSON.stringify(data))};

function status(text,bad=false){result.innerHTML=`<div class="room-status"${bad?' style="background:#faecea"':''}>${text}</div>`}
function panelState(text,kind=''){stateEl.textContent=text;stateEl.className='cw-state '+kind}
function syncLegacyRole(){try{if(typeof collabRole!=='undefined')collabRole=role||null}catch{}}
function addMessage(who,text,kind=''){
  const item=d.createElement('div');item.className='cw-msg '+kind;item.textContent=who?`${who}: ${text}`:text;log.append(item);log.scrollTop=log.scrollHeight;
}
function showPanel(){
  const active=!!(role&&code);
  roleEl.textContent=active?(role==='tutor'?'Вы вошли как репетитор':'Вы вошли как ученик'):'Выберите роль для совместного занятия';
  entryEl.hidden=active;
  codeBox.hidden=!active||role!=='tutor';
  chooseBtn.hidden=!active||role!=='tutor';
  copyBtn.hidden=!active||role!=='tutor';
  leaveBtn.hidden=!active;
  closeEntryBtn.hidden=active;
  actionsEl.hidden=false;
  log.hidden=!active;
  form.hidden=!active;
  if(!active){reviewBox.hidden=true;panelState('Создайте комнату или введите код ученика.','wait')}
  codeEl.textContent=code;
  if(roomDialog&&roomDialog.open)roomDialog.close();
  if(!panel.open)panel.showModal();
}
function closeSocket(){clearTimeout(reconnectTimer);if(socket){socket.onclose=null;try{socket.close()}catch{}}socket=null}
function connected(isRetry){
  opened=true;retries=0;syncLegacyRole();
  if(roomButton){roomButton.textContent=role==='tutor'?`● Комната ${code}`:'● На занятии';roomButton.classList.add('live')}
  const text=role==='tutor'?'Вход выполнен. Отправьте код ученику.':'Вход выполнен. Ждите задание репетитора.';
  status(text);panelState(text,role==='tutor'&&!studentSeen?'wait':'');showPanel();
  addMessage('',isRetry?'Связь восстановлена.':'Вход в комнату выполнен.','system');
  if(role==='tutor'&&typeof window.shareCollabV4==='function')window.shareCollabV4();
}
function connect(nextRole,nextCode,isRetry=false){
  closeSocket();role=nextRole;code=nextCode;opened=false;roomEnded=false;syncLegacyRole();
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
    if(data.type==='v4-chat'){if(data.from===role)return;addMessage(data.from==='tutor'?'Репетитор':'Ученик',String(data.text||''));return}
    if(data.type==='room-ended'){
      roomEnded=true;opened=false;closeSocket();panelState('Репетитор завершил комнату.','bad');status('Занятие завершено репетитором.',true);addMessage('','Комната закрыта.','system');
      if(roomButton){roomButton.textContent='Учимся вместе';roomButton.classList.remove('live')}roleEl.textContent='Занятие завершено';role='';code='';syncLegacyRole();if(!panel.open)panel.showModal();return;
    }
    if(data.type==='v4-draft'&&role==='tutor'){panelState(data.active?'Ученик отвечает…':'Ученик остановил ввод.','wait');return}
    if(data.type==='v4-submission'&&role==='tutor'){
      lastSubmission=data;answerEl.textContent=data.answer||'Ответ отправлен без текста';reviewBox.hidden=false;panelState('Получен ответ ученика. Проверьте его.');showPanel();addMessage('','Ученик отправил ответ.','system');
    }
    if(data.type==='v4-review'&&role==='student'){panelState(data.accepted?'Ответ зачтён репетитором.':'Репетитор просит доработать ответ.',data.accepted?'':'wait');addMessage('',data.accepted?'Ответ зачтён.':'Ответ отправлен на доработку.','system')}
    if(data.type==='v4-state'&&role==='student'&&panel.open)panel.close();
    if(typeof window.onCollabV4Data==='function'&&window.onCollabV4Data(data)!==false)return;
    if(typeof window.receiveShared==='function')window.receiveShared(data);
  };
  ws.onerror=()=>{};
  ws.onclose=()=>{
    clearTimeout(timer);if(ws!==socket||leaving||roomEnded)return;opened=false;
    if(roomButton){roomButton.textContent='Восстанавливаем связь…';roomButton.classList.remove('live')}
    panelState('Связь прервалась. Переподключаемся автоматически…','bad');status('Восстанавливаем связь с комнатой…',true);
    const delay=Math.min(1000*(2**Math.min(retries++,3)),8000);reconnectTimer=setTimeout(()=>connect(role,code,true),delay);
  };
}
function createRoom(){connect('tutor',String(Math.floor(100000+Math.random()*900000)))}
function joinRoom(){const next=(entryJoinInput.value||joinInput.value).replace(/\D/g,'');if(next.length!==6){status('Введите шестизначный код комнаты.',true);showPanel();return}entryJoinInput.value=next;joinInput.value=next;connect('student',next)}

panel.querySelector('#cwChoose').onclick=()=>{panel.close();const target=d.querySelector('#subjects')||d.querySelector('.subjects')||d.body;target.scrollIntoView({behavior:'smooth',block:'start'})};
panel.querySelector('#cwCopy').onclick=async()=>{try{await navigator.clipboard.writeText(code);addMessage('','Код скопирован.','system')}catch{addMessage('','Код комнаты: '+code,'system')}};
closeEntryBtn.onclick=()=>panel.close();
panel.querySelector('#cwCorrect').onclick=()=>{if(!lastSubmission)return;bridge.send({type:'v4-review',id:lastSubmission.id,accepted:true});reviewBox.hidden=true;panelState('Ответ зачтён. Можно дать следующее задание.');addMessage('','Ответ ученика зачтён.','system')};
panel.querySelector('#cwRework').onclick=()=>{if(!lastSubmission)return;bridge.send({type:'v4-review',id:lastSubmission.id,accepted:false});reviewBox.hidden=true;panelState('Ответ возвращён ученику на доработку.','wait');addMessage('','Ответ возвращён на доработку.','system')};
panel.querySelector('#cwLeave').onclick=()=>{
  leaving=true;roomEnded=true;closeSocket();role='';code='';opened=false;studentSeen=false;lastSubmission=null;reviewBox.hidden=true;syncLegacyRole();
  if(roomButton){roomButton.textContent='Учимся вместе';roomButton.classList.remove('live')}
  status('Вы вышли из комнаты. Можно создать новую комнату или подключиться снова.');
  panel.close();leaving=false;
};
panel.querySelector('#cwForm').onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text||!bridge.connected)return;bridge.send({type:'v4-chat',from:role,text});addMessage(role==='tutor'?'Репетитор':'Ученик',text,'mine');input.value=''};
entryCreateBtn.onclick=createRoom;
entryJoinBtn.onclick=joinRoom;
entryJoinInput.oninput=()=>{entryJoinInput.value=entryJoinInput.value.replace(/\D/g,'').slice(0,6);joinInput.value=entryJoinInput.value};
createBtn.onclick=createRoom;
joinBtn.onclick=joinRoom;
joinInput.oninput=()=>{joinInput.value=joinInput.value.replace(/\D/g,'').slice(0,6);entryJoinInput.value=joinInput.value};
if(roomButton)roomButton.onclick=()=>showPanel();
// Переключатель ОГЭ/ЕГЭ в базовом HTML открывает старый #roomDialog ученику. Перехватываем и показываем новую панель.
d.querySelectorAll('.exam-button').forEach(b=>{const prev=b.onclick;b.onclick=function(e){if(role==='student'){if(roomDialog&&roomDialog.open)roomDialog.close();panelState('Экзамен и предмет выбирает репетитор.','wait');showPanel();return}return prev?prev.call(this,e):undefined}});
if(roomDialog){const legacyShow=roomDialog.showModal.bind(roomDialog);roomDialog.showModal=()=>{if(role){panelState('Предмет выбирает репетитор. Дождитесь начала занятия.','wait');showPanel();return}legacyShow()}}
window.addEventListener('pagehide',()=>{leaving=true;closeSocket()},{once:true});
})();
