import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer, validateLead} from './leads.mjs';
const good={name:'Анна',phone:'+7 (999) 123-45-67',company:'Склад',comment:'Нужны комплектовщики',consent:true};
test('valid lead accepted; invalid names, phones, consent and excessive payloads rejected',()=>{
 assert.equal(validateLead(good),null);
 for(const change of [{name:' '},{phone:'abc89991234567'},{phone:'123'},{phone:123},{consent:false},{company:'x'.repeat(151)},{comment:'x'.repeat(2001)}]) assert.ok(validateLead({...good,...change}));
});
test('unconfigured delivery returns 503 and never claims success',async()=>{
 const server=createServer({SITE_ORIGIN:'http://example.test'});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
 const url=`http://127.0.0.1:${server.address().port}/api/leads`;
 const result=await fetch(url,{method:'POST',headers:{Origin:'http://example.test','Content-Type':'application/json'},body:JSON.stringify(good)});
 assert.equal(result.status,503);assert.equal((await result.json()).ok,false);
 const blocked=await fetch(url,{method:'POST',headers:{Origin:'http://untrusted.test','Content-Type':'application/json'},body:JSON.stringify(good)});assert.equal(blocked.status,403);
 const method=await fetch(url);assert.equal(method.status,405);
 }finally{await new Promise(r=>server.close(r));}
});
