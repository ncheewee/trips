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
 app.innerHTML=`<header><h1>Trips</h1><div class="row"><button class="btn pri" id="scan">📥 Check inbox</button><button class="btn" id="inst">⤓ Install</button><button class="btn" id="set" aria-label="Settings">⚙︎</button><button class="btn" id="th">◐</button></div></header><div id="scanst" class="sharebar"></div>
 ${up.length?'<h2>Upcoming</h2>'+up.map(t=>card(t)).join(''):'<p class="sharebar">No upcoming trips.</p>'}${past.length?'<h2>Past</h2>'+past.map(t=>card(t,1)).join(''):''}`;
 $('#th').onclick=toggleTheme;$('#scan').onclick=scan;$('#set').onclick=settings;$('#inst').onclick=installHelp;if(SCAN.msg)$('#scanst').textContent=SCAN.msg}
function toggleTheme(){const cur=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');const n=cur==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('theme',n)}
function itemHTML(it,t){const tz=it.tz||t.timezone,o=owner()[it.id]||{};
 const m=[];if(it.start&&!it.allTrip)m.push();
 if(it.confirmation&&!SHARE)m.push(`<button data-copy="${esc(it.confirmation)}"><span class="k">#</span><span class="mono">${esc(it.confirmation)}</span><span class="k">📋</span></button>`);
 if(it.address)m.push(`<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.address)}"><span class="k">📍</span>${esc(it.address)}</a>`);
 if(it.phone)m.push(`<a href="tel:${esc(it.phone)}"><span class="k">📞</span>${esc(it.phoneDisplay||it.phone)}</a>`);
 if(it.note)m.push(`<div class="su">${esc(it.note)}</div>`);
 if(!SHARE&&o.notes)m.push(`<div class="su">🔒 ${esc(o.notes)}</div>`);
 return `<div class="item ${it.allTrip?'all':''}"><span class="dot">${ICON[it.type]||'•'}</span>
 <div class="tm">${it.allTrip?'Throughout the trip':fmtTime(it.start,tz)}${it.provider&&!SHARE?' · '+esc(it.provider):''}</div>
 <div class="ti">${esc(it.title)}</div>${it.subtitle?`<div class="su">${esc(it.subtitle)}</div>`:''}
 ${m.length?`<div class="meta">${m.join('')}</div>`:''}
 ${!SHARE&&it.emailUrl?`<a class="btn pri email" target="_blank" rel="noopener" href="${esc(it.emailUrl)}">✉︎ Open booking email</a>`:''}
 ${!SHARE&&it._local?`<button class="btn" data-del="${it.id}" style="margin-top:8px">Remove</button>`:''}</div>`}
function trip(id){const t=merged().find(x=>x.id===id);if(!t){app.innerHTML='<p>Trip not found. <a href="./">Home</a></p>';return}
 applyTheme(t);const groups={},all=[];t.items.forEach(i=>{if(i.allTrip||!i.start)return all.push(i);const k=dayKey(i.start,i.tz||t.timezone);(groups[k]=groups[k]||[]).push(i)});
 const days=[];for(let d=new Date(t.start+'T00:00:00Z');d<=new Date(t.end+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1))days.push(d.toISOString().slice(0,10));
 Object.keys(groups).forEach(k=>{if(!days.includes(k))days.push(k)});days.sort();
 const today=dayKey(new Date().toISOString(),t.timezone);
 app.innerHTML=`<header>${SHARE?'<span></span>':'<a class="btn" href="./">‹ Trips</a>'}<div class="row"><button class="btn" id="ics">📅 Calendar</button><button class="btn" id="sh">↗ Share</button></div></header>
 <div class="hero" style="background:${bgOf(t,'hero')}"><div style="font-size:40px">${t.emoji||''}</div><div class="t">${esc(t.title)}</div><div>${esc(t.destination)} · ${range(t)}</div><span class="pill">${rel(t)}</span></div>
 ${SHARE?'<div class="sharebar">Shared itinerary · read-only</div>':''}
 ${all.length?`<div class="day"><div class="dh"><b>Key places</b></div>${all.map(i=>itemHTML(i,t)).join('')}</div>`:''}
 ${days.map(k=>{const f=fmtDay(k),its=(groups[k]||[]).sort((a,b)=>a.start.localeCompare(b.start));return `<div class="day ${k===today?'today':''}" ${k===today?'id="now"':''}><div class="dh"><b>${f.w}</b><span>${f.d}</span></div>${its.length?its.map(i=>itemHTML(i,t)).join(''):'<div class="item" style="opacity:.55"><span class="dot">·</span><div class="su">Free day</div></div>'}</div>`}).join('')}
 ${SHARE?'':`<div class="row" style="margin-top:24px"><button class="btn" id="add">＋ Add item</button><button class="btn" id="exp">⇩ Export JSON</button></div><div id="form"></div>`}`;
 $('#now')?.scrollIntoView({behavior:'smooth',block:'start'});
 app.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>navigator.clipboard.writeText(b.dataset.copy).then(()=>toast('Copied')));
 app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const l=local();l[t.id]=(l[t.id]||[]).filter(i=>i.id!==b.dataset.del);saveLocal(l);trip(id)});
 $('#sh').onclick=async()=>{const url=location.origin+location.pathname+`?trip=${t.id}&view=share`;if(navigator.share){try{await navigator.share({title:t.title,text:`My itinerary: ${t.title}`,url})}catch(e){}}else{await navigator.clipboard.writeText(url);toast('Share link copied')}};
 $('#ics').onclick=()=>ics(t);
 if(!SHARE){$('#add').onclick=()=>form(t);$('#exp').onclick=()=>{const l=local();const out={trips:DATA.trips.map(x=>({...x,items:[...x.items,...(l[x.id]||[]).map(({_local,...r})=>r)]}))};
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));a.download='trips.json';a.click()}}}
function form(t){$('#form').innerHTML=`<form id="f"><label>Type<select name="type"><option value="event">Event</option><option value="flight">Flight</option><option value="hotel-checkin">Hotel check-in</option><option value="hotel-checkout">Hotel check-out</option><option value="train">Train</option><option value="food">Food</option><option value="place">Place</option></select></label>
 <label>Title<input name="title" required></label><label>Details<input name="subtitle"></label><label>Date & time (${t.timezone})<input type="datetime-local" name="dt" required></label>
 <label>Address<input name="address"></label><label>Phone<input name="phone"></label><label>Confirmation #<input name="confirmation"></label><label>Booking email link<input name="emailUrl" placeholder="https://mail.google.com/..."></label>
 <label>🔒 Private notes (this device only — PINs etc.)<textarea name="notes"></textarea></label><button class="btn pri">Save</button></form>`;
 $('#f').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const off=t.timezone==='Asia/Singapore'?'+08:00':'+09:00';
  const it={id:'l'+Date.now(),_local:true,type:f.type,title:f.title,subtitle:f.subtitle,start:f.dt+':00'+off,tz:t.timezone,address:f.address,phone:f.phone,confirmation:f.confirmation,emailUrl:f.emailUrl};
  Object.keys(it).forEach(k=>it[k]===''&&delete it[k]);const l=local();(l[t.id]=l[t.id]||[]).push(it);saveLocal(l);
  if(f.notes){const o=owner();o[it.id]={notes:f.notes};localStorage.setItem(OWN,JSON.stringify(o))}toast('Saved');trip(t.id)}}
function ics(t){const s=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');const e=x=>String(x||'').replace(/[,;\\]/g,m=>'\\'+m).replace(/\n/g,'\\n');
 const ev=t.items.filter(i=>i.start&&!i.allTrip).map(i=>['BEGIN:VEVENT',`UID:${i.id}@trips`,`DTSTAMP:${s(Date.now())}`,`DTSTART:${s(i.start)}`,`DTEND:${s(new Date(i.start).getTime()+36e5)}`,`SUMMARY:${e(i.title)}`,i.address?`LOCATION:${e(i.address)}`:'',`DESCRIPTION:${e([i.subtitle,SHARE?'':i.confirmation&&'Conf '+i.confirmation].filter(Boolean).join('\n'))}`,'END:VEVENT'].filter(Boolean).join('\r\n'));
 const all=['BEGIN:VEVENT',`UID:${t.id}@trips`,`DTSTAMP:${s(Date.now())}`,`DTSTART;VALUE=DATE:${t.start.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${(()=>{const d=new Date(t.end+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10).replace(/-/g,'')})()}`,`SUMMARY:${e(t.title)}`,'END:VEVENT'].join('\r\n');
 const txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Trips//EN',all,...ev,'END:VCALENDAR'].join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/calendar'}));a.download=t.id+'.ics';a.click()}
async function boot(){try{DATA=await (await fetch('data/trips.json',{cache:'no-cache'})).json()}catch(e){}
 const id=P.get('trip');id?trip(id):home();if('serviceWorker'in navigator)navigator.serviceWorker.register('/trips/sw.js',{scope:'/trips/'}).catch(()=>navigator.serviceWorker.register('sw.js'))}
boot();

const CFG='trips.webhook.v1',SCAN={msg:''};
const cfg=()=>JSON.parse(localStorage.getItem(CFG)||'{}');
function settings(){const c=cfg();const el=document.createElement('div');el.className='sheet';
 el.innerHTML=`<form id="sf"><b>Inbox scan settings</b><div class="su">Paste these from your Grok Bot routine. Stored on this device only.</div>
 <label>Webhook URL<input name="url" type="url" required value="${esc(c.url||'')}"></label><label>Sender key<input name="key" type="password" value="${esc(c.key||'')}"></label>
 <div class="row"><button class="btn pri">Save</button><button class="btn" type="button" id="sx">Cancel</button>${c.url?'<button class="btn" type="button" id="sc">Clear</button>':''}</div></form>`;
 document.body.appendChild(el);const close=()=>el.remove();el.onclick=e=>{if(e.target===el)close()};el.querySelector('#sx').onclick=close;
 el.querySelector('#sc')&&(el.querySelector('#sc').onclick=()=>{localStorage.removeItem(CFG);close();toast('Cleared')});
 el.querySelector('#sf').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));localStorage.setItem(CFG,JSON.stringify({url:f.url.trim(),key:f.key.trim()}));close();toast('Saved')}}
const setSt=m=>{SCAN.msg=m;const el=$('#scanst');if(el)el.textContent=m};
async function scan(){const c=cfg();if(!c.url){settings();return}
 const btn=$('#scan');btn&&(btn.disabled=true);setSt('Sending…');
 const body=JSON.stringify({source:'trips-app',requestedAt:new Date().toISOString()});
 const h={'Content-Type':'application/json'};if(c.key){h['Authorization']='Bearer '+c.key;h['X-Webhook-Key']=c.key;h['X-Sender-Key']=c.key}
 let ok=false;try{const r=await fetch(c.url,{method:'POST',mode:'cors',headers:h,body});if(!r.ok)throw new Error('HTTP '+r.status);ok=true}
 catch(e){if(e instanceof TypeError){try{await fetch(c.url+(c.url.includes('?')?'&':'?')+(c.key?'key='+encodeURIComponent(c.key):''),{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body});ok=true}catch(e2){setSt('Error: '+e2.message)}}else setSt('Error: '+e.message)}
 btn&&(btn.disabled=false);if(!ok)return;setSt('Scan started, new bookings appear in a few minutes');poll()}
async function poll(){const base=JSON.stringify(DATA);let n=0;const t=setInterval(async()=>{n++;
 try{const nd=await (await fetch('data/trips.json?t='+Date.now(),{cache:'no-store'})).json();if(JSON.stringify(nd)!==base){DATA=nd;clearInterval(t);setSt('New bookings added ✓');const id=P.get('trip');id?trip(id):home();return}}catch(e){}
 if(n>=15){clearInterval(t);setSt('No new bookings yet — check back later')}},20000)}

let deferredInstall=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
function installHelp(){const el=document.createElement('div');el.className='sheet';
 const ua=navigator.userAgent,android=/Android/i.test(ua),ios=/iPhone|iPad/i.test(ua),mac=/Macintosh/.test(ua)&&!/Chrome/.test(ua);
 const steps=[['Android · Chrome (Pixel)',`<ol><li>Tap <b>⋮</b> (top right) → <b>Install app</b> (or <b>Add to home screen</b> → <b>Install</b>).</li><li>If Chrome says it's already installed or shows <b>Open in app</b>, an old copy is on your phone: long-press the old <b>Trips</b> (or <b>2048</b>) icon → <b>App info</b> → <b>Uninstall</b>.</li><li>Then Chrome → <b>Settings</b> → <b>Site settings</b> → <b>All sites</b> → <b>ncheewee.github.io</b> → <b>Clear &amp; reset</b>, reopen this page and install again.</li></ol>`,android],
 ['iPhone · Safari','<ol><li>Tap <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>.</li></ol>',ios],
 ['Mac · Safari','<ol><li><b>File</b> → <b>Add to Dock…</b></li></ol>',mac],
 ['Chrome · desktop','<ol><li>Click the install icon in the address bar, or <b>⋮</b> → <b>Cast, save and share</b> → <b>Install page as app…</b></li></ol>',false]];
 steps.sort((a,b)=>(b[2]?1:0)-(a[2]?1:0));
 el.innerHTML=`<form><b>Install Trips</b>${deferredInstall?'<button class="btn pri" type="button" id="ip">Install now</button>':''}${steps.map(([h,b])=>`<div><div class="ti">${h}</div><div class="su">${b}</div></div>`).join('')}<button class="btn" type="button" id="ix">Close</button></form>`;
 document.body.appendChild(el);el.onclick=e=>{if(e.target===el)el.remove()};el.querySelector('#ix').onclick=()=>el.remove();
 el.querySelector('#ip')&&(el.querySelector('#ip').onclick=async()=>{deferredInstall.prompt();await deferredInstall.userChoice.catch(()=>{});deferredInstall=null;el.remove()})}
