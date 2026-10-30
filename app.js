/* Abundus — client companion app
   Single-user, local-first. All data in localStorage; export any time. */
(function(){
'use strict';

const KEY = 'abundus.store.v2';
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2,'0');

/* ---------------- dates ---------------- */
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());
const parseISO = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const addDays = (s,n) => { const d=parseISO(s); d.setDate(d.getDate()+n); return iso(d); };
const mondayOf = s => { const d=parseISO(s); d.setDate(d.getDate()-((d.getDay()+6)%7)); return iso(d); };
const fmtDate = s => parseISO(s).toLocaleDateString('en-US',{month:'short',day:'numeric'});
const fmtLong = s => parseISO(s).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
const money = n => n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits: n%1?2:0});

/* ---------------- constants ---------------- */
const TOPICS = ['Stewardship Mindset','Budgeting Basics','Debt Freedom','Giving & Generosity','Testimony'];

const SEED_RESOURCES = [
  {id:'r1',title:'Stewardship of Money — 2 Corinthians 9:6–15',topic:'Stewardship Mindset',yt:'QB6gDByKou4',min:36},
  {id:'r2',title:'Stewardship 101: Biblical Principles for Money, Giving & Contentment',topic:'Stewardship Mindset',yt:'VbnJtsF4SII',min:8},
  {id:'r3',title:'What the Bible Says About Money',topic:'Stewardship Mindset',yt:'N2Wp8dp2F1Q',min:39},
  {id:'r4',title:"God's Principles for Money, Stewardship & Generosity",topic:'Giving & Generosity',yt:'_tTMYPon4PU',min:54},
  {id:'r5',title:"Managing God's Money — biblical stewardship and eternal perspective",topic:'Giving & Generosity',yt:'OpkTjNTUDQU',min:101},
  {id:'r6',title:'The Envelope Budgeting Method Explained',topic:'Budgeting Basics',yt:'46xkeotZILU',min:11},
  {id:'r7',title:"Is the Envelope System God's Answer to Overspending?",topic:'Budgeting Basics',yt:'WZcjiBsjc_E',min:8},
  {id:'r8',title:'How I Budget with the Cash Envelope System',topic:'Budgeting Basics',yt:'mYZbWaUHtvc',min:23}
];

const DEVOTIONALS = [
  {ref:'Psalm 24:1',title:'The money was never yours',
   body:'\u201cThe earth is the Lord\u2019s, and everything in it.\u201d That includes the account with your name on it. Stewardship begins not with a budget but with a transfer of ownership \u2014 the quiet decision that you are managing, not possessing. Nothing you give away this month is a loss. It is a return.'},
  {ref:'Acts 2:44–45',title:'Devoted, not merely generous',
   body:'\u201cAll the believers were together and had everything in common. They sold property and possessions to give to anyone who had need.\u201d Notice the order: they were devoted first, and generosity followed. Generosity that starts with a feeling runs out. Generosity that starts with devotion runs deep.'},
  {ref:'Acts 4:32–35',title:'One heart and one mind',
   body:'\u201cNo one claimed that any of their possessions was their own.\u201d That is the sentence the early church was known for. Not that they had nothing \u2014 that they claimed nothing. What would change in your budget this week if you truly claimed nothing?'},
  {ref:'Luke 16:9',title:'Make friends with unrighteous wealth',
   body:'Jesus calls money \u201cunrighteous\u201d not because it is evil but because it is temporary and it lies to you about what it can do. Then he tells you to use it anyway \u2014 to make friends who will welcome you into eternal dwellings. Every dollar is either consumed or converted. You get to choose.'},
  {ref:'Luke 16:10',title:'Faithful in little',
   body:'\u201cWhoever can be trusted with very little can also be trusted with much.\u201d Small faithfulness is not a warm-up for the real thing; it is the real thing. The $20 decision and the $20,000 decision are answered by the same habit. Today\u2019s little is the training ground.'},
  {ref:'2 Corinthians 9:7',title:'Not reluctantly, not under compulsion',
   body:'\u201cGod loves a cheerful giver.\u201d Not a reluctant one, not a shamed one, not one who gives because the spreadsheet said so. Cheerfulness is the evidence that you actually believe God is the source. If giving feels like a tax, the problem is upstream of the amount.'},
  {ref:'Matthew 25:21',title:'Well done, good and faithful servant',
   body:'The master\u2019s commendation was not for the size of the return but for the faithfulness of the steward. You are not being graded on your net worth. You are being trusted with a little, in order to be trusted with more \u2014 and the \u201cmore\u201d may not be money at all.'}
];

const SEED_COMMUNITY = [
  {id:'c1',story:'I had been tithing out of the leftovers for years without admitting it. Last month I moved it to the top of the budget, before anything else. I expected to feel the pinch. I have not missed a single bill.',amount:340,date:addDays(todayISO(),-6),own:false},
  {id:'c2',story:'My wife and I finally told each other the truth about the credit card. It was $9,000, not $4,000. The number was terrifying and the honesty was freeing. We start the snowball next week with our coach.',amount:0,date:addDays(todayISO(),-13),own:false}
];

/* ---------------- state ---------------- */
function defaults(){
  return {
    v:2, setup:false,
    client:{name:'',coach:'Jeff Spencer',joined:todayISO()},
    ranks:[
      {name:'Steward in Training',min:0,   note:'You have begun. Faithfulness grows one day at a time.'},
      {name:'Faithful Servant',   min:120, note:'Consistent. Your small decisions are becoming a habit.'},
      {name:'Trusted Manager',    min:300, note:'You are handling more than money now \u2014 you are handling trust.'},
      {name:'Wise Builder',       min:600, note:'You are building something that will outlast you.'},
      {name:'Kingdom Investor',   min:1000,note:'Your stewardship is funding the Gospel.'}
    ],
    rewards:{check:10,allThree:15,challengeDay:15,challengeDone:50,entry:25},
    impact:{bible:5,meal:2.5,water:40},
    checkins:{},
    entries:[],
    challenge:{title:'Three lunches from home',target:3,start:mondayOf(todayISO()),days:[]},
    resources:SEED_RESOURCES.slice(),
    community:SEED_COMMUNITY.slice(),
    links:{group:'',text:'',call:''},
    passcode:'coach'
  };
}

let S = load();

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return defaults();
    const parsed = JSON.parse(raw);
    return Object.assign(defaults(), parsed);
  }catch(e){ return defaults(); }
}
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }
  catch(e){ toast('Could not save \u2014 storage may be full.'); }
}

/* ---------------- derived ---------------- */
function tally(){
  let t = 0;
  const r = S.rewards;
  Object.values(S.checkins).forEach(c=>{
    const n = [c.expenses,c.tithed,c.devotional].filter(Boolean).length;
    t += n * r.check;
    if(n === 3) t += r.allThree;
  });
  t += S.entries.length * r.entry;
  const wk = weekDays();
  t += wk.length * r.challengeDay;
  if(wk.length >= S.challenge.target) t += r.challengeDone;
  return t;
}

function weekDays(){
  const start = S.challenge.start || mondayOf(todayISO());
  const end = addDays(start,6);
  return (S.challenge.days||[]).filter(d=>d>=start && d<=end);
}

function rankOf(t){
  const ranks = S.ranks.slice().sort((a,b)=> a.min - b.min);
  let cur = ranks[0];
  ranks.forEach(r=>{ if(t >= r.min) cur = r; });
  const next = ranks.filter(r=>r.min > t)[0] || null;
  return {cur,next};
}

function streak(){
  const has = d => { const c = S.checkins[d]; return !!(c && (c.expenses || c.tithed || c.devotional)); };
  let d = todayISO(), n = 0;
  if(!has(d)) d = addDays(d,-1);
  while(has(d)){ n++; d = addDays(d,-1); }
  return n;
}

function ledgerTotal(){ return S.entries.reduce((s,e)=>s + (Number(e.amount)||0), 0); }

function devotionToday(){
  const days = Math.floor(Date.now()/86400000);
  return DEVOTIONALS[((days % DEVOTIONALS.length) + DEVOTIONALS.length) % DEVOTIONALS.length];
}

/* ---------------- helpers ---------------- */
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function titleFrom(story){
  let s = String(story).trim().replace(/\s+/g,' ');
  if(!s) return 'Untitled provision';
  const stop = s.search(/[.!?](\s|$)/);
  if(stop > 0 && stop < 64) s = s.slice(0, stop);
  if(s.length > 52){
    s = s.slice(0,52);
    const cut = s.lastIndexOf(' ');
    s = (cut > 24 ? s.slice(0,cut) : s).replace(/[\s,;:\-]+$/,'') + '\u2026';
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let toastT = null;
function toast(msg, win){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('win', !!win);
  el.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(()=>el.classList.remove('on'), 2400);
}

/* ---------------- render: home ---------------- */
function renderHome(){
  const t = tally();
  const {cur,next} = rankOf(t);
  $('#rankName').textContent = cur.name;
  $('#rankNote').textContent = cur.note;

  const span = next ? (next.min - cur.min) : 1;
  const pct = next ? Math.min(1,(t - cur.min)/span) : 1;
  let filled = Math.round(pct*10);
  if(pct > 0 && filled === 0) filled = 1;
  if(next) filled = Math.min(9, filled);
  $('#ledger').innerHTML = Array.from({length:10},(_,i)=>
    `<span class="coin${i<filled?' on':''}"></span>`).join('');

  $('#talentCount').textContent = t.toLocaleString('en-US');
  $('#nextRank').textContent = next ? `${next.min - t} to ${next.name}` : 'Highest rank reached';

  const st = streak();
  const chip = $('#streakChip');
  chip.hidden = st < 1;
  $('#streakNum').textContent = st;

  const today = todayISO();
  const c = S.checkins[today] || {expenses:false,tithed:false,devotional:false};
  $('#todayLabel').textContent = fmtLong(today);
  const n = [c.expenses,c.tithed,c.devotional].filter(Boolean).length;
  $('#todayPoints').textContent = `${n} of 3`;
  $$('.chk').forEach(row=>{
    const k = row.dataset.k;
    row.classList.toggle('done', !!c[k]);
    row.setAttribute('aria-checked', String(!!c[k]));
  });
  const bonus = $('#bonusLine');
  if(n === 3){ bonus.textContent = `All three today. +${S.rewards.allThree} bonus talents.`; bonus.classList.add('hit'); }
  else { bonus.textContent = `${3-n} more today for the +${S.rewards.allThree} bonus.`; bonus.classList.remove('hit'); }

  // challenge
  const wk = weekDays();
  const target = S.challenge.target || 1;
  $('#chalTitle').textContent = S.challenge.title || 'No challenge set';
  $('#chalReward').textContent = S.rewards.challengeDone;
  const done = wk.length >= target;
  $('#chalMeta').textContent = done
    ? `Complete \u2014 ${target} of ${target} this week`
    : `${wk.length} of ${target} this week \u00b7 +${S.rewards.challengeDay} each`;
  $('#chalPips').innerHTML = Array.from({length:target},(_,i)=>
    `<span class="pip${i<wk.length?' on':''}"></span>`).join('');
  const btn = $('#chalBtn');
  const loggedToday = wk.includes(todayISO());
  btn.disabled = done || loggedToday;
  btn.textContent = done ? 'Challenge complete' : (loggedToday ? 'Logged today \u2713' : 'Log today');

  // devotion
  const d = devotionToday();
  $('#devoRef').textContent = d.ref;
  $('#devoTitle').textContent = d.title;
  $('#devoBody').textContent = d.body;
  const dr = $('#devoRead');
  dr.textContent = c.devotional ? 'Read today \u2713' : 'I read this';
  dr.disabled = !!c.devotional;

  // impact
  const total = ledgerTotal();
  const imp = S.impact;
  $('#impactTotal').textContent = money(total);
  $('#impactGrid').innerHTML = [
    {n: Math.floor(total/imp.bible), l:'Bibles placed'},
    {n: Math.floor(total/imp.meal),  l:'Days of meals'},
    {n: Math.floor(total/imp.water), l:'People with clean water'}
  ].map(x=>`<div class="ig"><b>${x.n.toLocaleString('en-US')}</b><span>${x.l}</span></div>`).join('');
}

/* ---------------- render: journal ---------------- */
function renderJournal(){
  const total = ledgerTotal();
  $('#jTotal').textContent = money(total);
  const n = S.entries.length;
  $('#jMeta').textContent = n === 0 ? 'No entries yet'
    : `${n} ${n===1?'entry':'entries'} \u00b7 ${S.entries.filter(e=>e.shared).length} shared`;

  if(!$('#entryDate').value) $('#entryDate').value = todayISO();

  const list = $('#entryList');
  if(!n){
    list.innerHTML = `<div class="empty">The Providence Ledger is where you write down what God provided.<br>A refund. A gift. A bill that didn't come. Start with one.</div>`;
    return;
  }
  const sorted = S.entries.slice().sort((a,b)=> b.date.localeCompare(a.date));
  list.innerHTML = sorted.map(e=>`
    <article class="entry">
      <div class="ehead">
        <div class="etitle">${esc(e.title)}</div>
        <div class="eamt">${money(Number(e.amount)||0)}</div>
      </div>
      <div class="emeta">${fmtDate(e.date)}</div>
      <div class="estory">${esc(e.story)}</div>
      <div class="eact">
        <button class="chipbtn${e.shared?' on':''}" data-act="share" data-id="${e.id}" type="button">
          ${e.shared ? '\u2713 Shared anonymously' : 'Share anonymously'}
        </button>
        <button class="chipbtn" data-act="edit" data-id="${e.id}" type="button">Edit</button>
        <button class="chipbtn" data-act="del" data-id="${e.id}" type="button">Delete</button>
      </div>
    </article>`).join('');
}

/* ---------------- render: resources ---------------- */
let topicFilter = 'All';
function renderResources(){
  const topics = ['All', ...TOPICS.filter(t=>S.resources.some(r=>r.topic===t))];
  $('#topicChips').innerHTML = topics.map(t=>
    `<button class="chip${t===topicFilter?' on':''}" data-topic="${esc(t)}" type="button">${esc(t)}</button>`).join('');

  const items = S.resources.filter(r=> topicFilter==='All' || r.topic===topicFilter);
  const list = $('#resList');
  if(!items.length){
    list.innerHTML = `<div class="empty">Nothing here yet. Your coach can publish trainings in Coach mode.</div>`;
    return;
  }
  list.innerHTML = items.map(r=>`
    <button class="vitem" data-vid="${esc(r.yt||'')}" data-title="${esc(r.title)}" type="button">
      <span class="vthumb" ${r.yt?`style="background-image:url('https://i.ytimg.com/vi/${esc(r.yt)}/mqdefault.jpg')"`:''}>
        ${r.min?`<span class="vdur">${r.min} min</span>`:''}
      </span>
      <span class="vtext"><b>${esc(r.title)}</b><span>${esc(r.topic)}</span></span>
    </button>`).join('');
}

/* ---------------- render: community ---------------- */
function renderCommunity(){
  const links = [
    {k:'group',label:'Private group',icon:'<path d="M4 6h16v12H4z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'},
    {k:'text', label:'Text thread', icon:'<path d="M4 6h16v10H9l-4 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'},
    {k:'call', label:'Live calls',  icon:'<path d="M6 4l3 4-2 2a12 12 0 0 0 7 7l2-2 4 3-2 3c-6 0-13-7-13-13z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'}
  ];
  $('#commLinks').innerHTML = links.map(l=>
    `<button class="lk" data-link="${l.k}" type="button">
       <svg viewBox="0 0 24 24" aria-hidden="true">${l.icon}</svg><span>${l.label}</span>
     </button>`).join('');

  const pool = [
    ...S.community,
    ...S.entries.filter(e=>e.shared).map(e=>({id:'own_'+e.id, story:e.story, amount:Number(e.amount)||0, date:e.date, own:true}))
  ].sort((a,b)=> String(b.date).localeCompare(String(a.date)));

  $('#commList').innerHTML = pool.length ? pool.map(t=>`
    <article class="testimony">
      <div class="tq">\u201c${esc(t.story)}\u201d</div>
      <div class="tfoot">
        <span class="twho">${t.own ? 'You' : 'Anonymous'}</span>
        <span class="twhen">${fmtDate(t.date)}</span>
      </div>
    </article>`).join('')
    : `<div class="empty">No testimonies shared yet. When you record provision in the Journal, you can share it here anonymously.</div>`;
}

/* ---------------- render all ---------------- */
function render(){
  renderHome(); renderJournal(); renderResources(); renderCommunity();
}

/* ---------------- sheet ---------------- */
let lastFocus = null;
function openSheet(title, html){
  lastFocus = document.activeElement;
  clearTimeout(toastT);
  $('#toast').classList.remove('on');
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = html;
  $('#sheet').hidden = false;
  $('#sheetBody').scrollTop = 0;
  const focusable = $('#sheetBody').querySelector('input,textarea,select,button');
  if(focusable) setTimeout(()=>focusable.focus(), 60);
}
function closeSheet(){
  $('#sheet').hidden = true;
  $('#sheetBody').innerHTML = '';
  if(lastFocus && lastFocus.focus) lastFocus.focus();
}

/* ---------------- check-in ---------------- */
function toggleCheck(k){
  const t = todayISO();
  const c = S.checkins[t] || {expenses:false,tithed:false,devotional:false};
  const before = [c.expenses,c.tithed,c.devotional].filter(Boolean).length;
  c[k] = !c[k];
  S.checkins[t] = c;
  const after = [c.expenses,c.tithed,c.devotional].filter(Boolean).length;
  save(); renderHome();
  if(after === 3 && before < 3) toast(`All three today. +${S.rewards.allThree} bonus talents.`, true);
  else if(c[k]) toast(`+${S.rewards.check} talents`);
}

/* ---------------- tabs ---------------- */
function switchTab(name){
  $$('.tab').forEach(t=>t.classList.toggle('on', t.id === 'tab-'+name));
  $$('.nb').forEach(b=>b.classList.toggle('on', b.dataset.tab === name));
  window.scrollTo({top:0, behavior:'instant' in window ? 'instant' : 'auto'});
  if(name==='journal') renderJournal();
  if(name==='resources') renderResources();
  if(name==='community') renderCommunity();
}

/* ---------------- entries ---------------- */
function saveEntry(){
  const story = $('#entryStory').value.trim();
  const amount = parseFloat($('#entryAmount').value);
  const date = $('#entryDate').value || todayISO();
  const shared = $('#entryShare').checked;
  const err = $('#entryErr');

  if(story.length < 10){ err.hidden=false; err.textContent='Tell a little more \u2014 at least a sentence.'; return; }
  if(!(amount > 0)){ err.hidden=false; err.textContent='Enter the amount provided.'; return; }
  err.hidden = true;

  S.entries.push({
    id:'e'+Date.now().toString(36),
    title:titleFrom(story), story, amount, date, shared,
    created:new Date().toISOString()
  });
  save();
  $('#entryStory').value=''; $('#entryAmount').value=''; $('#entryShare').checked=false; $('#entryDate').value=todayISO();
  render();
  toast(`Recorded. +${S.rewards.entry} talents`, true);
  window.scrollTo({top:0,behavior:'smooth'});
}

function editEntry(id){
  const e = S.entries.find(x=>x.id===id); if(!e) return;
  openSheet('Edit entry', `
    <label class="field"><span>What happened?</span>
      <textarea id="edStory" rows="4">${esc(e.story)}</textarea></label>
    <div class="row2">
      <label class="field"><span>Amount</span>
        <input id="edAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${e.amount}"></label>
      <label class="field"><span>Date</span>
        <input id="edDate" type="date" value="${e.date}"></label>
    </div>
    <label class="switch">
      <input type="checkbox" id="edShare" ${e.shared?'checked':''}>
      <span class="track"><span class="knob"></span></span>
      <span class="switchtext">Share anonymously with the group</span>
    </label>
    <button class="btn" id="edSave" type="button">Save changes</button>
    <button class="btn danger" id="edDel" type="button" style="margin-top:10px">Delete this entry</button>
  `);
  $('#edSave').addEventListener('click', ()=>{
    const story = $('#edStory').value.trim();
    const amount = parseFloat($('#edAmount').value);
    if(story.length < 10 || !(amount > 0)){ toast('A story and an amount, please.'); return; }
    e.story = story; e.amount = amount; e.date = $('#edDate').value || e.date;
    e.shared = $('#edShare').checked; e.title = titleFrom(story);
    save(); render(); closeSheet(); toast('Saved');
  });
  $('#edDel').addEventListener('click', ()=>{
    if(!confirm('Delete this entry? This cannot be undone.')) return;
    S.entries = S.entries.filter(x=>x.id!==id);
    save(); render(); closeSheet(); toast('Entry deleted');
  });
}

/* ---------------- video ---------------- */
function playVideo(yt, title){
  if(!yt){
    openSheet('No video yet', `<p>This training has no video attached. Your coach can add a YouTube link in Coach mode.</p>`);
    return;
  }
  openSheet(title || 'Training', `
    <div class="vidwrap"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yt)}?rel=0"
      title="${esc(title||'Training')}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
      allowfullscreen></iframe></div>
    <p class="hint">Opens from YouTube. If it won't play here, your device may block embedded video.</p>
  `);
}

/* ---------------- coach ---------------- */
function openCoach(){
  if(S.passcode){
    openSheet('Coach mode', `
      <p>This panel changes what every client sees on this device.</p>
      <label class="field"><span>Passcode</span>
        <input id="pcIn" type="password" placeholder="Passcode" autocomplete="off"></label>
      <button class="btn" id="pcGo" type="button">Unlock</button>
      <p class="hint">Default passcode is <b>coach</b>. Change it in Coach mode.</p>
    `);
    const go = ()=>{
      if($('#pcIn').value === S.passcode){ coachPanel(); }
      else { toast('Wrong passcode'); }
    };
    $('#pcGo').addEventListener('click', go);
    $('#pcIn').addEventListener('keydown', ev=>{ if(ev.key==='Enter') go(); });
    return;
  }
  coachPanel();
}

function coachPanel(){
  const r = S.rewards, im = S.impact;
  openSheet('Coach mode', `
    <h3>Client</h3>
    <div class="srow"><span class="k">Name</span>
      <input type="text" data-cp="client.name" value="${esc(S.client.name)}"></div>
    <div class="srow"><span class="k">Coach</span>
      <input type="text" data-cp="client.coach" value="${esc(S.client.coach)}"></div>

    <h3>This week's challenge</h3>
    <div class="srow"><span class="k">Title</span>
      <input type="text" data-cp="challenge.title" value="${esc(S.challenge.title)}"></div>
    <div class="srow"><span class="k">Days this week</span>
      <input type="number" min="1" max="7" data-cp="challenge.target" value="${S.challenge.target}"></div>
    <button class="btn ghost sm" id="chalReset" type="button">Start a fresh week</button>

    <h3>Talents</h3>
    <div class="srow"><span class="k">Each check-in</span><input type="number" data-cp="rewards.check" value="${r.check}"></div>
    <div class="srow"><span class="k">All three in a day</span><input type="number" data-cp="rewards.allThree" value="${r.allThree}"></div>
    <div class="srow"><span class="k">Challenge day</span><input type="number" data-cp="rewards.challengeDay" value="${r.challengeDay}"></div>
    <div class="srow"><span class="k">Challenge complete</span><input type="number" data-cp="rewards.challengeDone" value="${r.challengeDone}"></div>
    <div class="srow"><span class="k">Journal entry</span><input type="number" data-cp="rewards.entry" value="${r.entry}"></div>

    <h3>Kingdom impact unit costs</h3>
    <div class="srow"><span class="k">Bible</span><input type="number" step="0.01" data-cp="impact.bible" value="${im.bible}"></div>
    <div class="srow"><span class="k">Day of meals</span><input type="number" step="0.01" data-cp="impact.meal" value="${im.meal}"></div>
    <div class="srow"><span class="k">Clean water, one person</span><input type="number" step="0.01" data-cp="impact.water" value="${im.water}"></div>

    <h3>Ranks</h3>
    ${S.ranks.map((rk,i)=>`
      <div class="srow">
        <input type="text" data-cp="ranks.${i}.name" value="${esc(rk.name)}">
        <input type="number" data-cp="ranks.${i}.min" value="${rk.min}">
      </div>`).join('')}

    <h3>Group links</h3>
    <div class="srow"><span class="k">Group</span><input type="url" data-cp="links.group" value="${esc(S.links.group)}" placeholder="https://"></div>
    <div class="srow"><span class="k">Text</span><input type="url" data-cp="links.text" value="${esc(S.links.text)}" placeholder="https://"></div>
    <div class="srow"><span class="k">Calls</span><input type="url" data-cp="links.call" value="${esc(S.links.call)}" placeholder="https://"></div>

    <h3>Resources</h3>
    ${S.resources.map((x,i)=>`
      <div class="srow"><span class="k">${esc(x.title)}<br><span class="hint">${esc(x.topic)}</span></span>
        <button class="del" data-delres="${i}" type="button">Remove</button></div>`).join('') || '<p class="hint">None yet.</p>'}
    <label class="field"><span>Add a training</span>
      <input id="resTitle" type="text" placeholder="Title"></label>
    <div class="row2">
      <label class="field"><span>Topic</span>
        <select id="resTopic">${TOPICS.map(t=>`<option>${t}</option>`).join('')}</select></label>
      <label class="field"><span>Minutes</span>
        <input id="resMin" type="number" min="0" placeholder="0"></label>
    </div>
    <label class="field"><span>YouTube link or ID</span>
      <input id="resYt" type="text" placeholder="https://youtube.com/watch?v=..."></label>
    <button class="btn ghost sm" id="resAdd" type="button">Add training</button>

    <h3>Security</h3>
    <div class="srow"><span class="k">Passcode</span>
      <input type="text" data-cp="passcode" value="${esc(S.passcode)}"></div>
    <p class="hint">This gate keeps clients out of the coach panel on a shared device. It is not encryption \u2014 anyone with the device and a developer console can read the data.</p>

    <h3>Data</h3>
    <button class="btn ghost sm" id="dataExport" type="button">Download a backup</button>
    <label class="btn ghost sm" style="margin-left:8px" for="dataImport">Restore from backup</label>
    <input id="dataImport" type="file" accept="application/json" hidden>
    <button class="btn ghost sm" id="dataDemo" type="button" style="margin-top:10px">Load demo data</button>
    <button class="btn danger sm" id="dataReset" type="button" style="margin-top:10px">Erase everything</button>
  `);

  const body = $('#sheetBody');
  body.addEventListener('change', ev=>{
    const el = ev.target;
    const path = el.dataset.cp;
    if(!path) return;
    let val = el.value;
    if(el.type === 'number') val = Number(val) || 0;
    const parts = path.split('.');
    let o = S;
    for(let i=0;i<parts.length-1;i++) o = o[parts[i]];
    o[parts[parts.length-1]] = val;
    if(path === 'passcode' && !val) S.passcode = '';
    save(); render();
    if(path.startsWith('challenge') || path.startsWith('rewards') || path.startsWith('ranks')) toast('Saved');
  });

  $('#chalReset').addEventListener('click', ()=>{
    S.challenge.start = mondayOf(todayISO());
    S.challenge.days = [];
    save(); render(); toast('Fresh week started');
  });

  $$('[data-delres]').forEach(b=>b.addEventListener('click', ()=>{
    S.resources.splice(Number(b.dataset.delres),1);
    save(); renderResources(); coachPanel(); toast('Removed');
  }));

  $('#resAdd').addEventListener('click', ()=>{
    const title = $('#resTitle').value.trim();
    if(!title){ toast('Give the training a title'); return; }
    let yt = $('#resYt').value.trim();
    const m = yt.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    if(m) yt = m[1];
    else if(/^[\w-]{11}$/.test(yt)) { /* already an id */ }
    else if(yt) { toast('That does not look like a YouTube link'); return; }
    S.resources.push({id:'r'+Date.now().toString(36), title, topic:$('#resTopic').value, yt, min:Number($('#resMin').value)||0});
    save(); renderResources(); coachPanel(); toast('Training added');
  });

  $('#dataExport').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Abundus Backup ${todayISO()}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  });

  $('#dataImport').addEventListener('change', ev=>{
    const f = ev.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = ()=>{
      try{
        const parsed = JSON.parse(rd.result);
        if(!parsed || typeof parsed !== 'object' || !('entries' in parsed)) throw new Error('bad');
        S = Object.assign(defaults(), parsed);
        save(); render(); closeSheet(); toast('Backup restored', true);
      }catch(e){ toast('That file is not an Abundus backup'); }
    };
    rd.readAsText(f);
  });

  $('#dataDemo').addEventListener('click', ()=>{ loadDemo(); closeSheet(); render(); toast('Demo data loaded', true); });

  $('#dataReset').addEventListener('click', ()=>{
    if(!confirm('Erase all data on this device? Export a backup first if you need it.')) return;
    localStorage.removeItem(KEY);
    S = defaults();
    save(); closeSheet(); render(); showOnboard(true); toast('Erased');
  });
}

/* ---------------- demo data ---------------- */
function loadDemo(){
  const base = defaults();
  base.setup = true;
  base.client = {name:'Maria R.', coach:'Jeff Spencer', joined:addDays(todayISO(),-58)};
  base.checkins = {};
  for(let i=0;i<12;i++){
    const d = addDays(todayISO(),-i);
    if(i === 3 || i === 7) continue; // two missed days
    base.checkins[d] = {expenses:true, tithed:i%2===0, devotional:i%3!==0};
  }
  base.checkins[todayISO()] = {expenses:true, tithed:true, devotional:false};
  base.entries = [
    {id:'d1',title:'The transmission',story:'The transmission went out on the van. I had been setting aside $75 a month for a year into an account I stopped thinking about. It covered the repair with $40 left over.',amount:1240,date:addDays(todayISO(),-4),shared:true},
    {id:'d2',title:'Refund I did not expect',story:'A refund from an overpaid medical bill showed up thirteen months late. I put half of it straight into the tithe and the other half on the smallest card.',amount:310,date:addDays(todayISO(),-16),shared:false},
    {id:'d3',title:'Work bonus',story:'I received a bonus at work. Instead of upgrading the car, we finished the emergency fund. The car is fine. So is my sleep.',amount:1800,date:addDays(todayISO(),-29),shared:true}
  ];
  base.challenge = {title:'Three lunches from home', target:3, start:mondayOf(todayISO()), days:[addDays(mondayOf(todayISO()),0), addDays(mondayOf(todayISO()),1)].filter(d=>d<=todayISO())};
  S = base; save();
}

/* ---------------- onboarding ---------------- */
function showOnboard(force){
  $('#onboard').hidden = !(force || !S.setup);
  if(!$('#onboard').hidden){
    setTimeout(()=>$('#obName').focus(), 120);
    $('#obName').value = S.client.name || '';
    $('#obCoach').value = S.client.coach || 'Jeff Spencer';
  }
}

/* ---------------- wiring ---------------- */
function bind(){
  $$('.nb').forEach(b=>b.addEventListener('click', ()=>switchTab(b.dataset.tab)));

  $('#coachBtn').addEventListener('click', openCoach);
  $('#streakChip').addEventListener('click', ()=>{
    const st = streak();
    toast(st ? `${st}-day streak. Do not break it.` : 'No streak yet \u2014 check in today.');
  });

  $$('.chk').forEach(row=>{
    const act = ()=>toggleCheck(row.dataset.k);
    row.addEventListener('click', act);
    row.addEventListener('keydown', ev=>{ if(ev.key===' '||ev.key==='Enter'){ ev.preventDefault(); act(); } });
  });

  $('#chalBtn').addEventListener('click', ()=>{
    const t = todayISO();
    const start = S.challenge.start || mondayOf(t);
    if(t < start || t > addDays(start,6)){ toast('This week has rolled over. Ask your coach for the new challenge.'); return; }
    const wk = weekDays();
    if(wk.length >= S.challenge.target){ toast('Already complete'); return; }
    S.challenge.days.push(t);
    save(); renderHome();
    const now = weekDays().length;
    if(now >= S.challenge.target) toast(`Challenge complete. +${S.rewards.challengeDone} talents`, true);
    else toast(`+${S.rewards.challengeDay} talents`);
  });

  $('#devoRead').addEventListener('click', ()=>{
    const t = todayISO();
    const c = S.checkins[t] || {expenses:false,tithed:false,devotional:false};
    if(c.devotional) return;
    c.devotional = true; S.checkins[t] = c;
    save(); renderHome(); toast(`+${S.rewards.check} talents`);
  });

  $('#entrySave').addEventListener('click', saveEntry);

  $('#entryList').addEventListener('click', ev=>{
    const b = ev.target.closest('[data-act]'); if(!b) return;
    const id = b.dataset.id;
    const e = S.entries.find(x=>x.id===id); if(!e) return;
    if(b.dataset.act === 'share'){
      e.shared = !e.shared; save(); render();
      toast(e.shared ? 'Shared anonymously with the group' : 'Sharing stopped');
    }
    if(b.dataset.act === 'edit') editEntry(id);
    if(b.dataset.act === 'del'){
      if(!confirm('Delete this entry? This cannot be undone.')) return;
      S.entries = S.entries.filter(x=>x.id!==id); save(); render(); toast('Entry deleted');
    }
  });

  $('#topicChips').addEventListener('click', ev=>{
    const c = ev.target.closest('[data-topic]'); if(!c) return;
    topicFilter = c.dataset.topic; renderResources();
  });

  $('#resList').addEventListener('click', ev=>{
    const b = ev.target.closest('[data-vid]'); if(!b) return;
    playVideo(b.dataset.vid, b.dataset.title);
  });

  $('#commLinks').addEventListener('click', ev=>{
    const b = ev.target.closest('[data-link]'); if(!b) return;
    const url = S.links[b.dataset.link];
    if(url){ window.open(url, '_blank', 'noopener'); }
    else toast('Your coach has not added this link yet.');
  });

  $('#sheet').addEventListener('click', ev=>{
    if(ev.target.closest('[data-close]')) closeSheet();
  });
  document.addEventListener('keydown', ev=>{
    if(ev.key === 'Escape' && !$('#sheet').hidden) closeSheet();
  });

  $('#impactWhy').addEventListener('click', ()=>{
    openSheet('Why the numbers matter', `
      <p>Spending buys something you consume once. Stewardship buys something that outlasts you.</p>
      <p>Every dollar recorded in your Providence Ledger is money God provided that you did not consume \u2014 which makes it available for the Gospel. Your coach sets the unit costs, so the figures are real conversions, not slogans.</p>
      <p class="hint">\u201cI tell you, use worldly wealth to gain friends for yourselves, so that when it is gone, you will be welcomed into eternal dwellings.\u201d \u2014 Luke 16:9</p>
    `);
  });

  // onboarding
  $('#obGo').addEventListener('click', ()=>{
    const name = $('#obName').value.trim();
    if(!name){ toast('A first name is enough'); $('#obName').focus(); return; }
    S.client.name = name;
    S.client.coach = $('#obCoach').value.trim() || 'Jeff Spencer';
    S.setup = true;
    if(!S.challenge.start) S.challenge.start = mondayOf(todayISO());
    save(); render(); showOnboard(false);
    switchTab('home');
    toast(`Welcome, ${name}.`, true);
  });
  $('#obName').addEventListener('keydown', ev=>{ if(ev.key==='Enter') $('#obGo').click(); });
}

/* ---------------- start ---------------- */
bind();
render();
showOnboard(false);

// keep "today" honest if the app is left open across midnight
let lastDay = todayISO();
setInterval(()=>{
  if(todayISO() !== lastDay){ lastDay = todayISO(); render(); }
}, 60000);

if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

// expose for debugging / backup scripts
window.Abundus = {get state(){return S;}, render, save, loadDemo};
})();
