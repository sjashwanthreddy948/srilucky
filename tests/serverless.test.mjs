import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';
const modulePath=resolve('server/index.mjs');
const wait=async(port)=>{for(let i=0;i<80;i++){try{return await fetch(`http://localhost:${port}/api/health`);}catch{await new Promise(r=>setTimeout(r,100));}}throw new Error('Server did not start');};
test('serverless runtime fails closed without persistent database configuration',async()=>{
  const server=spawn(process.execPath,[modulePath],{env:{...process.env,PORT:'3102',VERCEL:'1',NODE_ENV:'production',TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:''},stdio:'ignore'});
  try{assert.equal((await wait(3102)).status,503);assert.equal((await fetch('http://localhost:3102/api/admin')).status,503);}finally{server.kill();await new Promise(r=>server.once('exit',r));}
});
test('asynchronous database adapter persists bookings and sessions across restarts; durable rate limits',async()=>{
  const cwd=mkdtempSync(join(tmpdir(),'srilucky-remote-'));
  const url='file:'+join(cwd,'remote.db').replaceAll('\\','/');
  const env={...process.env,PORT:'3103',NODE_ENV:'production',SITE_URL:'https://srilucky.example',VERCEL:'',TURSO_DATABASE_URL:url,TURSO_AUTH_TOKEN:'',ADMIN_EMAIL:'owner@example.test',ADMIN_PASSWORD:randomBytes(24).toString('hex')};
  let server;
  const start=async()=>{server=spawn(process.execPath,[modulePath],{cwd,env,stdio:'ignore'});assert.equal((await wait(3103)).status,200);};
  const stop=async()=>{server.kill();await new Promise(r=>server.once('exit',r));};
  try {
    await start();
    const login=await fetch('http://localhost:3103/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:env.SITE_URL},body:JSON.stringify({email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD})});
    assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/Secure/);
    const cookie=login.headers.get('set-cookie').split(';')[0];
    const body={customer_name:'Persistent Visitor',phone:'9876543210',service:'Eye Examination',date:'2099-10-03',time:'11:00',message:''};
    const saved=await fetch('http://localhost:3103/api/appointments',{method:'POST',headers:{'Content-Type':'application/json',Origin:env.SITE_URL},body:JSON.stringify(body)});
    assert.equal(saved.status,201);
    const blocked=await fetch('http://localhost:3103/api/appointments',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:JSON.stringify(body)});assert.equal(blocked.status,403);
    await stop();await start();
    const admin=await fetch('http://localhost:3103/api/admin',{headers:{Cookie:cookie}});assert.equal(admin.status,200);
    assert.equal((await admin.json()).appointments[0].customer_name,body.customer_name);
    assert.match(admin.headers.get('cache-control'),/no-store/);
    const rate=spawnSync(process.execPath,['--input-type=module','-e',`import {takeRateLimit} from ${JSON.stringify('file:///'+resolve('server/db.mjs').replaceAll('\\','/'))};const a=await takeRateLimit('test-key',1,60000);const b=await takeRateLimit('test-key',1,60000);if(!a.allowed||b.allowed)process.exit(1);process.exit(0);`],{cwd,env});
    assert.equal(rate.status,0,rate.stderr.toString());
  }finally{if(server?.exitCode===null)await stop();rmSync(cwd,{recursive:true,force:true});}
});
