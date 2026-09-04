(()=>{
'use strict';
const d=document,SERVER='wss://oge-room-server.avgur264.workers.dev';
const roomResult=d.querySelector('#roomResult'),roomButton=d.querySelector('#roomOpen'),createBtn=d.querySelector('#createRoom'),joinBtn=d.querySelector('#joinRoom'),joinInput=d.querySelector('#joinCode');
if(!roomResult||!createBtn||!joinBtn||!joinInput||!window.WebSocket)return;
let activeConn=null,role=null,code='',opened=false;
const bridge=window.collabBridge=window.collabBridge||{};
Object.defineProperties(bridge,{role:{get:()=>role},connected:{get:()=>!!(activeConn&&activeConn.readyState===WebSocket.OPEN)},code:{get:()=>code}});
bridge.send=data=>{if(bridge.connected)activeConn.send(JSON.stringify(data))};
function msg(text,bad=false){roomResult.innerHTML=`<div class="room-status"${bad?' style="background:#faecea"':''}>${text}</div>`}
function cleanup(){if(activeConn){try{activeConn.close()}catch{}}activeConn=null;opened=false}
function setConnected(){opened=true;if(roomButton){roomButton.textContent=role==='tutor'?'● Комната '+code:'● На занятии';roomButton.classList.add('live')}msg(`Соединение с сервером установлено. ${role==='tutor'?'Отправьте код ученику и выберите задание.':'Ждите, пока репетитор выберет задание.'}`)}
function connect(nextRole,nextCode){cleanup();role=nextRole;code=nextCode;msg('Подключаемся к комнате…');const ws=activeConn=new WebSocket(`${SERVER}/room/${code}?role=${role}`);const timer=setTimeout(()=>{if(!opened){try{ws.close()}catch{}msg('Сервер комнат не ответил. Проверьте интернет и повторите попытку.',true)}},12000);ws.onopen=()=>{clearTimeout(timer);setConnected();if(role==='tutor'&&typeof window.shareCollabV4==='function')window.shareCollabV4()};ws.onmessage=ev=>{let data;try{data=JSON.parse(ev.data)}catch{return}if(data.type==='presence'){if(role==='tutor')msg(`<b>Код комнаты</b><div class="room-code">${code}</div>${data.student?'Ученик подключён. Можно начинать.':'Отправьте код ученику и дождитесь подключения.'}`);return}if(typeof window.onCollabV4Data==='function'&&window.onCollabV4Data(data)!==false)return;if(typeof window.receiveShared==='function')window.receiveShared(data)};ws.onerror=()=>msg('Ошибка сервера комнат. Повторите подключение.',true);ws.onclose=()=>{clearTimeout(timer);if(opened){opened=false;if(roomButton){roomButton.textContent='Связь потеряна';roomButton.classList.remove('live')}msg('Связь потеряна. Подключитесь к комнате заново.',true)}}}
createBtn.onclick=()=>connect('tutor',String(Math.floor(100000+Math.random()*900000)));
joinBtn.onclick=()=>{const next=joinInput.value.replace(/\D/g,'');if(next.length!==6){msg('Введите шестизначный код комнаты.',true);return}connect('student',next)};
window.addEventListener('pagehide',cleanup,{once:true});
})();
