// Usage: node tools/encrypt-private.mjs <private.json> <passcode> > data/private.enc.json
import {readFileSync} from 'node:fs';import {webcrypto as c} from 'node:crypto';
const [,,file,pass]=process.argv;if(!file||!pass){console.error('usage: encrypt-private.mjs <private.json> <passcode>');process.exit(1)}
const plain=readFileSync(file,'utf8');JSON.parse(plain);
const ITER=310000,salt=c.getRandomValues(new Uint8Array(16)),iv=c.getRandomValues(new Uint8Array(12));
const base=await c.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
const key=await c.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:ITER},base,{name:'AES-GCM',length:256},false,['encrypt']);
const ct=new Uint8Array(await c.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(plain)));
const b=u=>Buffer.from(u).toString('base64');
process.stdout.write(JSON.stringify({v:1,kdf:'PBKDF2-SHA256',iter:ITER,salt:b(salt),iv:b(iv),ct:b(ct)})+'\n');
