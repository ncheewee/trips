const $=s=>document.querySelector(s),app=$('#app'),P=new URLSearchParams(location.search);
const SHARE=P.get('view')==='share',LS='trips.local.v1',OWN='trips.owner.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._);t._=setTimeout(()=>t.classList.remove('on'),1600)};
const ICON={'hotel-checkin':'🛎','hotel-checkout':'🧳',flight:'✈️',event:'🎟',place:'📍',train:'🚄',food:'🍜'};
const theme=localStorage.getItem('theme');if(theme)document.documentElement.dataset.theme=theme;
let DATA={trips:[]};
function hue(str){let h=0;for(const c of str)h=(h*31+c.charCodeAt(0))>>>0;return h%360}
function themeOf(t){if(t.theme)return t.theme;const h=hue(t.id||t.title);return{accent:`hsl(${h} 85% 66%)`,accent2:`hsl(${(h+50)%360} 60% 38%)`,tint:`hsl(${(h+50)%360} 55% 22%)`,chip:`hsl(${h} 90% 88%)`}}
const imgOf=(t,s)=>`${t.image||'img/travel'}-${s}.webp`;
const bgOf=(t,s)=>{const th=themeOf(t);return `linear-gradient(180deg,rgba(0,0,0,.05) 0%,color-mix(in srgb,${th.tint} 55%,transparent) 55%,color-mix(in srgb,${th.tint} 92%,black) 100%),linear-gradient(135deg,color-mix(in srgb,${th.accent} 35%,transparent),transparent 60%),url('${imgOf(t,s)}') center/cover`};
function applyTheme(t){const r=document.documentElement.style;if(!t){['--acc','--acc2','--chip','--tint'].forEach(k=>r.removeProperty(k));return}const th=themeOf(t);r.setProperty('--acc',th.accent);r.setProperty('--acc2',th.accent2);r.setProperty('--chip',th.chip);r.setProperty('--tint',th.tint)}
const local=()=>JSON.parse(localStorage.getItem(LS)||'{}');const saveLocal=o=>localStorage.setItem(LS,JSON.stringify(o));
const PRIV='trips.private.v1';const priv=()=>{if(SHARE)return{};try{return(JSON.parse(localStorage.getItem(PRIV)||'{}').items)||{}}catch(e){return{}}};
const owner=()=>JSON.parse(localStorage.getItem(OWN)||'{}');
function merged(){const l=local();return DATA.trips.map(t=>({...t,items:[...t.items,...(l[t.id]||[])]}))}
const dayKey=(iso,tz)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
const fmtDay=(k)=>{const d=new Date(k+'T12:00:00Z');return{w:d.toLocaleDateString('en-GB',{weekday:'long',timeZone:'UTC'}),d:d.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})}};
const fmtTime=(iso,tz)=>new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:tz})+' '+(({'Asia/Tokyo':'JST','Asia/Seoul':'KST','Asia/Singapore':'SGT'}[tz]||''));
function rel(t){const today=dayKey(new Date().toISOString(),t.timezone);const d=(a,b)=>Math.round((new Date(a)-new Date(b))/864e5);
 if(today<t.start){const n=d(t.start,today);return n===1?'Tomorrow':`In ${n} days`}if(today>t.end){return 'Completed'}return `Day ${d(today,t.start)+1} of ${d(t.end,t.start)+1}`}
const range=t=>{const a=fmtDay(t.start),b=fmtDay(t.end);return `${a.w.slice(0,3)} ${a.d} – ${b.w.slice(0,3)} ${b.d}`};
function home(){applyTheme(null);const ts=merged(),today=new Date().toISOString().slice(0,10);
 const up=ts.filter(t=>t.end>=today).sort((a,b)=>a.start.localeCompare(b.start)),past=ts.filter(t=>t.end<today).sort((a,b)=>b.start.localeCompare(a.start));
 const card=(t,p)=>`<a class="trip ${p?'past':''}" href="?trip=${t.id}" style="background:${bgOf(t,'card')};--acc:${themeOf(t).accent}"><span class="em">${t.emoji||'✈️'}</span><div class="t">${esc(t.title)}</div><div class="d">${esc(t.destination)} · ${range(t)}</div><span class="pill">${rel(t)}</span></a>`;
 app.innerHTML=`<header><h1 class="logo">Tripie<span class="plane" aria-hidden="true">✈️</span></h1><div class="row">${SHARE?'':'<button class="btn pri" id="scan">📥 Check inbox</button>'}<button class="btn pri" id="installApp" hidden>⤓ Install app</button><button class="btn" id="inst" aria-label="Install help">?</button>${SHARE?'':'<button class="btn" id="pm" aria-label="Private details">🔑</button>'}<button class="btn" id="th">◐</button></div></header><div id="scanst" class="sharebar"></div>
 ${up.length?'<h2>Upcoming</h2>'+up.map(t=>card(t)).join(''):'<p class="sharebar">No upcoming trips.</p>'}${past.length?'<h2>Past</h2>'+past.map(t=>card(t,1)).join(''):''}`;
 $('#th').onclick=toggleTheme;$('#pm')&&($('#pm').onclick=privMenu);$('#scan')&&($('#scan').onclick=scan);$('#inst').onclick=installHelp;syncInstall();$('#installApp').onclick=doInstall;if(SCAN.msg)$('#scanst').textContent=SCAN.msg}
function toggleTheme(){const cur=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');const n=cur==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('theme',n)}
function itemHTML(it,t){const tz=it.tz||t.timezone,o=SHARE?{}:(owner()[it.id]||{});
 const rows=[];const pv=priv()[it.id]||{};
 if(!SHARE){Object.entries(pv).forEach(([k,v])=>rows.push([k,v,1]));if(it.confirmation)rows.unshift(['Confirmation',it.confirmation,1])}
 (it.card||[]).forEach(([k,v])=>rows.push([k,v]));
 if(it.address)rows.push(['Address',it.address,0,'map']);
 if(it.phone&&!SHARE)rows.push(['Phone',it.phoneDisplay||it.phone,0,'tel',it.phone]);
 const row=([k,v,p,kind,raw])=>`<div class="cr${p?' pv':''}"><span class="ck">${p?'🔒 ':''}${esc(k)}</span><span class="cv">${kind==='map'?`<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}">${esc(v)}</a>`:kind==='tel'?`<a href="tel:${esc(raw)}">${esc(v)}</a>`:esc(v)}</span><button class="cp" type="button" data-copy="${esc(v)}" aria-label="Copy ${esc(k)}">Copy</button></div>`;
 return `<div class="item ${it.allTrip?'all':''}"><span class="dot">${it.icon||ICON[it.type]||'•'}</span>
 <div class="tm">${it.allTrip?'Throughout the trip':fmtTime(it.start,tz)}${it.provider&&!SHARE?' · '+esc(it.provider):''}</div>
 <div class="ti">${esc(it.title)}</div>${it.subtitle?`<div class="su">${esc(it.subtitle)}</div>`:''}
 ${rows.length?`<div class="ccard">${rows.map(row).join('')}</div>`:''}
 ${it.note?`<div class="su" style="margin-top:8px">${esc(it.note)}</div>`:''}${o.notes?`<div class="su">🔒 ${esc(o.notes)}</div>`:''}
 ${!SHARE&&it._local?`<button class="btn" data-del="${it.id}" style="margin-top:8px">Remove</button>`:''}</div>`}
function trip(id){const t=merged().find(x=>x.id===id);if(!t){app.innerHTML='<p>Trip not found. <a href="./">Home</a></p>';return}
 applyTheme(t);const groups={},all=[];t.items.forEach(i=>{if(i.allTrip||!i.start)return all.push(i);const k=dayKey(i.start,i.tz||t.timezone);(groups[k]=groups[k]||[]).push(i)});
 const days=[];for(let d=new Date(t.start+'T00:00:00Z');d<=new Date(t.end+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1))days.push(d.toISOString().slice(0,10));
 Object.keys(groups).forEach(k=>{if(!days.includes(k))days.push(k)});days.sort();
 const today=dayKey(new Date().toISOString(),t.timezone);
 app.innerHTML=`<header>${SHARE?'<span></span>':'<a class="btn" href="./">‹ Tripie</a>'}<div class="row"><button class="btn" id="ics">📅 Calendar</button><button class="btn" id="sh">↗ Share</button></div></header>
 <div class="hero" style="background:${bgOf(t,'hero')}"><div style="font-size:40px">${t.emoji||''}</div><div class="t">${esc(t.title)}</div><div>${esc(t.destination)} · ${range(t)}</div><span class="pill">${rel(t)}</span></div>
 ${SHARE?'<div class="sharebar">Shared via Tripie · read-only</div>':''}
 ${all.length?`<div class="day"><div class="dh"><b>Key places</b></div>${all.map(i=>itemHTML(i,t)).join('')}</div>`:''}
 ${days.map(k=>{const f=fmtDay(k),its=(groups[k]||[]).sort((a,b)=>a.start.localeCompare(b.start));return `<div class="day ${k===today?'today':''}" ${k===today?'id="now"':''}><div class="dh"><b>${f.w}</b><span>${f.d}</span></div>${its.length?its.map(i=>itemHTML(i,t)).join(''):'<div class="item" style="opacity:.55"><span class="dot">·</span><div class="su">Free day</div></div>'}</div>`}).join('')}
 ${SHARE?'':packHTML(t)}${SHARE?'':`<div class="row" style="margin-top:24px"><button class="btn" id="add">＋ Add item</button><button class="btn" id="exp">⇩ Export JSON</button></div><div id="form"></div>`}`;
 $('#now')?.scrollIntoView({behavior:'smooth',block:'start'});
 app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const l=local();l[t.id]=(l[t.id]||[]).filter(i=>i.id!==b.dataset.del);saveLocal(l);trip(id)});
 $('#sh').onclick=async()=>{const url=location.origin+location.pathname+`?trip=${t.id}&view=share`;if(navigator.share){try{await navigator.share({title:t.title,text:`My itinerary: ${t.title}`,url})}catch(e){}}else{await navigator.clipboard.writeText(url);toast('Share link copied')}};
 $('#ics').onclick=()=>ics(t);if(!SHARE)bindPack(t);
 if(!SHARE){$('#add').onclick=()=>form(t);$('#exp').onclick=()=>{const l=local();const out={trips:DATA.trips.map(x=>({...x,items:[...x.items,...(l[x.id]||[]).map(({_local,...r})=>r)]}))};
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));a.download='trips.json';a.click()}}}
function form(t){$('#form').innerHTML=`<form id="f"><label>Type<select name="type"><option value="event">Event</option><option value="flight">Flight</option><option value="hotel-checkin">Hotel check-in</option><option value="hotel-checkout">Hotel check-out</option><option value="train">Train</option><option value="food">Food</option><option value="place">Place</option></select></label>
 <label>Title<input name="title" required></label><label>Details<input name="subtitle"></label><label>Date & time (${t.timezone})<input type="datetime-local" name="dt" required></label>
 <label>Address<input name="address"></label><label>Phone<input name="phone"></label><label>Confirmation #<input name="confirmation"></label>
 <label>🔒 Private notes (this device only — PINs etc.)<textarea name="notes"></textarea></label><button class="btn pri">Save</button></form>`;
 $('#f').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const off=t.timezone==='Asia/Singapore'?'+08:00':'+09:00';
  const it={id:'l'+Date.now(),_local:true,type:f.type,title:f.title,subtitle:f.subtitle,start:f.dt+':00'+off,tz:t.timezone,address:f.address,phone:f.phone,confirmation:f.confirmation};
  Object.keys(it).forEach(k=>it[k]===''&&delete it[k]);const l=local();(l[t.id]=l[t.id]||[]).push(it);saveLocal(l);
  if(f.notes){const o=owner();o[it.id]={notes:f.notes};localStorage.setItem(OWN,JSON.stringify(o))}toast('Saved');trip(t.id)}}
function ics(t){const s=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');const e=x=>String(x||'').replace(/[,;\\]/g,m=>'\\'+m).replace(/\n/g,'\\n');
 const ev=t.items.filter(i=>i.start&&!i.allTrip).map(i=>['BEGIN:VEVENT',`UID:${i.id}@trips`,`DTSTAMP:${s(Date.now())}`,`DTSTART:${s(i.start)}`,`DTEND:${s(i.end||new Date(i.start).getTime()+36e5)}`,`SUMMARY:${e(i.title)}`,i.address?`LOCATION:${e(i.address)}`:'',`DESCRIPTION:${e([i.subtitle,SHARE?'':i.confirmation&&'Conf '+i.confirmation].filter(Boolean).join('\n'))}`,'END:VEVENT'].filter(Boolean).join('\r\n'));
 const all=['BEGIN:VEVENT',`UID:${t.id}@trips`,`DTSTAMP:${s(Date.now())}`,`DTSTART;VALUE=DATE:${t.start.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${(()=>{const d=new Date(t.end+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10).replace(/-/g,'')})()}`,`SUMMARY:${e(t.title)}`,'END:VEVENT'].join('\r\n');
 const txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Tripie//EN',all,...ev,'END:VCALENDAR'].join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/calendar'}));a.download=t.id+'.ics';a.click()}
async function boot(){try{DATA=await (await fetch('data/trips.json',{cache:'no-cache'})).json()}catch(e){}
 const id=P.get('trip');id?trip(id):home();refreshPriv();if('serviceWorker'in navigator)navigator.serviceWorker.register('/trips/sw.js',{scope:'/trips/'}).catch(()=>navigator.serviceWorker.register('sw.js'))}
boot();

const SCAN={msg:''};
const MAILTO='mailto:cheewee-bot+trips@mail.grokbot.com?subject='+encodeURIComponent('Check inbox')+'&body='+encodeURIComponent('Scan my Gmail for new bookings since the last scan.');
const setSt=m=>{SCAN.msg=m;const el=$('#scanst');if(el)el.textContent=m};
function scan(){location.href=MAILTO;setSt('Tap Send in your email app. Your trip updates within a few minutes.');poll()}
async function poll(){const base=JSON.stringify(DATA);let n=0;const t=setInterval(async()=>{n++;
 try{const nd=await (await fetch('data/trips.json?t='+Date.now(),{cache:'no-store'})).json();if(JSON.stringify(nd)!==base){DATA=nd;clearInterval(t);setSt('New bookings added ✓');const id=P.get('trip');id?trip(id):home();return}}catch(e){}
 if(n>=15){clearInterval(t);setSt('No new bookings yet — check back later')}},20000)}

function copyNow(v,b){let ok=true;try{const p=navigator.clipboard&&navigator.clipboard.writeText(v);if(!p)throw 0;p.catch(()=>fallbackCopy(v))}catch(e){ok=fallbackCopy(v)}
 if(b){b.classList.add('done');b.textContent='Copied ✓';clearTimeout(b._t);b._t=setTimeout(()=>{b.classList.remove('done');b.textContent='Copy'},1500)}toast('Copied')}
function fallbackCopy(v){const ta=document.createElement('textarea');ta.value=v;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();let r=false;try{r=document.execCommand('copy')}catch(e){}ta.remove();return r}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-copy]');if(!b)return;e.preventDefault();copyNow(b.dataset.copy,b)});
const PASS='trips.pass.v1',b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function decryptPriv(pass){const e=await (await fetch('data/private.enc.json?t='+Date.now(),{cache:'no-store'})).json();
 const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:b64(e.salt),iterations:e.iter},base,{name:'AES-GCM',length:256},false,['decrypt']);
 const j=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(e.iv)},key,b64(e.ct))));if(!j||typeof j.items!=='object')throw 0;return j}
async function refreshPriv(){if(SHARE)return;const pw=localStorage.getItem(PASS);if(!pw)return;try{const j=await decryptPriv(pw);const cur=localStorage.getItem(PRIV);const n=JSON.stringify(j);if(cur!==n){localStorage.setItem(PRIV,n);rerender()}}catch(e){}}
function privMenu(){const el=document.createElement('div');el.className='sheet';const n=Object.keys(priv()).length,on=!!localStorage.getItem(PASS);
 el.innerHTML=`<form id="pu"><b>Private details</b><div class="su">${on?'Unlocked on this device'+(n?' ('+n+' bookings).':'.'):'Enter your passcode once on this device to show confirmation numbers and PINs.'}</div>
 ${on?'':'<label>Passcode<input name="pw" type="password" autocomplete="current-password" required></label>'}
 <div class="row">${on?'':'<button class="btn pri">Unlock</button>'}${n||on?'<button class="btn" type="button" id="pc">Lock &amp; clear</button>':''}<button class="btn" type="button" id="px">Close</button></div></form>
 <details><summary class="su">Import a file instead</summary><form id="pf"><label>Paste JSON<textarea name="j" rows="4" placeholder='{"version":1,"items":{...}}'></textarea></label>
 <label>…or open a file<input type="file" name="f" accept="application/json,.json"></label><div class="row"><button class="btn">Import</button></div></form></details>`;
 document.body.appendChild(el);const close=()=>el.remove();el.onclick=e=>{if(e.target===el)close()};el.querySelector('#px').onclick=close;
 el.querySelector('#pc')&&(el.querySelector('#pc').onclick=()=>{localStorage.removeItem(PRIV);localStorage.removeItem(PASS);close();toast('Private details locked');rerender()});
 el.querySelector('#pu').onsubmit=async e=>{e.preventDefault();const pw=new FormData(e.target).get('pw');if(!pw)return;
  try{const j=await decryptPriv(pw);localStorage.setItem(PASS,pw);localStorage.setItem(PRIV,JSON.stringify(j));close();toast('Unlocked '+Object.keys(j.items).length+' bookings');rerender()}catch(_){toast('Wrong passcode')}};
 el.querySelector('#pf').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);let txt=fd.get('j');const f=fd.get('f');if(f&&f.size)txt=await f.text();
  try{const j=JSON.parse(txt);if(!j||typeof j.items!=='object')throw 0;localStorage.setItem(PRIV,JSON.stringify(j));close();toast('Imported '+Object.keys(j.items).length+' bookings');rerender()}catch(_){toast('Not valid private-details JSON')}}}
const PK='trips.pack.v1';const packAll=()=>{try{return JSON.parse(localStorage.getItem(PK)||'{}')}catch(e){return{}}};
const packOf=id=>{const a=packAll();return Object.assign({ticks:{},added:[],removed:[]},a[id]||{})};
const savePack=(id,p)=>{const a=packAll();a[id]=p;localStorage.setItem(PK,JSON.stringify(a))};
function packSections(t){const p=packOf(t.id),secs=(t.packing||[]).map(s=>({section:s.section,items:s.items.filter(i=>!p.removed.includes(i.id))}));
 p.added.forEach(i=>{let s=secs.find(x=>x.section===i.section);if(!s)secs.push(s={section:i.section,items:[]});s.items.push(i)});return{p,secs}}
function packHTML(t){const{p,secs}=packSections(t);const all=secs.flatMap(s=>s.items),done=all.filter(i=>p.ticks[i.id]).length;
 return `<div class="day pack" id="pack"><div class="dh"><b>🧳 Packing</b><span id="pkc">${done}/${all.length}</span></div>
 ${secs.map(s=>`<div class="pks"><div class="pkh">${esc(s.section)}</div>${s.items.map(i=>`<label class="pki${p.ticks[i.id]?' on':''}"><input type="checkbox" data-pk="${esc(i.id)}" ${p.ticks[i.id]?'checked':''}><span>${esc(i.text)}</span><button type="button" class="pkx" data-pkx="${esc(i.id)}" aria-label="Remove">×</button></label>`).join('')}</div>`).join('')}
 <form class="pkadd" id="pkf"><select name="s">${[...new Set([...secs.map(s=>s.section),'Other'])].map(x=>`<option>${esc(x)}</option>`).join('')}</select><input name="x" placeholder="Add item" required><button class="btn pri">Add</button></form></div>`}
function bindPack(t){const box=$('#pack');if(!box)return;
 box.addEventListener('change',e=>{const c=e.target.closest('[data-pk]');if(!c)return;const p=packOf(t.id);if(c.checked)p.ticks[c.dataset.pk]=1;else delete p.ticks[c.dataset.pk];savePack(t.id,p);c.parentElement.classList.toggle('on',c.checked);
  const{secs}=packSections(t);const all=secs.flatMap(s=>s.items);$('#pkc').textContent=all.filter(i=>p.ticks[i.id]).length+'/'+all.length});
 box.addEventListener('click',e=>{const x=e.target.closest('[data-pkx]');if(!x)return;e.preventDefault();const id=x.dataset.pkx,p=packOf(t.id);
  if(p.added.some(i=>i.id===id))p.added=p.added.filter(i=>i.id!==id);else p.removed.push(id);delete p.ticks[id];savePack(t.id,p);box.outerHTML=packHTML(t);bindPack(t)});
 $('#pkf').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),p=packOf(t.id);p.added.push({id:'u'+Date.now(),section:f.get('s'),text:String(f.get('x')).trim()});savePack(t.id,p);box.outerHTML=packHTML(t);bindPack(t);$('#pkf [name=x]').focus()}}
function rerender(){const id=P.get('trip');id?trip(id):home()}
let deferredInstall=null,appInstalled=false;
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function syncInstall(){const b=document.getElementById('installApp'),h=document.getElementById('inst');const sa=isStandalone()||appInstalled;if(b)b.hidden=!deferredInstall||sa;if(h)h.hidden=sa}
async function doInstall(){if(!deferredInstall)return;const p=deferredInstall;deferredInstall=null;p.prompt();try{await p.userChoice}catch{}syncInstall()}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;syncInstall()});
addEventListener('appinstalled',()=>{appInstalled=true;deferredInstall=null;syncInstall()});
matchMedia('(display-mode: standalone)').addEventListener?.('change',syncInstall);
function installHelp(){const el=document.createElement('div');el.className='sheet';
 const ua=navigator.userAgent,android=/Android/i.test(ua),ios=/iPhone|iPad/i.test(ua),mac=/Macintosh/.test(ua)&&!/Chrome/.test(ua);
 const steps=[['Android · Chrome (Pixel)',`<ol><li>Tap <b>⋮</b> (top right) → <b>Install app</b> (or <b>Add to home screen</b> → <b>Install</b>).</li><li>If Chrome says it's already installed or shows <b>Open in app</b>, an old copy is on your phone: long-press the old <b>Trips</b>, <b>Tripie</b> (or <b>2048</b>) icon → <b>App info</b> → <b>Uninstall</b>.</li><li>Then Chrome → <b>Settings</b> → <b>Site settings</b> → <b>All sites</b> → <b>ncheewee.github.io</b> → <b>Clear &amp; reset</b>, reopen this page and install again.</li></ol>`,android],
 ['iPhone · Safari','<ol><li>Tap <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>.</li></ol>',ios],
 ['Mac · Safari','<ol><li><b>File</b> → <b>Add to Dock…</b></li></ol>',mac],
 ['Chrome · desktop','<ol><li>Click the install icon in the address bar, or <b>⋮</b> → <b>Cast, save and share</b> → <b>Install page as app…</b></li></ol>',false]];
 steps.sort((a,b)=>(b[2]?1:0)-(a[2]?1:0));
 el.innerHTML=`<form><b>Install Tripie</b>${deferredInstall?'<button class="btn pri" type="button" id="ip">Install now</button>':''}${steps.map(([h,b])=>`<div><div class="ti">${h}</div><div class="su">${b}</div></div>`).join('')}<button class="btn" type="button" id="ix">Close</button></form>`;
 document.body.appendChild(el);el.onclick=e=>{if(e.target===el)el.remove()};el.querySelector('#ix').onclick=()=>el.remove();
 el.querySelector('#ip')&&(el.querySelector('#ip').onclick=async()=>{deferredInstall.prompt();await deferredInstall.userChoice.catch(()=>{});deferredInstall=null;el.remove()})}
