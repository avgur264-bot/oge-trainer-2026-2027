(()=>{
'use strict';
const d=document;
const roomResult=d.querySelector('#roomResult');
const roomButton=d.querySelector('#roomOpen');
const createBtn=d.querySelector('#createRoom');
const joinBtn=d.querySelector('#joinRoom');
const joinInput=d.querySelector('#joinCode');
if(!roomResult||!createBtn||!joinBtn||!joinInput||typeof window.Peer==='undefined') return;

const NativePeer=window.Peer.__nativePeer || window.Peer;
let activePeer=null;
let activeConn=null;
let role=null;
let code='';
let retries=0;
const bridge=window.collabBridge=window.collabBridge||{};
Object.defineProperties(bridge,{role:{get:()=>role},connected:{get:()=>!!(activeConn&&activeConn.open)},code:{get:()=>code}});
bridge.send=data=>{if(activeConn&&activeConn.open)activeConn.send(data)};

function msg(text,bad=false){roomResult.innerHTML=`<div class="room-status"${bad?' style="background:#faecea"':''}>${text}</div>`;}
function errText(e){
 const t=e&&e.type?e.type:'unknown';
 const map={
  network:'Нет связи с сервером комнат. Откройте страницу в Safari/Chrome и проверьте VPN/фильтры сети.',
  'server-error':'Сервер комнат временно недоступен.',
  'socket-error':'Сетевое соединение с сервером комнат было заблокировано.',
  'socket-closed':'Соединение с сервером комнат закрылось.',
  'ssl-unavailable':'Защищённое соединение с сервером комнат недоступно.',
  'browser-incompatible':'Этот встроенный браузер не поддерживает нужный режим WebRTC. Откройте ссылку в Safari или Chrome.',
  'peer-unavailable':'Комната не найдена. Проверьте шестизначный код.',
  'unavailable-id':'Такой код комнаты уже занят. Создаём новый…',
  webrtc:'WebRTC-соединение не удалось. Частая причина — ограничения мобильной сети/NAT; попробуйте другую сеть или Safari/Chrome.'
 };
 return `${map[t]||'Ошибка соединения.'} <small style="display:block;margin-top:6px;opacity:.75">Код ошибки: ${t}</small>`;
}
function makePeer(id){
 // Use PeerJS Cloud defaults exactly as documented; only ICE config is supplied.
 return new NativePeer(id,{debug:1,config:{iceServers:[
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'}
 ],sdpSemantics:'unified-plan'}});
}
function cleanup(){try{if(activeConn)activeConn.close()}catch{};try{if(activePeer)activePeer.destroy()}catch{};activeConn=null;activePeer=null;}
function setConnected(){
 if(roomButton){roomButton.textContent=role==='tutor'?'● Комната '+code:'● На занятии';roomButton.classList.add('live');}
 msg(`Соединение установлено. ${role==='tutor'?'Выбирайте предмет — экран ученика синхронизируется.':'Ждите, пока репетитор выберет предмет.'}`);
}
function bind(c){
 activeConn=c;
 c.on('open',()=>{setConnected();if(role==='tutor'&&typeof window.shareCollabV4==='function')window.shareCollabV4();});
 c.on('data',data=>{try{if(typeof window.onCollabV4Data==='function'&&window.onCollabV4Data(data)!==false)return;if(typeof window.receiveShared==='function')window.receiveShared(data)}catch{}});
 c.on('close',()=>{if(roomButton){roomButton.textContent='Связь потеряна';roomButton.classList.remove('live');}msg('Связь потеряна. Создайте комнату заново.',true);});
 c.on('error',e=>msg(errText(e),true));
}
function attachPeerErrors(p,onUnavailable){
 p.on('error',e=>{
  if(e&&e.type==='unavailable-id'&&onUnavailable){onUnavailable();return;}
  msg(errText(e),true);
 });
 p.on('disconnected',()=>{ if(!p.destroyed){try{p.reconnect()}catch{}} });
}
function createRoom(){
 cleanup(); retries++;
 code=String(Math.floor(100000+Math.random()*900000)); role='tutor';
 msg('Создаём комнату…');
 activePeer=makePeer('oge2627-'+code);
 let opened=false;
 const timer=setTimeout(()=>{if(!opened)msg('Сервер комнат не ответил за 10 секунд. Если ссылка открыта внутри Telegram/WhatsApp, откройте её в Safari или Chrome.',true)},10000);
 activePeer.on('open',()=>{opened=true;clearTimeout(timer);retries=0;msg(`<b>Код комнаты</b><div class="room-code">${code}</div>Отправьте этот код ученику и дождитесь подключения.`)});
 activePeer.on('connection',bind);
 attachPeerErrors(activePeer,()=>{if(retries<4)createRoom();else msg('Не удалось подобрать свободный код комнаты. Попробуйте ещё раз.',true)});
}
function joinRoom(){
 cleanup();
 code=joinInput.value.replace(/\D/g,'');
 if(code.length!==6){msg('Введите шестизначный код комнаты.',true);return;}
 role='student';msg('Подключаемся…');
 activePeer=makePeer();
 let opened=false;
 const timer=setTimeout(()=>{if(!opened)msg('Сервер комнат не ответил за 10 секунд. Откройте ссылку в Safari/Chrome и попробуйте снова.',true)},10000);
 activePeer.on('open',()=>{opened=true;clearTimeout(timer);const c=activePeer.connect('oge2627-'+code,{reliable:true,serialization:'json'});bind(c);setTimeout(()=>{if(!c.open)msg('Комната найдена не была или прямое соединение заблокировано сетью. Проверьте код; при мобильном интернете попробуйте Wi‑Fi.',true)},12000)});
 attachPeerErrors(activePeer);
}

createBtn.onclick=createRoom;
joinBtn.onclick=joinRoom;
window.addEventListener('pagehide',cleanup,{once:true});
})();
