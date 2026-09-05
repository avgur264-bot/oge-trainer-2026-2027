const VERSION='20270905-1';
const ORIGINS=new Set(['https://avgur264-bot.github.io']);
const cors={
  'Access-Control-Allow-Origin':'https://avgur264-bot.github.io',
  'Access-Control-Allow-Methods':'GET,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Cache-Control':'no-store'
};
// Типы сообщений, которые сервер принимает от каждой роли. Всё остальное отбрасывается.
// Служебные типы (hello, presence, room-ended) создаёт только сервер.
const ALLOWED={
  tutor:new Set(['v4-state','v4-review','v4-chat','state']),
  student:new Set(['v4-draft','v4-submission','v4-chat','answer'])
};
const MAX_MESSAGE_BYTES=16*1024;   // один WebSocket-кадр
const MAX_MESSAGES_PER_WINDOW=30;  // на одно соединение
const RATE_WINDOW_MS=10*1000;
const MAX_JOINS_PER_IP=12;         // попыток входа ученика с одного IP
const JOIN_WINDOW_MS=60*1000;

export default {
  async fetch(request,env){
    if(request.method==='OPTIONS') return new Response(null,{headers:cors});
    const url=new URL(request.url);
    if(url.pathname==='/health') return Response.json({ok:true,service:'oge-room-server',version:VERSION},{headers:cors});
    const m=url.pathname.match(/^\/room\/(\d{6})$/);
    if(!m) return new Response('Not found',{status:404,headers:cors});
    if(request.headers.get('Upgrade')!=='websocket') return new Response('WebSocket required',{status:426,headers:cors});
    const origin=request.headers.get('Origin');
    if(!origin||!ORIGINS.has(origin)) return new Response('Forbidden origin',{status:403,headers:cors});
    const role=url.searchParams.get('role');
    if(role!=='tutor'&&role!=='student') return new Response('Invalid role',{status:400,headers:cors});
    if(role==='student'&&env.LIMITER){
      const ip=request.headers.get('CF-Connecting-IP')||'unknown';
      const limiter=env.LIMITER.get(env.LIMITER.idFromName(ip));
      const verdict=await limiter.fetch('https://limiter/join');
      if(verdict.status===429) return new Response('Too many attempts, try later',{status:429,headers:cors});
    }
    const id=env.ROOMS.idFromName(m[1]);
    return env.ROOMS.get(id).fetch(request);
  }
};

// Ограничитель попыток входа ученика: один объект на IP, скользящее окно в памяти.
export class JoinLimiter {
  constructor(state){this.state=state;this.hits=[];}
  async fetch(){
    const now=Date.now();
    this.hits=this.hits.filter(t=>now-t<JOIN_WINDOW_MS);
    if(this.hits.length>=MAX_JOINS_PER_IP) return new Response('limit',{status:429});
    this.hits.push(now);
    return new Response('ok');
  }
}

export class Room {
  constructor(state){this.state=state;this.sessions=new Map();this.lastState=null;this.endTimer=null;}
  async fetch(request){
    if(request.headers.get('Upgrade')!=='websocket') return new Response('WebSocket required',{status:426});
    const url=new URL(request.url);
    const role=url.searchParams.get('role');
    if(role!=='tutor'&&role!=='student')return new Response('Invalid role',{status:400});
    if(role==='tutor'&&this.count('tutor'))return new Response('Tutor already connected',{status:409});
    if(role==='student'&&!this.count('tutor'))return new Response('Room not found',{status:404});
    if(role==='student'&&this.count('student'))return new Response('Student already connected',{status:409});
    if(role==='tutor'&&this.endTimer){clearTimeout(this.endTimer);this.endTimer=null;}
    const pair=new WebSocketPair();
    const client=pair[0], server=pair[1];
    server.accept();
    const sid=crypto.randomUUID();
    const session={ws:server,role,stamps:[]};
    this.sessions.set(sid,session);
    server.send(JSON.stringify({type:'hello',role}));
    this.broadcast({type:'presence',tutor:this.count('tutor'),student:this.count('student')});
    if(role==='student'&&this.lastState)server.send(JSON.stringify(this.lastState));
    server.addEventListener('message',ev=>{
      const raw=ev.data;
      if(typeof raw!=='string'||raw.length>MAX_MESSAGE_BYTES)return;
      const now=Date.now();
      session.stamps=session.stamps.filter(t=>now-t<RATE_WINDOW_MS);
      if(session.stamps.length>=MAX_MESSAGES_PER_WINDOW)return;
      session.stamps.push(now);
      let data; try{data=JSON.parse(raw)}catch{return}
      if(!data||typeof data!=='object'||Array.isArray(data))return;
      if(typeof data.type!=='string'||!ALLOWED[role].has(data.type))return;
      // Роль отправителя всегда проставляет сервер, клиентское поле не учитывается.
      data.from=role;
      if(data.type==='v4-chat'){
        data.text=String(data.text??'').slice(0,500);
        if(!data.text.trim())return;
      }
      if(role==='tutor'&&data.type==='v4-state')this.lastState=data;
      this.broadcast(data,sid);
    });
    let closed=false;
    const close=()=>{
      if(closed)return;closed=true;this.sessions.delete(sid);
      this.broadcast({type:'presence',tutor:this.count('tutor'),student:this.count('student')});
      if(role==='tutor'&&!this.count('tutor'))this.endTimer=setTimeout(()=>{
        if(this.count('tutor'))return;
        this.broadcast({type:'room-ended',reason:'tutor-left'});this.lastState=null;
        for(const [id,s] of this.sessions){try{s.ws.close(1000,'Room ended')}catch{}this.sessions.delete(id)}
      },12000);
    };
    server.addEventListener('close',close);
    server.addEventListener('error',close);
    return new Response(null,{status:101,webSocket:client});
  }
  count(role){let n=0;for(const s of this.sessions.values())if(s.role===role)n++;return n;}
  broadcast(data,except){
    const text=JSON.stringify(data);
    for(const [id,s] of this.sessions){if(id===except)continue;try{s.ws.send(text)}catch{this.sessions.delete(id)}}
  }
}
