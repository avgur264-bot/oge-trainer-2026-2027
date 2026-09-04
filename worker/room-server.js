const ORIGIN='https://avgur264-bot.github.io';
const cors={
  'Access-Control-Allow-Origin':ORIGIN,
  'Access-Control-Allow-Methods':'GET,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Cache-Control':'no-store'
};

export default {
  async fetch(request,env){
    if(request.method==='OPTIONS') return new Response(null,{headers:cors});
    const url=new URL(request.url);
    if(url.pathname==='/health') return Response.json({ok:true,service:'oge-room-server',version:'20270904-4'},{headers:cors});
    const m=url.pathname.match(/^\/room\/(\d{6})$/);
    if(!m) return new Response('Not found',{status:404,headers:cors});
    if(request.headers.get('Upgrade')!=='websocket') return new Response('WebSocket required',{status:426,headers:cors});
    const role=url.searchParams.get('role');
    if(role!=='tutor'&&role!=='student') return new Response('Invalid role',{status:400,headers:cors});
    const id=env.ROOMS.idFromName(m[1]);
    return env.ROOMS.get(id).fetch(request);
  }
};

export class Room {
  constructor(state){this.state=state;this.sessions=new Map();this.lastState=null;this.endTimer=null;}
  async fetch(request){
    if(request.headers.get('Upgrade')!=='websocket') return new Response('WebSocket required',{status:426});
    const url=new URL(request.url);
    const role=url.searchParams.get('role');
    if(role==='tutor'&&this.count('tutor'))return new Response('Tutor already connected',{status:409});
    if(role==='student'&&!this.count('tutor'))return new Response('Room not found',{status:404});
    if(role==='student'&&this.count('student'))return new Response('Student already connected',{status:409});
    if(role==='tutor'&&this.endTimer){clearTimeout(this.endTimer);this.endTimer=null;}
    const pair=new WebSocketPair();
    const client=pair[0], server=pair[1];
    server.accept();
    const sid=crypto.randomUUID();
    this.sessions.set(sid,{ws:server,role});
    server.send(JSON.stringify({type:'hello',role}));
    this.broadcast({type:'presence',tutor:this.count('tutor'),student:this.count('student')});
    if(role==='student'&&this.lastState)server.send(JSON.stringify(this.lastState));
    server.addEventListener('message',ev=>{
      let data; try{data=JSON.parse(ev.data)}catch{return}
      if(!data||typeof data!=='object')return;
      if(role==='student'&&(data.type==='state'||data.type==='v4-state'))return;
      if(role==='tutor'&&(data.type==='answer'||data.type==='v4-answer'))return;
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
