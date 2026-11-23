import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {defaultAppearance,rooms,blocked} from '../public/world.js';

async function harness(t) {
  const dir=await mkdtemp(join(tmpdir(),'pixel-rooms-'));
  let process,base;
  async function start(){
    await new Promise((resolve,reject)=>{
      process=spawn(globalThis.process.execPath,['server.mjs'],{
        cwd:new URL('../',import.meta.url),
        env:{...globalThis.process.env,PORT:'0',DATA_DIR:dir,PUBLIC_ORIGIN:'',NODE_ENV:'test'},
        stdio:['ignore','pipe','pipe'],
      });
      const timeout=setTimeout(()=>reject(new Error('Server startup timed out')),10000);
      process.once('error',e=>{clearTimeout(timeout);reject(e);});
      process.stdout.once('data',b=>{clearTimeout(timeout);base=b.toString().trim().split(' ').at(-1);resolve();});
    });
  }
  async function stop(){if(process?.exitCode===null)await new Promise(r=>{process.once('exit',r);process.kill();});}
  t.after(async()=>{await stop();await rm(dir,{recursive:true,force:true});});
  async function call(path,data,session={}){
    const response=await fetch(base+'/api/'+path,{
      method:data?'POST':'GET',
      headers:{Cookie:session.cookie||'',...(data?{Origin:base,'Content-Type':'application/json','X-CSRF-Token':session.csrf||''}:{})},
      body:data?JSON.stringify(data):undefined,
    });
    return {status:response.status,...await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  await start();return {dir,start,stop,call};
}

test('room presence, chat, collisions and NPC rewards stay in the selected room',async t=>{
  const {call}=await harness(t);
  const a=await call('register',{name:'Alice',password:'alice-password-test'});
  const b=await call('register',{name:'Bobby',password:'bobby-password-test'});
  await call('state',undefined,b);
  await call('chat',{text:'Plaza only',room:'plaza'},b);
  let state=await call('state',undefined,a);
  assert.equal(state.players.length,2);
  const plazaMessage=state.messages[0].id;
  assert.equal((await call('room',{room:'not-a-room'},a)).status,400);
  assert.equal((await call('room',{room:'__proto__'},a)).status,400);
  const changed=await call('room',{room:'garden'},a);
  assert.equal(changed.status,200);
  assert.deepEqual({x:changed.me.x,y:changed.me.y},rooms.garden.spawn);
  state=await call('state',undefined,a);
  assert.deepEqual(state.players.map(p=>p.id),[a.me.id]);
  assert.equal(state.messages.length,0);
  assert.equal((await call('report',{message:plazaMessage,reason:'Cross-room report'},a)).status,404);
  assert.equal((await call('move',{dx:0,dy:-1,room:'plaza'},a)).status,409);
  assert.equal((await call('chat',{text:'Stale client',room:'plaza'},a)).status,409);
  const step=(dx,dy)=>call('move',{dx,dy,room:'garden'},a);
  assert.equal((await step(0,-1)).status,200);
  assert.equal((await step(0,-1)).status,200);
  assert.equal((await step(1,0)).status,409); // Seat at (6,5), free in the plaza.
  assert.equal((await step(0,-1)).status,200);
  assert.equal((await step(0,-1)).status,200);
  const npc=await call('npc',{},a);
  assert.equal(npc.status,200);
  assert.equal(npc.me.coins,500);
  assert.equal(npc.me.mission,false);
  await call('chat',{text:'Garden only',room:'garden'},a);
  state=await call('state',undefined,b);
  assert.deepEqual(state.players.map(p=>p.id),[b.me.id]);
  assert.deepEqual(state.messages.map(m=>m.text),['Plaza only']);
  await call('room',{room:'garden'},b);
  state=await call('state',undefined,b);
  assert.equal(state.players.length,2);
  assert.deepEqual(state.messages.map(m=>m.text),['Garden only']);
  await call('room',{room:'plaza'},a);
  state=await call('state',undefined,a);
  assert.deepEqual(state.messages.map(m=>m.text),['Plaza only']);
  for(const room of Object.values(rooms))assert.equal(blocked(room.spawn.x,room.spawn.y,room.id),false);
});

test('appearance validates ownership, is shared, persists and migrates old accounts',async t=>{
  const {call,stop,start,dir}=await harness(t);
  let a=await call('register',{name:'Stylist',password:'stylist-password-test'});
  const look={skin:'#784d38',hair:'#e5c67b',style:'crest',coat:'default',hat:false};
  assert.deepEqual(a.me.appearance,defaultAppearance);
  assert.equal((await call('appearance',{...look,skin:'red'},a)).status,400);
  assert.equal((await call('appearance',{...look,coat:'neon'},a)).status,403);
  assert.equal((await call('appearance',{...look,hat:true},a)).status,403);
  assert.equal((await call('appearance',{...look,style:'unknown'},a)).status,400);
  await call('buy',{item:'neon'},a);
  await call('buy',{item:'crown'},a);
  const saved=await call('appearance',{...look,coat:'neon',hat:true,coins:999999,role:'admin'},a);
  assert.equal(saved.status,200);
  assert.equal(saved.me.coins,80);
  assert.equal(saved.me.role,'player');
  assert.equal(saved.me.hat,true);
  assert.equal(saved.me.coat,'#62f5cd');
  assert.equal(saved.me.outfit,'neon');
  await call('room',{room:'garden'},a);
  await call('state',undefined,a);
  const b=await call('register',{name:'Observer',password:'observer-password-test'});
  await call('room',{room:'garden'},b);
  const state=await call('state',undefined,b);
  assert.deepEqual(state.players.find(p=>p.id===a.me.id).appearance,{skin:look.skin,hair:look.hair,style:look.style});
  await stop();await start();
  a=await call('login',{name:'Stylist',password:'stylist-password-test'});
  assert.equal(a.me.room,'garden');assert.equal(a.me.appearance.style,'crest');assert.equal(a.me.coins,80);
  const unequipped=await call('appearance',look,a);
  assert.equal(unequipped.me.coat,'#77aaff');assert.equal(unequipped.me.hat,false);
  assert.equal(unequipped.me.outfit,'default');
  assert.deepEqual(unequipped.me.inventory,['neon','crown']);
  await stop();
  const db=JSON.parse(await readFile(join(dir,'state.json'),'utf8'));
  delete db.users[0].room;delete db.users[0].appearance;
  await writeFile(join(dir,'state.json'),JSON.stringify(db));
  await start();a=await call('login',{name:'Stylist',password:'stylist-password-test'});
  assert.equal(a.me.room,'plaza');assert.deepEqual(a.me.appearance,defaultAppearance);assert.equal(a.me.coins,80);
});
