const $=s=>document.querySelector(s),app=$('#app'),P=new URLSearchParams(location.search);
const SHARE=P.get('view')==='share',LS='trips.local.v1',OWN='trips.owner.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._);t._=setTimeout(()=>t.classList.remove('on'),1600)};
const ICON={'hotel-checkin':'🛎','hotel-checkout':'🧳',flight:'✈️',event:'🎟',place:'📍',train:'🚄',food:'🍜'};
const theme=localStorage.getItem('theme');if(theme)document.documentElement.dataset.theme=theme;
let DATA={trips:[]};
const local=()=>JSON.parse(localStorage.getItem(LS)||'{}');const saveLocal=o=>localStorage.setItem(LS,JSON.stringify(o));
const owner=()=>JSON.parse(localStorage.getItem(OWN)||'{}');
function merged(){const l=local();return DATA.trips.map(t=>({...t,items:[...t.items,...(l[t.id]||[])]}))}
const dayKey=(iso,tz)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
const fmtDay=(k)=>{const d=new Date(k+'T12:00:00Z');return{w:d.toLocaleDateString('en-GB',{weekday:'long',timeZone:'UTC'}),d:d.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})}};
const fmtTime=(iso,tz)=>new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:tz})+' '+(tz==='Asia/Tokyo'?'JST':tz==='Asia/Singapore'?'SGT':'');
function rel(t){const today=dayKey(new Date().toISOString(),t.timezone);const d=(a,b)=>Math.round((new Date(a)-new Date(b))/864e5);
 if(today<t.start){const n=d(t.start,today);return n===1?'Tomorrow':`In ${n} days`}if(today>t.end){return 'Completed'}return `Day ${d(today,t.start)+1} of ${d(t.end,t.start)+1}`}
const range=t=>{const a=fmtDay(t.start),b=fmtDay(t.end);return `${a.w.slice(0,3)} ${a.d} – ${b.w.slice(0,3)} ${b.d}`};
function home(){const ts=merged(),today=new Date().toISOString().slice(0,10);
 const up=ts.filter(t=>t.end>=today).sort((a,b)=>a.start.localeCompare(b.start)),past=ts.filter(t=>t.end<today).sort((a,b)=>b.start.localeCompare(a.start));
 const card=(t,p)=>`<a class="trip ${p?'past':''}" href="?trip=${t.id}" style="background:${t.cover}"><span class="em">${t.emoji||'✈️'}</span><div class="t">${esc(t.title)}</div><div class="d">${esc(t.destination)} · ${range(t)}</div><span class="pill">${rel(t)}</span></a>`;
 app.innerHTML=`<header><h1>Trips</h1><button class="btn" id="th">◐</button></header>
 ${up.length?'<h2>Upcoming</h2>'+up.map(t=>card(t)).join(''):'<p class="sharebar">No upcoming trips.</p>'}${past.length?'<h2>Past</h2>'+past.map(t=>card(t,1)).join(''):''}`;
 $('#th').onclick=toggleTheme}
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
 const groups={},all=[];t.items.forEach(i=>{if(i.allTrip||!i.start)return all.push(i);const k=dayKey(i.start,i.tz||t.timezone);(groups[k]=groups[k]||[]).push(i)});
 const days=[];for(let d=new Date(t.start+'T00:00:00Z');d<=new Date(t.end+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1))days.push(d.toISOString().slice(0,10));
 Object.keys(groups).forEach(k=>{if(!days.includes(k))days.push(k)});days.sort();
 const today=dayKey(new Date().toISOString(),t.timezone);
 app.innerHTML=`<header>${SHARE?'<span></span>':'<a class="btn" href="./">‹ Trips</a>'}<div class="row"><button class="btn" id="ics">📅 Calendar</button><button class="btn" id="sh">↗ Share</button></div></header>
 <div class="hero" style="background:${t.cover}"><div style="font-size:40px">${t.emoji||''}</div><div class="t">${esc(t.title)}</div><div>${esc(t.destination)} · ${range(t)}</div><span class="pill">${rel(t)}</span></div>
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
 $('#f').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const off=t.timezone==='Asia/Tokyo'?'+09:00':'+08:00';
  const it={id:'l'+Date.now(),_local:true,type:f.type,title:f.title,subtitle:f.subtitle,start:f.dt+':00'+off,tz:t.timezone,address:f.address,phone:f.phone,confirmation:f.confirmation,emailUrl:f.emailUrl};
  Object.keys(it).forEach(k=>it[k]===''&&delete it[k]);const l=local();(l[t.id]=l[t.id]||[]).push(it);saveLocal(l);
  if(f.notes){const o=owner();o[it.id]={notes:f.notes};localStorage.setItem(OWN,JSON.stringify(o))}toast('Saved');trip(t.id)}}
function ics(t){const s=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');const e=x=>String(x||'').replace(/[,;\\]/g,m=>'\\'+m).replace(/\n/g,'\\n');
 const ev=t.items.filter(i=>i.start&&!i.allTrip).map(i=>['BEGIN:VEVENT',`UID:${i.id}@trips`,`DTSTAMP:${s(Date.now())}`,`DTSTART:${s(i.start)}`,`DTEND:${s(new Date(i.start).getTime()+36e5)}`,`SUMMARY:${e(i.title)}`,i.address?`LOCATION:${e(i.address)}`:'',`DESCRIPTION:${e([i.subtitle,SHARE?'':i.confirmation&&'Conf '+i.confirmation].filter(Boolean).join('\n'))}`,'END:VEVENT'].filter(Boolean).join('\r\n'));
 const all=['BEGIN:VEVENT',`UID:${t.id}@trips`,`DTSTAMP:${s(Date.now())}`,`DTSTART;VALUE=DATE:${t.start.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${(()=>{const d=new Date(t.end+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10).replace(/-/g,'')})()}`,`SUMMARY:${e(t.title)}`,'END:VEVENT'].join('\r\n');
 const txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Trips//EN',all,...ev,'END:VCALENDAR'].join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/calendar'}));a.download=t.id+'.ics';a.click()}
async function boot(){try{DATA=await (await fetch('data/trips.json',{cache:'no-cache'})).json()}catch(e){}
 const id=P.get('trip');id?trip(id):home();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js')}
boot();
