import http from 'node:http';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {catalog,blocked} from './public/world.js';
const scrypt=promisify(scryptCallback),root=fileURLToPath(new URL('./public/',import.meta.url));
const dir=process.env.DATA_DIR||fileURLToPath(new URL('./data/',import.meta.url));
await mkdir(dir,{recursive:true});
let db={users:[],reports:[],actions:[],appeals:[]};
try{db=JSON.parse(await readFile(dir+'/state.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
let saving=Promise.resolve();
function save(){const data=JSON.stringify(db); saving=saving.then(async()=>{await writeFile(dir+'/state.tmp',data);await rename(dir+'/state.tmp',dir+'/state.json');});return saving;}
const sessions=new Map(), limits=new Map(),messages=[];
const id=()=>randomBytes(18).toString('hex');
function fail(status,message){throw Object.assign(new Error(message),{status});}
function rate(key,max,ms){const now=Date.now(),a=(limits.get(key)||[]).filter(t=>now-t<ms);if(a.length>=max)fail(429,'Demasiadas tentativas. Aguarda um pouco.');a.push(now);limits.set(key,a);}
setInterval(()=>{const now=Date.now();for(const [k,v] of sessions)if(v.expires<now)sessions.delete(k);for(const [k,v] of limits)if(v.every(t=>now-t>3600000))limits.delete(k);},60000).unref();
const publicUser=u=>({id:u.id,name:u.name,x:u.x,y:u.y,coat:u.coat,hat:u.hat});
const me=u=>({...publicUser(u),coins:u.coins,inventory:u.inventory,role:u.role,mission:u.mission,muteUntil:u.muteUntil,suspendUntil:u.suspendUntil,actions:db.actions.filter(a=>a.target===u.id).map(({actor,...a})=>a),appeals:db.appeals.filter(a=>a.user===u.id)});
async function body(req){let data='';for await(const c of req){data+=c;if(data.length>8192)fail(413,'Pedido demasiado grande.');}try{return JSON.parse(data||'{}');}catch{fail(400,'JSON inválido.');}}
function str(v,min,max){if(typeof v!=='string'||v.trim().length<min||v.length>max)fail(400,'Texto inválido.');return v.trim();}
const server=http.createServer(async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 try{
 const url=new URL(req.url,'http://localhost'),path=url.pathname;
 if(!path.startsWith('/api/')){if(req.method!=='GET')fail(405,'Método inválido.');const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/world.js':'world.js'};if(!files[path])fail(404,'Não encontrado.');res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(await readFile(root+files[path]));return;}
 const origin=process.env.PUBLIC_ORIGIN||`http://localhost:${server.address().port}`;
 if(req.method==='POST'&&req.headers.origin!==origin)fail(403,'Origem inválida.');
 if(!['GET','POST'].includes(req.method))fail(405,'Método inválido.');
 const token=req.headers.cookie?.match(/(?:^|; )pc_session=([a-f0-9]+)/)?.[1],session=sessions.get(token);
 let user=session&&session.expires>Date.now()?db.users.find(u=>u.id===session.user):null;
 if(path==='/api/register'||path==='/api/login'){
 if(req.method!=='POST')fail(405,'Usa POST.');rate('auth:'+req.socket.remoteAddress,12,600000);const b=await body(req),name=str(b.name,3,20),password=str(b.password,12,128);if(!/^[\p{L}\p{N}_ -]+$/u.test(name))fail(400,'Nome inválido.');
 let u=db.users.find(u=>u.name.toLowerCase()===name.toLowerCase());
 if(path.endsWith('register')){if(u)fail(409,'Nome indisponível.');const salt=randomBytes(16).toString('hex'),hash=(await scrypt(password,salt,64)).toString('hex');if(db.users.some(u=>u.name.toLowerCase()===name.toLowerCase()))fail(409,'Nome indisponível.');u={id:id(),name,salt,hash,role:'player',x:5,y:6,coins:500,inventory:[],coat:'#77aaff',hat:false,mission:false,muteUntil:0,suspendUntil:0};db.users.push(u);await save();}
 else{const hash=await scrypt(password,u?.salt||'dummy-salt',64);if(!u||!timingSafeEqual(hash,Buffer.from(u.hash,'hex')))fail(401,'Credenciais inválidas.');}
 const t=id(),csrf=id();sessions.set(t,{user:u.id,csrf,expires:Date.now()+86400000});if(token)sessions.delete(token);res.setHeader('Set-Cookie',`pc_session=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${process.env.NODE_ENV==='production'?'; Secure':''}`);send(200,{me:me(u),csrf});return;
 }
 if(!user)fail(401,'Entra numa conta para continuar.');
 if(req.method==='POST'&&req.headers['x-csrf-token']!==session.csrf)fail(403,'Sessão inválida.');
 if(path==='/api/session'&&req.method==='GET'){send(200,{me:me(user),csrf:session.csrf});return;}
 if(path==='/api/logout'&&req.method==='POST'){sessions.delete(token);res.setHeader('Set-Cookie','pc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');send(200,{ok:true});return;}
 if(path==='/api/appeal'&&req.method==='POST'){rate('appeal:'+user.id,3,3600000);const b=await body(req);const action=db.actions.find(a=>a.id===b.action&&a.target===user.id);if(!action)fail(404,'Medida não encontrada.');if(db.appeals.some(a=>a.action===action.id&&a.status==='pending'))fail(409,'Já existe um recurso pendente.');db.appeals.push({id:id(),user:user.id,action:action.id,text:str(b.text,10,1000),status:'pending',at:Date.now()});await save();send(200,{ok:true});return;}
 if(user.suspendUntil>Date.now()&&!path.startsWith('/api/admin'))fail(403,'Conta suspensa. Podes consultar a medida e recorrer no menu Comunidade.');
 if(path==='/api/state'&&req.method==='GET'){session.seen=Date.now();const online=new Set([...sessions.values()].filter(s=>s.seen>Date.now()-15000).map(s=>s.user));send(200,{me:me(user),players:db.users.filter(u=>online.has(u.id)&&u.suspendUntil<Date.now()).map(publicUser),messages:messages.slice(-60)});return;}
 if(path.startsWith('/api/admin')){
 if(user.role!=='admin')fail(403,'Acesso reservado à administração.');
 if(path==='/api/admin'&&req.method==='GET'){send(200,{users:db.users.map(u=>({...publicUser(u),role:u.role})),reports:db.reports,actions:db.actions,appeals:db.appeals});return;}
 const b=await body(req);if(path==='/api/admin/action'&&req.method==='POST'){const target=db.users.find(u=>u.id===b.target);if(!target)fail(404,'Jogador inexistente.');if(!['warn','mute','suspend','restore'].includes(b.kind))fail(400,'Medida inválida.');const reason=str(b.reason,10,500);if(b.kind==='mute')target.muteUntil=Date.now()+1800000;if(b.kind==='suspend')target.suspendUntil=Date.now()+86400000;if(b.kind==='restore'){target.muteUntil=0;target.suspendUntil=0;}db.actions.push({id:id(),target:target.id,actor:user.id,kind:b.kind,reason,at:Date.now()});await save();send(200,{ok:true});return;}
 if(path==='/api/admin/appeal'&&req.method==='POST'){const appeal=db.appeals.find(a=>a.id===b.id);if(!appeal||appeal.status!=='pending')fail(400,'Recurso inválido.');if(!['accepted','rejected'].includes(b.status))fail(400,'Decisão inválida.');appeal.reason=str(b.reason,10,500);appeal.status=b.status;appeal.reviewer=user.id;appeal.reviewedAt=Date.now();if(b.status==='accepted'){const target=db.users.find(u=>u.id===appeal.user);target.muteUntil=0;target.suspendUntil=0;db.actions.push({id:id(),target:target.id,actor:user.id,kind:'restore',reason:appeal.reason,at:Date.now()});}await save();send(200,{ok:true});return;}
 fail(404,'Não encontrado.');}
 if(req.method!=='POST')fail(404,'Não encontrado.');const b=await body(req);
 if(path==='/api/move'){rate('move:'+user.id,7,1000);if(!Number.isInteger(b.dx)||!Number.isInteger(b.dy)||Math.abs(b.dx)+Math.abs(b.dy)!==1)fail(400,'Movimento inválido.');if(blocked(user.x+b.dx,user.y+b.dy))fail(409,'Caminho ocupado.');user.x+=b.dx;user.y+=b.dy;}
 else if(path==='/api/buy'){const item=catalog.find(i=>i.id===b.item);if(!item)fail(400,'Artigo inválido.');if(!user.inventory.includes(item.id)){if(user.coins<item.price)fail(409,'Moedas insuficientes.');user.coins-=item.price;user.inventory.push(item.id);}if(item.kind==='coat')user.coat=item.color;else user.hat=!user.hat;}
 else if(path==='/api/npc'){if(Math.abs(user.x-4)+Math.abs(user.y-2)>2)fail(409,'Aproxima-te da Lia, junto ao néon.');if(!user.mission){user.coins+=100;user.mission=true;}}
 else if(path==='/api/chat'){rate('chat:'+user.id,4,10000);if(user.muteUntil>Date.now())fail(403,'Chat silenciado temporariamente. Podes recorrer em Comunidade.');const text=str(b.text,1,240);if(/https?:\/\/|www\./i.test(text))fail(400,'Links desativados nesta versão.');if(/\b(idiota|estupido|merda)\b/i.test(text.normalize('NFD').replace(/\p{Diacritic}/gu,'')))fail(400,'Reformula a mensagem com respeito. O filtro é apenas demonstrativo.');messages.push({id:id(),user:user.id,name:user.name,text,at:Date.now()});if(messages.length>100)messages.shift();}
 else if(path==='/api/report'){rate('report:'+user.id,5,3600000);const message=messages.find(m=>m.id===b.message);if(!message)fail(404,'Mensagem já não disponível.');db.reports.push({id:id(),reporter:user.id,target:message.user,message:{...message},reason:str(b.reason,5,500),at:Date.now()});}
 else if(path==='/api/checkout')fail(503,'Pagamentos reais desativados. Nenhuma cobrança foi criada.');
 else fail(404,'Não encontrado.');
 await save();send(200,{me:me(user)});
 }catch(e){send(e.status||500,{error:e.status?e.message:'Erro interno. Tenta novamente.'});}
});
server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log(`Pixel City 2000: http://localhost:${server.address().port}`));
