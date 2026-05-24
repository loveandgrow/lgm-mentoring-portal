/* ══════════════════════════════════════════════════════════════
   LOVE AND GROW MENTORSHIP — Mentoring Portal 2026
   loveandgrowmentorship.org
   Backend: Google Sheets (free) · Auth: PIN-based · No Microsoft needed
══════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
// CONFIG — Admin fills in after Google Sheets setup (see guide)
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  // Google Apps Script Web App URL (deploy from your Google Sheet)
  // Set to 'DEMO' to run in demo mode with no backend
  apiUrl: 'DEMO',
  appName: 'Love and Grow Mentorship',
  domain:  'loveandgrowmentorship.org',
  year:    '2026',
};

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const MONTH_TOPICS = {
  'Grade 9':    ['Group Session / GTKU','Results, Goals & SWOT','Vision Board','Stress & Anxiety','Results & Goal Review','Mentor GS','Group Session','Results & Goals Review','Mentor GS','Results & Goal Review','PSS Mentor GS','PSS Mentor GS'],
  'Grade 10':   ['Group Session / GTKU','Self Awareness','Vision Board','Stress & Anxiety','Results & Goal Review','GS Survey','Group Session','Results & Goals Review','Mentor GS','Results & Goal Review','PSS Mentor GS','PSS Mentor GS'],
  'Grade 11':   ['Group Session / GTKU','Self Awareness','Vision Board','Stress & Anxiety','Results & Goal Review','GS Survey','Group Session','Results & Goals Review','Mentor GS','Results & Goal Review','PSS Mentor GS','PSS Mentor GS'],
  'Grade 12':   ['Group Session / GTKU','Vision Board & SWOT','Goal Setting','PSS & Mentor GS','Exam Prep & Support','No Session','Group Session','Career Workshop','Mentor GS','No Session','PSS Mentor GS','PSS Mentor GS'],
  'Post Matric':['—','Meet & Greet / Tertiary Intro','—','—','Exam Preparation','—','—','Term 3 Session','—','—','—','Term 4 Session'],
};

const SESSION_TYPES = [
  'Get To Know You (GTKU)',
  'Individual Session',
  'Group Session',
  'Vision Board',
  'SWOT Analysis',
  'Goal Setting',
  'Results Review',
  'Stress & Anxiety',
  'Career Workshop',
  'Exam Preparation',
  'Self Awareness',
  'Quarterly Review',
  'Peer Support Session (PSS)',
  'Parent Support Session',
  'Academic Support',
  'Life Skills',
  'Other',
];

const GRADE_SUBJECTS = {
  'Grade 9':    ['Mathematics','Tshivenda (HL)','Natural Science','English FAL','Social Science','Technology','Life Orientation'],
  'Grade 10':   ['Mathematics','Tshivenda (HL)','Physical Science','English FAL','Life Science','History','Life Orientation'],
  'Grade 11':   ['Mathematics','Tshivenda (HL)','Physical Science','English FAL','Life Science','History','Life Orientation'],
  'Grade 12':   ['Mathematics','Physical Science','Life Science','English FAL','History','Accounting','Maths Literacy'],
  'Post Matric':['Module 1','Module 2','Module 3','Module 4','Module 5'],
};

const SCHOOLS = [
  'Madimba High School','Randburg Secondary','Soweto Academy',
  'Thohoyandou High','Midrand Technical','Limpopo Combined',
  'Tshwane North','Other',
];

const WELLBEING_OPTS = [
  {e:'😊',l:'Thriving'},{e:'🙂',l:'Good'},{e:'😐',l:'Neutral'},
  {e:'😟',l:'Struggling'},{e:'🆘',l:'Needs Support'},
];

// ─────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────
let S = {
  currentUser: null,  // { id, name, role, pin }
  users: [],          // all mentors + admins
  mentees: [],
  sessions: [],
  pendingFiles: [],
  selectedSessionTypes: [],
  selectedWellbeing: '',
};

// ─────────────────────────────────────────────────────────────
// DEMO DATA (used when CONFIG.apiUrl === 'DEMO')
// ─────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { id:'u1', name:'Thandi Mokoena',   role:'admin',  pin:'1234' },
  { id:'u2', name:'Sipho Dlamini',    role:'mentor', pin:'2345' },
  { id:'u3', name:'Lerato Khumalo',   role:'mentor', pin:'3456' },
  { id:'u4', name:'Coordinator Demo', role:'admin',  pin:'0000' },
];
const DEMO_MENTEES = [
  { id:'m1', name:'Amahle Zulu',    grade:'Grade 12', school:'Madimba High School', gender:'Female', mentorId:'u2' },
  { id:'m2', name:'Tebogo Sithole', grade:'Grade 10', school:'Randburg Secondary',  gender:'Male',   mentorId:'u2' },
  { id:'m3', name:'Precious Nkosi', grade:'Grade 9',  school:'Soweto Academy',      gender:'Female', mentorId:'u3' },
];
const DEMO_SESSIONS = [
  { id:'s1', menteeId:'m1', menteeName:'Amahle Zulu', mentorId:'u2', mentorName:'Sipho Dlamini', grade:'Grade 12', month:'January', sessionTypes:'Get To Know You (GTKU)', date:'2026-01-15', format:'In-Person', duration:'60 minutes', wellbeing:'😊 Thriving', engagementRating:'4', qualityRating:'5', focusNotes:'Great first session. Discussed vision and goals for matric year.', checkinNotes:'Feeling excited and motivated.', goalShort:'Pass term 1 with 65% average', goalLong:'University admission for BSc', evidenceFolderUrl:'' },
  { id:'s2', menteeId:'m2', menteeName:'Tebogo Sithole', mentorId:'u2', mentorName:'Sipho Dlamini', grade:'Grade 10', month:'February', sessionTypes:'Results Review, Goal Setting', date:'2026-02-10', format:'Video Call (Teams)', duration:'45 minutes', wellbeing:'🙂 Good', engagementRating:'3', qualityRating:'4', focusNotes:'Reviewed term results. Set targets for term 2.', checkinNotes:'A bit anxious about results.', goalShort:'Improve Maths from 52% to 65%', goalLong:'Become a civil engineer', evidenceFolderUrl:'' },
];

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  buildMentorSelectList();
});

function loadLocalState() {
  try {
    const saved = localStorage.getItem('lgm_2026_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      S.users    = parsed.users    || DEMO_USERS;
      S.mentees  = parsed.mentees  || DEMO_MENTEES;
      S.sessions = parsed.sessions || DEMO_SESSIONS;
    } else {
      S.users    = DEMO_USERS;
      S.mentees  = DEMO_MENTEES;
      S.sessions = DEMO_SESSIONS;
      persistState();
    }
  } catch { S.users = DEMO_USERS; S.mentees = DEMO_MENTEES; S.sessions = DEMO_SESSIONS; }
}

function persistState() {
  try { localStorage.setItem('lgm_2026_state', JSON.stringify({ users: S.users, mentees: S.mentees, sessions: S.sessions })); } catch(e) {}
}

// ─────────────────────────────────────────────────────────────
// LOGIN FLOW
// ─────────────────────────────────────────────────────────────
let selectedUserId = null;

function buildMentorSelectList() {
  const el = document.getElementById('mentor-list');
  if (!el) return;
  el.innerHTML = S.users.map(u => `
    <div class="mentor-select-item" id="ms-${u.id}" onclick="selectMentor('${u.id}')">
      <div class="mentor-avatar">${initials(u.name)}</div>
      <div class="mentor-info">
        <strong>${u.name}</strong>
        <span>${u.role === 'admin' ? '👑 Coordinator' : '🌱 Mentor'}</span>
      </div>
    </div>`).join('');
}

function selectMentor(id) {
  selectedUserId = id;
  document.querySelectorAll('.mentor-select-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('ms-' + id)?.classList.add('selected');
  document.getElementById('sel-err').classList.remove('show');
}

function goToPin() {
  if (!selectedUserId) { document.getElementById('sel-err').classList.add('show'); return; }
  const user = S.users.find(u => u.id === selectedUserId);
  document.getElementById('pin-name-display').textContent = user.name.split(' ')[0];
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-err').classList.remove('show');
  showScreen('screen-pin');
  setTimeout(() => document.getElementById('pin-input')?.focus(), 200);
}

function goBack() {
  showScreen('screen-select');
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-err').classList.remove('show');
}

function doLogin() {
  const pin = document.getElementById('pin-input').value.trim();
  const user = S.users.find(u => u.id === selectedUserId);
  if (!user || pin !== user.pin) {
    document.getElementById('pin-err').classList.add('show');
    document.getElementById('pin-input').value = '';
    document.getElementById('pin-input').focus();
    return;
  }
  S.currentUser = user;
  launchApp();
}

function signOut() {
  S.currentUser = null;
  selectedUserId = null;
  S.pendingFiles = [];
  S.selectedSessionTypes = [];
  S.selectedWellbeing = '';
  document.getElementById('app').style.display = 'none';
  showScreen('screen-select');
  buildMentorSelectList();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// ─────────────────────────────────────────────────────────────
// APP LAUNCH
// ─────────────────────────────────────────────────────────────
function launchApp() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const appEl = document.getElementById('app');
  appEl.style.display = 'flex';
  const u = S.currentUser;
  document.getElementById('user-name-display').textContent = u.name.split(' ')[0];
  document.getElementById('user-av').textContent = initials(u.name);
  buildNav();
  navigate('dashboard');
}

function buildNav() {
  const isAdmin = S.currentUser.role === 'admin';
  const items = isAdmin ? [
    {id:'dashboard',    label:'📊 Overview'},
    {id:'all-sessions', label:'📋 All Sessions'},
    {id:'all-mentees',  label:'👥 All Mentees'},
    {id:'progress',     label:'📈 Progress'},
    {id:'admin-panel',  label:'⚙️ Admin'},
  ] : [
    {id:'dashboard',    label:'🏠 Dashboard'},
    {id:'capture',      label:'✏️ Capture'},
    {id:'my-mentees',   label:'👥 Mentees'},
    {id:'my-sessions',  label:'📋 Sessions'},
    {id:'progress',     label:'📈 Progress'},
  ];
  document.getElementById('topbar-nav').innerHTML = items.map(i =>
    `<button class="nav-btn" id="nb-${i.id}" onclick="navigate('${i.id}')">${i.label}</button>`
  ).join('');
}

function navigate(page) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('nb-'+page)?.classList.add('active');
  const wrap = document.getElementById('page-wrap');
  const isAdmin = S.currentUser.role === 'admin';
  const pages = {
    'dashboard':    isAdmin ? adminDashboard() : mentorDashboard(),
    'capture':      capturePage(),
    'my-mentees':   myMenteesPage(),
    'my-sessions':  mySessionsPage(),
    'all-sessions': allSessionsPage(),
    'all-mentees':  allMenteesPage(),
    'progress':     progressPage(),
    'admin-panel':  adminPanel(),
  };
  wrap.innerHTML = pages[page] || mentorDashboard();
  if (page === 'capture') initCapture();
  if (page === 'progress') renderProgress();
  if (page === 'all-sessions') initFilters();
}

// ─────────────────────────────────────────────────────────────
// MENTOR DASHBOARD
// ─────────────────────────────────────────────────────────────
function mentorDashboard() {
  const u = S.currentUser;
  const myMentees  = S.mentees.filter(m => m.mentorId === u.id);
  const mySessions = S.sessions.filter(s => s.mentorId === u.id);
  const thisMonth  = MONTHS[new Date().getMonth()];
  const doneThis   = mySessions.filter(s => s.month === thisMonth).length;
  const withEvid   = mySessions.filter(s => s.evidenceFolderUrl).length;

  return `
  <div class="page-header green">
    <h1>Welcome, ${u.name.split(' ')[0]}! 🌱</h1>
    <p>Track your mentees' journey and capture their monthly progress.</p>
    <span class="pill pill-gold">${thisMonth} ${CONFIG.year}</span>
  </div>
  ${CONFIG.apiUrl === 'DEMO' ? `<div style="background:#fef6e8;border:1px solid var(--gold-mid);border-radius:var(--r-sm);padding:10px 16px;font-size:13px;color:var(--gold-dark);font-weight:700;margin-bottom:1.5rem;display:flex;align-items:center;gap:8px;">⚡ Demo Mode — data saves to this browser only. Connect Google Sheets to share data across all mentors. See Setup Guide.</div>` : ''}
  <div class="stats-grid">
    <div class="stat g"><div class="stat-lbl">My Mentees</div><div class="stat-val">${myMentees.length}</div><div class="stat-sub">Active 2026</div></div>
    <div class="stat o"><div class="stat-lbl">Sessions Captured</div><div class="stat-val">${mySessions.length}</div><div class="stat-sub">Total this year</div></div>
    <div class="stat t"><div class="stat-lbl">${thisMonth} Sessions</div><div class="stat-val">${doneThis}</div><div class="stat-sub">of ${myMentees.length} due</div></div>
    <div class="stat p"><div class="stat-lbl">Evidence Filed</div><div class="stat-val">${withEvid}</div><div class="stat-sub">With files linked</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="card-hdr"><div class="card-title">🗓️ Monthly Calendar</div></div>
      <div class="months-grid">
        ${MONTHS.map((m,i)=>{
          const cnt = mySessions.filter(s=>s.month===m).length;
          const curr = m===thisMonth, past = i<new Date().getMonth();
          return `<div class="m-tile ${curr?'curr':''} ${cnt>0&&!curr?'done':''}">
            <div class="mn">${m.substring(0,3)}</div>
            <div class="mb">${cnt>0?`<span class="badge bg">✓${cnt}</span>`:curr?`<span class="badge bo">Due</span>`:past?`<span class="badge bgr">—</span>`:`<span class="badge bgr">·</span>`}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div>
      <div class="card">
        <div class="card-title" style="margin-bottom:1rem">⚡ Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-primary btn-full" onclick="navigate('capture')">✏️ Capture a Session</button>
          <button class="btn btn-outline btn-full" onclick="navigate('my-mentees')">👥 Manage My Mentees</button>
          <button class="btn btn-ghost btn-full" onclick="exportMyData()">⬇️ Export My Portfolio</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:1rem">📋 Session Checklist</div>
        ${[['10 min','Check In — how is the mentee doing?'],
           ['10 min','School Update — highlights & lowlights'],
           ['30 min','Focus Point — main topic of session'],
           ['10 min','Preview — prepare for next session']
          ].map(([t,l])=>`<div class="check-item">
          <div class="chkbox" onclick="this.classList.toggle('ticked');this.textContent=this.classList.contains('ticked')?'✓':''"></div>
          <div class="chk-lbl"><strong>${t}</strong> — ${l}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-hdr">
      <div class="card-title">📝 Recent Sessions</div>
      <button class="btn btn-outline btn-sm" onclick="navigate('my-sessions')">View All</button>
    </div>
    ${sessionsTable(mySessions.slice(-5).reverse(), false)}
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// ADMIN / COORDINATOR DASHBOARD
// ─────────────────────────────────────────────────────────────
function adminDashboard() {
  const thisMonth = MONTHS[new Date().getMonth()];
  const allMentors = S.users.filter(u=>u.role==='mentor');
  const withEvid = S.sessions.filter(s=>s.evidenceFolderUrl).length;

  const gradeStats = ['Grade 9','Grade 10','Grade 11','Grade 12','Post Matric'].map(g=>({
    grade:g,
    mentees: S.mentees.filter(m=>m.grade===g).length,
    sessions: S.sessions.filter(s=>s.grade===g).length,
  }));

  const mentorStats = allMentors.map(u=>({
    name:u.name,
    mentees:  S.mentees.filter(m=>m.mentorId===u.id).length,
    sessions: S.sessions.filter(s=>s.mentorId===u.id).length,
    thisMonth:S.sessions.filter(s=>s.mentorId===u.id&&s.month===thisMonth).length,
  }));

  return `
  <div class="coord-banner">👑 Coordinator View — Full programme visibility across all mentors and mentees.</div>
  <div class="page-header gold">
    <h1>Programme Overview</h1>
    <p>All mentors · All mentees · All sessions · ${CONFIG.year}</p>
    <span class="pill pill-white">Refreshed ${new Date().toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</span>
  </div>
  ${CONFIG.apiUrl === 'DEMO' ? `<div style="background:#fef6e8;border:1px solid var(--gold-mid);border-radius:var(--r-sm);padding:10px 16px;font-size:13px;color:var(--gold-dark);font-weight:700;margin-bottom:1.5rem">⚡ Demo Mode — connect Google Sheets to share data across devices. See Setup Guide.</div>` : ''}
  <div class="stats-grid">
    <div class="stat g"><div class="stat-lbl">Mentors</div><div class="stat-val">${allMentors.length}</div><div class="stat-sub">Active</div></div>
    <div class="stat o"><div class="stat-lbl">Mentees</div><div class="stat-val">${S.mentees.length}</div><div class="stat-sub">Registered</div></div>
    <div class="stat t"><div class="stat-lbl">Sessions</div><div class="stat-val">${S.sessions.length}</div><div class="stat-sub">${S.sessions.filter(s=>s.month===thisMonth).length} in ${thisMonth}</div></div>
    <div class="stat p"><div class="stat-lbl">Evidence Filed</div><div class="stat-val">${withEvid}</div><div class="stat-sub">With links</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="card-title" style="margin-bottom:1rem">📚 Sessions by Grade</div>
      ${gradeStats.map(g=>`
      <div style="margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px;font-weight:800;color:var(--mid)">${g.grade}</span>
          <span style="font-size:12px;color:var(--light)">${g.sessions} sessions · ${g.mentees} mentees</span>
        </div>
        <div class="prog-wrap"><div class="prog-fill" style="width:${g.mentees>0?Math.min(100,Math.round(g.sessions/(g.mentees*12)*100)):0}%"></div></div>
      </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:1rem">👤 Mentor Activity — ${thisMonth}</div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Mentor</th><th>Mentees</th><th>Total</th><th>${thisMonth.substring(0,3)}</th><th>Status</th></tr></thead>
          <tbody>
          ${mentorStats.length ? mentorStats.map(m=>`<tr>
            <td><div class="av-row"><div class="av sm">${initials(m.name)}</div>${m.name}</div></td>
            <td>${m.mentees}</td><td>${m.sessions}</td><td>${m.thisMonth}</td>
            <td>${m.thisMonth>=m.mentees&&m.mentees>0?'<span class="badge bg">✓ On track</span>':m.thisMonth>0?'<span class="badge bo">Partial</span>':'<span class="badge bgr">Pending</span>'}</td>
          </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--light)">No mentors yet</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-hdr">
      <div class="card-title">📋 Recent Sessions</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="navigate('all-sessions')">View All</button>
        <button class="btn btn-gold btn-sm" onclick="exportAllData()">⬇️ Export All</button>
      </div>
    </div>
    ${sessionsTable(S.sessions.slice(-8).reverse(), true)}
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// CAPTURE SESSION PAGE
// ─────────────────────────────────────────────────────────────
function capturePage() {
  const myMentees = S.mentees.filter(m => m.mentorId === S.currentUser.id);
  return `
  <div class="page-header green">
    <h1>✏️ Capture Session</h1>
    <p>Record session notes, academic progress and link supporting evidence.</p>
  </div>
  <div class="sync-bar">
    <div class="sync-dot" id="sync-dot"></div>
    <span id="sync-status">Not saved yet</span>
  </div>
  <div class="tabs">
    <button class="tab active" onclick="switchTab('t-details',this)">📋 Session Details</button>
    <button class="tab" onclick="switchTab('t-academic',this)">📚 Academic Progress</button>
    <button class="tab" onclick="switchTab('t-evidence',this)">📎 Evidence</button>
  </div>

  <!-- SESSION DETAILS -->
  <div id="t-details">
    <div class="card">
      <div class="card-title" style="margin-bottom:1rem">👤 Mentee & Session Info</div>
      <div class="fg">
        <div class="fgrp">
          <label>Mentee <span class="req">*</span></label>
          <select id="f-mentee" onchange="onMenteeChange()">
            <option value="">— Select Mentee —</option>
            ${myMentees.map(m=>`<option value="${m.id}" data-grade="${m.grade}" data-school="${m.school}" data-name="${m.name}">${m.name} (${m.grade})</option>`).join('')}
          </select>
        </div>
        <div class="fgrp">
          <label>Grade <span class="req">*</span></label>
          <select id="f-grade" onchange="onGradeChange()">
            <option value="">— Select Grade —</option>
            ${['Grade 9','Grade 10','Grade 11','Grade 12','Post Matric'].map(g=>`<option>${g}</option>`).join('')}
          </select>
        </div>
        <div class="fgrp">
          <label>School</label>
          <select id="f-school">
            <option value="">— Select School —</option>
            ${SCHOOLS.map(s=>`<option>${s}</option>`).join('')}
          </select>
        </div>
        <div class="fgrp">
          <label>Session Month <span class="req">*</span></label>
          <select id="f-month" onchange="showMonthTopic()">
            <option value="">— Select Month —</option>
            ${MONTHS.map(m=>`<option ${m===MONTHS[new Date().getMonth()]?'selected':''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="fgrp s2">
          <label>Session Type(s) <span class="req">*</span> <span style="font-weight:500;text-transform:none;font-size:11px;color:var(--light)">(select one or more)</span></label>
          <div class="chip-wrap" id="session-type-wrap">
            <div class="chip-select" id="type-chips" onclick="toggleTypeDropdown(event)">
              <div id="type-chips-inner" style="display:flex;flex-wrap:wrap;gap:6px;flex:1;align-items:center">
                <span style="color:var(--light);font-size:13px" id="type-placeholder">Click to select session type(s)…</span>
              </div>
            </div>
            <div class="chip-dropdown" id="type-dropdown">
              ${SESSION_TYPES.map(t=>`
              <div class="chip-option" id="opt-${t.replace(/[^a-z]/gi,'_')}" onclick="toggleSessionType('${t}',event)">
                <span class="co-check"></span>${t}
              </div>`).join('')}
            </div>
          </div>
        </div>
        <div class="fgrp">
          <label>Session Date</label>
          <input type="date" id="f-date">
        </div>
        <div class="fgrp">
          <label>Format</label>
          <select id="f-format">
            ${['In-Person','Video Call','Phone Call','WhatsApp','WhatsApp Group'].map(f=>`<option>${f}</option>`).join('')}
          </select>
        </div>
        <div class="fgrp">
          <label>Duration</label>
          <select id="f-duration">
            ${['30 minutes','45 minutes','60 minutes','75 minutes','90 minutes','2 hours'].map(d=>`<option>${d}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="month-topic-hint" style="display:none;margin-top:1rem"></div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:1rem">💬 Session Notes</div>
      <div class="fg">
        <div class="fgrp s2"><label>Check-In Notes</label><textarea id="f-checkin" placeholder="How was the mentee feeling? Any personal updates to note?"></textarea></div>
        <div class="fgrp s2"><label>School Update</label><textarea id="f-school-update" placeholder="Highlights and lowlights from school this month…"></textarea></div>
        <div class="fgrp s2"><label>Session Focus / Highlights</label><textarea id="f-focus" style="min-height:110px" placeholder="Key topics discussed, activities completed, moments of growth…"></textarea></div>
        <div class="fgrp"><label>Action Items</label><textarea id="f-actions" placeholder="Tasks for mentor and mentee before next session…"></textarea></div>
        <div class="fgrp"><label>Next Session Preview</label><textarea id="f-next" placeholder="What topic is next? What should the mentee prepare?"></textarea></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:1rem">⭐ Ratings & Wellbeing</div>
      <div class="fg">
        <div class="fgrp">
          <label>Mentee Engagement</label>
          <div class="stars" id="stars-eng" data-val="0">
            ${[1,2,3,4,5].map(i=>`<button class="star" onclick="setStar('stars-eng',${i})">★</button>`).join('')}
          </div>
        </div>
        <div class="fgrp">
          <label>Session Quality</label>
          <div class="stars" id="stars-qual" data-val="0">
            ${[1,2,3,4,5].map(i=>`<button class="star" onclick="setStar('stars-qual',${i})">★</button>`).join('')}
          </div>
        </div>
        <div class="fgrp s2">
          <label>Overall Wellbeing</label>
          <div class="wb-row">
            ${WELLBEING_OPTS.map(w=>`<button class="wb-btn" onclick="setWellbeing('${w.e} ${w.l}',this)">${w.e} ${w.l}</button>`).join('')}
          </div>
        </div>
        <div class="fgrp"><label>Short-Term Goal</label><textarea id="f-goal-short" placeholder="e.g. Improve Maths to 65% by end of Term 1"></textarea></div>
        <div class="fgrp"><label>Long-Term Goal</label><textarea id="f-goal-long" placeholder="e.g. Pass matric with Bachelor's pass to study Engineering"></textarea></div>
      </div>
    </div>
  </div>

  <!-- ACADEMIC TAB -->
  <div id="t-academic" style="display:none">
    <div class="card">
      <div class="card-title" style="margin-bottom:.5rem">📚 Subject Marks & Goals</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:1rem 0">
        <button class="btn btn-outline btn-sm" onclick="loadGradeSubjects()">🔄 Load Subjects for Grade</button>
        <button class="btn btn-ghost btn-sm" onclick="addSubjectRow()">➕ Add Subject</button>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Subject</th><th>2025 Final %</th><th>T1 Goal %</th><th>T1 Actual %</th><th>T2 Goal %</th><th>T2 Actual %</th><th></th></tr></thead>
          <tbody id="subj-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- EVIDENCE TAB -->
  <div id="t-evidence" style="display:none">
    <div class="card">
      <div class="card-title" style="margin-bottom:.8rem">📎 Session Evidence</div>
      <p style="font-size:13px;color:var(--light);margin-bottom:1rem">Upload files locally or paste a Google Drive folder link for evidence stored in the cloud.</p>
      <div class="upload-zone" id="drop-zone" onclick="document.getElementById('file-input').click()">
        <div style="font-size:38px;margin-bottom:8px">📁</div>
        <p><strong>Click to upload</strong> or drag & drop</p>
        <p style="font-size:12px;color:var(--light);margin-top:4px">Photos, PDFs, Word docs</p>
      </div>
      <input type="file" id="file-input" style="display:none" multiple accept="image/*,.pdf,.doc,.docx" onchange="handleFiles(event)">
      <div id="files-list" style="margin-top:10px"></div>
      <div class="divider"></div>
      <div class="fgrp">
        <label>🔗 Google Drive Folder Link</label>
        <input type="text" id="f-drive-link" placeholder="Paste Google Drive folder link here (e.g. https://drive.google.com/drive/folders/…)">
      </div>
      <div class="fgrp" style="margin-top:1rem">
        <label>📝 Evidence Description</label>
        <textarea id="f-evid-desc" placeholder="e.g. Photo of vision board, signed attendance register, screenshot of video call…"></textarea>
      </div>
    </div>
  </div>

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:.5rem">
    <button class="btn btn-primary" onclick="submitSession()">💾 Save Session</button>
    <button class="btn btn-gold" onclick="submitAndExport()">📥 Save & Export Excel</button>
    <button class="btn btn-ghost" onclick="navigate('capture')">🗑️ Clear</button>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// MULTI-SELECT SESSION TYPES
// ─────────────────────────────────────────────────────────────
function toggleTypeDropdown(e) {
  e.stopPropagation();
  document.getElementById('type-dropdown').classList.toggle('open');
}

function toggleSessionType(type, e) {
  e.stopPropagation();
  const idx = S.selectedSessionTypes.indexOf(type);
  if (idx >= 0) S.selectedSessionTypes.splice(idx, 1);
  else S.selectedSessionTypes.push(type);
  renderTypeChips();
}

function renderTypeChips() {
  const inner = document.getElementById('type-chips-inner');
  const placeholder = document.getElementById('type-placeholder');
  if (!inner) return;
  if (S.selectedSessionTypes.length === 0) {
    inner.innerHTML = '<span style="color:var(--light);font-size:13px" id="type-placeholder">Click to select session type(s)…</span>';
  } else {
    inner.innerHTML = S.selectedSessionTypes.map(t =>
      `<span class="chip">${t}<button class="chip-x" onclick="removeType('${t}',event)">×</button></span>`
    ).join('');
  }
  // Update dropdown checkboxes
  SESSION_TYPES.forEach(t => {
    const opt = document.getElementById('opt-' + t.replace(/[^a-z]/gi,'_'));
    if (opt) {
      const isSelected = S.selectedSessionTypes.includes(t);
      opt.classList.toggle('checked', isSelected);
      opt.querySelector('.co-check').textContent = isSelected ? '✓' : '';
    }
  });
}

function removeType(type, e) {
  e.stopPropagation();
  S.selectedSessionTypes = S.selectedSessionTypes.filter(t => t !== type);
  renderTypeChips();
}

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  const dd = document.getElementById('type-dropdown');
  if (dd && !dd.closest('.chip-wrap')?.contains(e.target)) dd.classList.remove('open');
});

// ─────────────────────────────────────────────────────────────
// CAPTURE HELPERS
// ─────────────────────────────────────────────────────────────
function initCapture() {
  S.selectedSessionTypes = [];
  S.selectedWellbeing = '';
  S.pendingFiles = [];
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  addSubjectRow(); addSubjectRow(); addSubjectRow();
  // Drag drop
  const dz = document.getElementById('drop-zone');
  if (dz) {
    dz.addEventListener('dragover', e=>{e.preventDefault();dz.classList.add('drag')});
    dz.addEventListener('dragleave', ()=>dz.classList.remove('drag'));
    dz.addEventListener('drop', e=>{e.preventDefault();dz.classList.remove('drag');handleFileList(e.dataTransfer.files)});
  }
}

function onMenteeChange() {
  const sel = document.getElementById('f-mentee');
  const opt = sel.options[sel.selectedIndex];
  if (opt.value) {
    document.getElementById('f-grade').value  = opt.getAttribute('data-grade')||'';
    document.getElementById('f-school').value = opt.getAttribute('data-school')||'';
    showMonthTopic();
  }
}

function onGradeChange() { showMonthTopic(); }

function showMonthTopic() {
  const grade = document.getElementById('f-grade')?.value;
  const month = document.getElementById('f-month')?.value;
  const hint  = document.getElementById('month-topic-hint');
  if (!hint) return;
  if (grade && month && MONTH_TOPICS[grade]) {
    const idx = MONTHS.indexOf(month);
    const topic = MONTH_TOPICS[grade][idx];
    if (topic && topic !== '—') {
      hint.innerHTML = `<span class="pill pill-gold" style="font-size:12px">📌 Recommended for ${grade} in ${month}: ${topic}</span>`;
      hint.style.display = 'block';
    } else hint.style.display = 'none';
  }
}

function switchTab(id, btn) {
  ['t-details','t-academic','t-evidence'].forEach(t=>{
    const el = document.getElementById(t);
    if(el) el.style.display = t===id ? 'block' : 'none';
  });
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function setStar(gid, val) {
  const g = document.getElementById(gid);
  if(!g) return;
  g.dataset.val = val;
  g.querySelectorAll('.star').forEach((s,i)=>s.classList.toggle('on',i<val));
}

function setWellbeing(val, btn) {
  S.selectedWellbeing = val;
  document.querySelectorAll('.wb-btn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
}

function addSubjectRow(name='') {
  const tbody = document.getElementById('subj-tbody');
  if(!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><input type="text" value="${name}" placeholder="Subject" style="min-width:120px"></td>
    <td><input type="number" min="0" max="100" placeholder="%" style="width:68px"></td>
    <td><input type="number" min="0" max="100" placeholder="%" style="width:68px"></td>
    <td><input type="number" min="0" max="100" placeholder="%" style="width:68px"></td>
    <td><input type="number" min="0" max="100" placeholder="%" style="width:68px"></td>
    <td><input type="number" min="0" max="100" placeholder="%" style="width:68px"></td>
    <td><button onclick="this.closest('tr').remove()" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:17px">✕</button></td>`;
  tbody.appendChild(tr);
}

function loadGradeSubjects() {
  const grade = document.getElementById('f-grade')?.value;
  if (!grade) { toast('Select a grade first'); return; }
  document.getElementById('subj-tbody').innerHTML = '';
  (GRADE_SUBJECTS[grade]||[]).forEach(s=>addSubjectRow(s));
}

function handleFiles(e) { handleFileList(e.target.files); e.target.value=''; }
function handleFileList(files) {
  Array.from(files).forEach(f=>{
    S.pendingFiles.push(f);
    const icon = f.type.startsWith('image/')? '🖼️': f.type==='application/pdf'? '📄':'📝';
    const el = document.createElement('div');
    el.className='file-chip'; el.id='fc-'+S.pendingFiles.length;
    el.innerHTML=`<span style="font-size:18px">${icon}</span><span class="fc-name">${f.name} <span style="color:var(--light)">(${(f.size/1024).toFixed(0)}KB)</span></span><button class="fc-rm" onclick="this.closest('.file-chip').remove()">✕</button>`;
    document.getElementById('files-list')?.appendChild(el);
  });
}

function getSubjectsData() {
  const rows = [];
  document.querySelectorAll('#subj-tbody tr').forEach(tr=>{
    const inp = tr.querySelectorAll('input');
    if(inp[0]?.value.trim()) rows.push({subject:inp[0].value.trim(),finalMark:inp[1]?.value||'',t1Goal:inp[2]?.value||'',t1Actual:inp[3]?.value||'',t2Goal:inp[4]?.value||'',t2Actual:inp[5]?.value||''});
  });
  return rows;
}

function setSyncStatus(state, msg) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-status');
  if(dot) { dot.className='sync-dot '+state; }
  if(txt) txt.textContent = msg;
}

// ─────────────────────────────────────────────────────────────
// SAVE SESSION
// ─────────────────────────────────────────────────────────────
function submitSession() {
  const menteeEl = document.getElementById('f-mentee');
  const menteeId = menteeEl?.value;
  const grade    = document.getElementById('f-grade')?.value;
  const month    = document.getElementById('f-month')?.value;

  if (!menteeId || !grade || !month || S.selectedSessionTypes.length === 0) {
    toast('⚠️ Please fill in Mentee, Grade, Month and at least one Session Type'); return null;
  }

  const opt = menteeEl.options[menteeEl.selectedIndex];
  const menteeName = opt.getAttribute('data-name') || '';

  const session = {
    id: 's' + Date.now(),
    menteeId,
    menteeName,
    mentorId:   S.currentUser.id,
    mentorName: S.currentUser.name,
    grade,
    school:          document.getElementById('f-school')?.value||'',
    month,
    sessionTypes:    S.selectedSessionTypes.join(', '),
    date:            document.getElementById('f-date')?.value||'',
    format:          document.getElementById('f-format')?.value||'',
    duration:        document.getElementById('f-duration')?.value||'',
    checkinNotes:    document.getElementById('f-checkin')?.value||'',
    schoolUpdate:    document.getElementById('f-school-update')?.value||'',
    focusNotes:      document.getElementById('f-focus')?.value||'',
    actionItems:     document.getElementById('f-actions')?.value||'',
    nextSession:     document.getElementById('f-next')?.value||'',
    wellbeing:       S.selectedWellbeing,
    engagementRating:document.getElementById('stars-eng')?.dataset.val||'0',
    qualityRating:   document.getElementById('stars-qual')?.dataset.val||'0',
    goalShort:       document.getElementById('f-goal-short')?.value||'',
    goalLong:        document.getElementById('f-goal-long')?.value||'',
    evidenceFolderUrl:document.getElementById('f-drive-link')?.value||'',
    evidenceDesc:    document.getElementById('f-evid-desc')?.value||'',
    subjects:        JSON.stringify(getSubjectsData()),
  };

  S.sessions.push(session);
  persistState();
  setSyncStatus('ok','Saved ✓');
  toast('✅ Session saved!');

  // If Google Sheets connected, also push there
  if (CONFIG.apiUrl !== 'DEMO') pushToSheets(session);

  return session;
}

function submitAndExport() {
  const s = submitSession();
  if (s) exportSessionExcel(s);
}

async function pushToSheets(session) {
  try {
    await fetch(CONFIG.apiUrl, {
      method:'POST',
      body: JSON.stringify({ action:'addSession', data: session }),
    });
  } catch(e) { console.warn('Sheets sync failed:', e); }
}

// ─────────────────────────────────────────────────────────────
// MY MENTEES PAGE
// ─────────────────────────────────────────────────────────────
function myMenteesPage() {
  const myMentees = S.mentees.filter(m => m.mentorId === S.currentUser.id);
  return `
  <div class="page-header green">
    <h1>👥 My Mentees</h1>
    <p>Manage your mentee portfolio for the ${CONFIG.year} programme year.</p>
  </div>
  <div class="card">
    <div class="card-title" style="margin-bottom:1rem">➕ Add New Mentee</div>
    <div class="fg">
      <div class="fgrp"><label>Full Name <span class="req">*</span></label><input type="text" id="nm-name" placeholder="e.g. Thembi Nkosi"></div>
      <div class="fgrp"><label>Grade <span class="req">*</span></label>
        <select id="nm-grade"><option value="">— Select Grade —</option>${['Grade 9','Grade 10','Grade 11','Grade 12','Post Matric'].map(g=>`<option>${g}</option>`).join('')}</select>
      </div>
      <div class="fgrp"><label>School</label>
        <select id="nm-school"><option value="">— Select School —</option>${SCHOOLS.map(s=>`<option>${s}</option>`).join('')}</select>
      </div>
      <div class="fgrp"><label>Gender</label>
        <select id="nm-gender">${['Female','Male','Non-binary','Prefer not to say'].map(g=>`<option>${g}</option>`).join('')}</select>
      </div>
    </div>
    <button class="btn btn-primary" style="margin-top:1rem" onclick="addMentee()">➕ Add Mentee</button>
  </div>
  <div class="card">
    <div class="card-hdr">
      <div class="card-title">📋 My Mentees (${myMentees.length})</div>
    </div>
    ${myMentees.length ? `<div class="tbl-wrap"><table>
      <thead><tr><th>Name</th><th>Grade</th><th>School</th><th>Gender</th><th>Sessions</th><th>Actions</th></tr></thead>
      <tbody>${myMentees.map(m=>{
        const cnt = S.sessions.filter(s=>s.menteeId===m.id).length;
        return `<tr>
          <td><div class="av-row"><div class="av sm">${initials(m.name)}</div><strong>${m.name}</strong></div></td>
          <td><span class="badge bg">${m.grade}</span></td>
          <td>${m.school||'—'}</td><td>${m.gender||'—'}</td>
          <td><span class="badge bo">${cnt} session${cnt!==1?'s':''}</span></td>
          <td style="display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" onclick="captureFor('${m.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="removeMentee('${m.id}')">✕</button>
          </td></tr>`;
      }).join('')}</tbody>
    </table></div>` : `<div class="empty"><div class="ei">👥</div><h3>No mentees yet</h3><p>Add your first mentee above.</p></div>`}
  </div>`;
}

function addMentee() {
  const name  = document.getElementById('nm-name')?.value.trim();
  const grade = document.getElementById('nm-grade')?.value;
  if (!name || !grade) { toast('⚠️ Name and Grade are required'); return; }
  if (S.mentees.find(m=>m.name===name&&m.mentorId===S.currentUser.id)) { toast('⚠️ Mentee already exists'); return; }
  S.mentees.push({ id:'m'+Date.now(), name, grade, school:document.getElementById('nm-school')?.value||'', gender:document.getElementById('nm-gender')?.value||'', mentorId:S.currentUser.id, mentorName:S.currentUser.name });
  persistState();
  toast(`✅ ${name} added!`);
  navigate('my-mentees');
}

function removeMentee(id) {
  const m = S.mentees.find(x=>x.id===id);
  if (!confirm(`Remove ${m?.name||'this mentee'} from your list?`)) return;
  S.mentees = S.mentees.filter(x=>x.id!==id);
  persistState();
  toast('🗑️ Mentee removed');
  navigate('my-mentees');
}

function captureFor(menteeId) {
  navigate('capture');
  setTimeout(()=>{ const sel = document.getElementById('f-mentee'); if(sel){sel.value=menteeId;onMenteeChange();} },80);
}

// ─────────────────────────────────────────────────────────────
// SESSIONS TABLES
// ─────────────────────────────────────────────────────────────
function sessionsTable(sessions, showMentor=false) {
  if (!sessions.length) return `<div class="empty"><div class="ei">📋</div><h3>No sessions yet</h3><p>Capture a session to see it here.</p></div>`;
  return `<div class="tbl-wrap"><table>
    <thead><tr><th>Mentee</th>${showMentor?'<th>Mentor</th>':''}<th>Grade</th><th>Month</th><th>Session Type(s)</th><th>Wellbeing</th><th>Date</th></tr></thead>
    <tbody>${sessions.map(s=>`<tr>
      <td><strong>${s.menteeName||'—'}</strong></td>
      ${showMentor?`<td>${s.mentorName||'—'}</td>`:''}
      <td><span class="badge bg">${s.grade||'—'}</span></td>
      <td>${s.month||'—'}</td>
      <td style="max-width:220px">${(s.sessionTypes||'—').split(',').map(t=>`<span class="badge bo" style="margin:1px 2px">${t.trim()}</span>`).join('')}</td>
      <td>${s.wellbeing||'—'}</td>
      <td>${s.date||'—'}</td>
    </tr>`).join('')}
    </tbody></table></div>`;
}

function mySessionsPage() {
  const sessions = S.sessions.filter(s=>s.mentorId===S.currentUser.id).reverse();
  return `<div class="page-header green"><h1>📋 My Sessions</h1><p>All your captured sessions for ${CONFIG.year}.</p></div>
  <div class="card">
    <div class="card-hdr"><div class="card-title">📋 ${sessions.length} Sessions</div><button class="btn btn-gold btn-sm" onclick="exportMyData()">⬇️ Export</button></div>
    ${sessionsTable(sessions,false)}
  </div>`;
}

function allSessionsPage() {
  return `<div class="page-header gold"><h1>📋 All Sessions</h1><p>Every session captured across the programme.</p></div>
  <div class="card">
    <div class="fg" style="max-width:600px;margin-bottom:1.2rem">
      <div class="fgrp"><label>Filter by Grade</label>
        <select id="fg-grade" onchange="filterSessions()"><option value="">All Grades</option>${['Grade 9','Grade 10','Grade 11','Grade 12','Post Matric'].map(g=>`<option>${g}</option>`).join('')}</select>
      </div>
      <div class="fgrp"><label>Filter by Month</label>
        <select id="fg-month" onchange="filterSessions()"><option value="">All Months</option>${MONTHS.map(m=>`<option>${m}</option>`).join('')}</select>
      </div>
    </div>
    <div id="filtered-sessions">${sessionsTable(S.sessions.slice().reverse(),true)}</div>
  </div>`;
}

function initFilters() {}

function filterSessions() {
  const grade = document.getElementById('fg-grade')?.value;
  const month = document.getElementById('fg-month')?.value;
  let filtered = S.sessions.slice().reverse();
  if (grade) filtered = filtered.filter(s=>s.grade===grade);
  if (month) filtered = filtered.filter(s=>s.month===month);
  const el = document.getElementById('filtered-sessions');
  if(el) el.innerHTML = sessionsTable(filtered, true);
}

function allMenteesPage() {
  return `<div class="page-header gold"><h1>👥 All Mentees</h1><p>Every mentee registered across all mentors.</p></div>
  <div class="card">
    <div class="card-hdr"><div class="card-title">All Mentees (${S.mentees.length})</div><button class="btn btn-gold btn-sm" onclick="exportAllData()">⬇️ Export</button></div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Name</th><th>Grade</th><th>School</th><th>Mentor</th><th>Sessions</th></tr></thead>
      <tbody>${S.mentees.length?S.mentees.map(m=>{
        const cnt=S.sessions.filter(s=>s.menteeId===m.id).length;
        const mentor=S.users.find(u=>u.id===m.mentorId);
        return `<tr><td><div class="av-row"><div class="av sm">${initials(m.name)}</div><strong>${m.name}</strong></div></td>
          <td><span class="badge bg">${m.grade}</span></td><td>${m.school||'—'}</td>
          <td>${mentor?.name||'—'}</td><td><span class="badge bo">${cnt}</span></td></tr>`;
      }).join(''):'<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--light)">No mentees yet</td></tr>'}
      </tbody>
    </table></div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// PROGRESS PAGE
// ─────────────────────────────────────────────────────────────
function progressPage() {
  const isAdmin = S.currentUser.role === 'admin';
  return `
  <div class="page-header green"><h1>📈 Progress Tracker</h1><p>${isAdmin?'Programme-wide progress across all mentors.':'Your mentees\' progress through the 2026 programme.'}</p></div>
  <div class="card" style="margin-bottom:1rem">
    <div class="fg" style="max-width:520px">
      <div class="fgrp"><label>Mentee</label>
        <select id="pf-mentee" onchange="renderProgress()"><option value="">All Mentees</option>
          ${(isAdmin?S.mentees:S.mentees.filter(m=>m.mentorId===S.currentUser.id)).map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}
        </select>
      </div>
      <div class="fgrp"><label>Grade</label>
        <select id="pf-grade" onchange="renderProgress()"><option value="">All Grades</option>${['Grade 9','Grade 10','Grade 11','Grade 12','Post Matric'].map(g=>`<option>${g}</option>`).join('')}</select>
      </div>
    </div>
  </div>
  <div id="progress-content"></div>`;
}

function renderProgress() {
  const isAdmin = S.currentUser.role==='admin';
  const fm = document.getElementById('pf-mentee')?.value;
  const fg = document.getElementById('pf-grade')?.value;
  let mentees = isAdmin ? S.mentees : S.mentees.filter(m=>m.mentorId===S.currentUser.id);
  if (fm) mentees = mentees.filter(m=>m.id===fm);
  if (fg) mentees = mentees.filter(m=>m.grade===fg);
  const el = document.getElementById('progress-content');
  if (!el) return;
  if (!mentees.length) { el.innerHTML=`<div class="empty"><div class="ei">📈</div><h3>No mentees match</h3></div>`; return; }
  el.innerHTML = mentees.map(mentee=>{
    const msessions = S.sessions.filter(s=>s.menteeId===mentee.id);
    const pct = Math.round(msessions.length/12*100);
    const mentor = S.users.find(u=>u.id===mentee.mentorId);
    return `<div class="card">
      <div class="card-hdr">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div class="av">${initials(mentee.name)}</div>
          <div><div style="font-weight:900;font-size:16px">${mentee.name}</div>
          <div style="font-size:12px;color:var(--light)">${mentee.grade} · ${mentee.school||''}${isAdmin?` · Mentor: ${mentor?.name||'—'}`:''}</div></div>
          <span class="badge bg">${msessions.length}/12 sessions</span>
          <span class="badge ${pct>=75?'bt':pct>=50?'bo':'bgr'}">${pct}%</span>
        </div>
        <button class="btn btn-outline btn-sm" onclick="captureFor('${mentee.id}')">✏️ Add Session</button>
      </div>
      <div class="prog-wrap" style="margin-bottom:1.2rem"><div class="prog-fill ${pct>=75?'':'gold'}" style="width:${pct}%"></div></div>
      <div class="months-grid" style="margin-bottom:1.2rem">
        ${MONTHS.map((m,i)=>{
          const s=msessions.find(x=>x.month===m);
          const topic=MONTH_TOPICS[mentee.grade]?MONTH_TOPICS[mentee.grade][i]:'';
          return `<div class="m-tile ${s?'done':''} ${m===MONTHS[new Date().getMonth()]&&!s?'curr':''}">
            <div class="mn" style="font-size:12px">${m.substring(0,3)}</div>
            ${topic&&topic!=='—'?`<div class="mt">${topic}</div>`:''}
            <div class="mb">${s?`<span class="badge bg" title="${s.sessionTypes||''}">✓</span>`:`<span class="badge bgr">—</span>`}</div>
          </div>`;
        }).join('')}
      </div>
      ${msessions.length?`<details><summary style="cursor:pointer;font-weight:800;color:var(--green-dark);font-size:13px;padding:6px 0">Show session details ▾</summary><div style="margin-top:8px">${sessionsTable(msessions,isAdmin)}</div></details>`:''}
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// ADMIN PANEL
// ─────────────────────────────────────────────────────────────
function adminPanel() {
  return `
  <div class="page-header gold"><h1>⚙️ Admin Panel</h1><p>Manage mentors, change PINs and control access roles.</p></div>
  <div class="card">
    <div class="card-hdr">
      <div class="card-title">👤 Add New User</div>
    </div>
    <div class="fg" style="max-width:700px">
      <div class="fgrp"><label>Full Name <span class="req">*</span></label><input type="text" id="nu-name" placeholder="e.g. Thandi Mokoena"></div>
      <div class="fgrp"><label>Role <span class="req">*</span></label>
        <select id="nu-role"><option value="mentor">🌱 Mentor</option><option value="admin">👑 Coordinator</option></select>
      </div>
      <div class="fgrp"><label>PIN <span class="req">*</span> <span style="font-weight:500;text-transform:none">(4–6 digits)</span></label>
        <input type="password" id="nu-pin" placeholder="e.g. 1234" maxlength="6" inputmode="numeric" style="letter-spacing:4px">
      </div>
      <div class="fgrp"><label>Confirm PIN</label>
        <input type="password" id="nu-pin2" placeholder="Repeat PIN" maxlength="6" inputmode="numeric" style="letter-spacing:4px">
      </div>
    </div>
    <button class="btn btn-primary" style="margin-top:1rem" onclick="addUser()">➕ Add User</button>
  </div>

  <div class="card">
    <div class="card-title" style="margin-bottom:1rem">🔑 Manage Users & Change PINs</div>
    ${S.users.map(u=>`
    <div class="pin-row">
      <div class="av sm" style="margin-right:4px">${initials(u.name)}</div>
      <div class="pin-row-name">${u.name}${u.id===S.currentUser.id?' <span style="font-size:11px;color:var(--light)">(you)</span>':''}</div>
      <span class="badge ${u.role==='admin'?'bo':'bg'}" style="margin-right:12px;cursor:pointer" onclick="toggleRole('${u.id}')">${u.role==='admin'?'👑 Coordinator':'🌱 Mentor'}</span>
      <input type="password" class="pin-input-sm" id="pin-change-${u.id}" placeholder="New PIN" maxlength="6" inputmode="numeric">
      <button class="btn btn-outline btn-sm" onclick="changePIN('${u.id}')">Update PIN</button>
      ${u.id!==S.currentUser.id?`<button class="btn btn-danger btn-sm" onclick="removeUser('${u.id}')">✕</button>`:''}
    </div>`).join('')}
  </div>

  <div class="card">
    <div class="card-title" style="margin-bottom:.8rem">⚙️ Connect Google Sheets (Optional)</div>
    <p style="font-size:13px;color:var(--light);margin-bottom:1rem">When connected, all sessions are synced to a shared Google Sheet — accessible by all mentors and coordinators from any device. Without this, data is stored per-browser.</p>
    <div class="fgrp" style="max-width:600px">
      <label>Google Apps Script URL</label>
      <input type="text" id="sheets-url" value="${CONFIG.apiUrl==='DEMO'?'':CONFIG.apiUrl}" placeholder="https://script.google.com/macros/s/…/exec">
    </div>
    <button class="btn btn-primary" style="margin-top:.8rem" onclick="saveApiUrl()">💾 Save & Connect</button>
    <p style="font-size:12px;color:var(--light);margin-top:.6rem">See the Setup Guide for how to create this URL for free.</p>
  </div>

  <div class="card">
    <div class="card-title" style="margin-bottom:.8rem">💾 Data Management</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-gold" onclick="exportAllData()">⬇️ Export All Data</button>
      <button class="btn btn-ghost" onclick="backupData()">📦 Download Backup</button>
      <button class="btn btn-danger" onclick="clearAllData()">🗑️ Clear All Data</button>
    </div>
  </div>`;
}

function addUser() {
  const name = document.getElementById('nu-name')?.value.trim();
  const role = document.getElementById('nu-role')?.value;
  const pin  = document.getElementById('nu-pin')?.value;
  const pin2 = document.getElementById('nu-pin2')?.value;
  if (!name || !pin) { toast('⚠️ Name and PIN are required'); return; }
  if (pin !== pin2) { toast('⚠️ PINs do not match'); return; }
  if (pin.length < 4) { toast('⚠️ PIN must be at least 4 digits'); return; }
  if (S.users.find(u=>u.name===name)) { toast('⚠️ User already exists'); return; }
  S.users.push({ id:'u'+Date.now(), name, role, pin });
  persistState();
  toast(`✅ ${name} added as ${role}`);
  navigate('admin-panel');
}

function changePIN(userId) {
  const newPin = document.getElementById('pin-change-'+userId)?.value.trim();
  if (!newPin || newPin.length < 4) { toast('⚠️ PIN must be at least 4 digits'); return; }
  const user = S.users.find(u=>u.id===userId);
  if (!user) return;
  user.pin = newPin;
  persistState();
  toast(`✅ PIN updated for ${user.name}`);
  document.getElementById('pin-change-'+userId).value = '';
}

function toggleRole(userId) {
  if (userId === S.currentUser.id) { toast('⚠️ You cannot change your own role'); return; }
  const user = S.users.find(u=>u.id===userId);
  if (!user) return;
  user.role = user.role==='admin' ? 'mentor' : 'admin';
  persistState();
  toast(`✅ ${user.name} is now ${user.role}`);
  navigate('admin-panel');
}

function removeUser(userId) {
  const user = S.users.find(u=>u.id===userId);
  if (!confirm(`Remove ${user?.name}? Their mentees and sessions remain.`)) return;
  S.users = S.users.filter(u=>u.id!==userId);
  persistState();
  toast('🗑️ User removed');
  navigate('admin-panel');
}

function saveApiUrl() {
  const url = document.getElementById('sheets-url')?.value.trim();
  CONFIG.apiUrl = url || 'DEMO';
  try { localStorage.setItem('lgm_api_url', url); } catch {}
  toast(url ? '✅ Google Sheets connected!' : '⚡ Running in demo mode');
}

function clearAllData() {
  if (!confirm('⚠️ This will delete ALL sessions and mentees. Users and PINs are kept. Continue?')) return;
  S.sessions = []; S.mentees = [];
  persistState();
  toast('🗑️ Sessions and mentees cleared');
  navigate('dashboard');
}

function backupData() {
  const data = JSON.stringify({ users: S.users.map(u=>({...u,pin:'[hidden]'})), mentees: S.mentees, sessions: S.sessions }, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `LGM_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  toast('📦 Backup downloaded!');
}

// ─────────────────────────────────────────────────────────────
// EXCEL EXPORTS
// ─────────────────────────────────────────────────────────────
function exportSessionExcel(s) {
  let subjects = [];
  try { subjects = JSON.parse(s.subjects||'[]'); } catch {}
  const wb = XLSX.utils.book_new();
  const rows = [
    ['LOVE AND GROW MENTORSHIP — SESSION PORTFOLIO 2026',''],['',''],
    ['Mentee Name',s.menteeName],['Grade',s.grade],['School',s.school],
    ['Mentor',s.mentorName],['Month',s.month],['Session Type(s)',s.sessionTypes],
    ['Date',s.date],['Format',s.format],['Duration',s.duration],['',''],
    ['CHECK-IN NOTES',s.checkinNotes],['SCHOOL UPDATE',s.schoolUpdate],
    ['FOCUS NOTES',s.focusNotes],['ACTION ITEMS',s.actionItems],
    ['NEXT SESSION',s.nextSession],['',''],
    ['ENGAGEMENT',`${'★'.repeat(parseInt(s.engagementRating||0))}`],
    ['QUALITY',`${'★'.repeat(parseInt(s.qualityRating||0))}`],
    ['WELLBEING',s.wellbeing],['',''],
    ['SHORT-TERM GOAL',s.goalShort],['LONG-TERM GOAL',s.goalLong],
    ['EVIDENCE LINK',s.evidenceFolderUrl],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:26},{wch:65}];
  XLSX.utils.book_append_sheet(wb, ws, 'Session Notes');
  if (subjects.length) {
    const sr = [['Subject','2025 Final %','T1 Goal','T1 Actual','T2 Goal','T2 Actual'],
      ...subjects.map(x=>[x.subject,x.finalMark,x.t1Goal,x.t1Actual,x.t2Goal,x.t2Actual])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sr), 'Academic');
  }
  XLSX.writeFile(wb, `LGM_${s.menteeName||'Session'}_${s.month}_2026.xlsx`);
  toast('📥 Excel downloaded!');
}

function exportMyData() {
  const sessions = S.sessions.filter(s=>s.mentorId===S.currentUser.id);
  if (!sessions.length) { toast('No sessions to export'); return; }
  buildExport(sessions, `LGM_${S.currentUser.name.replace(' ','_')}_Portfolio_2026.xlsx`);
}

function exportAllData() {
  if (!S.sessions.length) { toast('No sessions to export'); return; }
  buildExport(S.sessions, 'LGM_AllMentors_Portfolio_2026.xlsx');
}

function buildExport(sessions, filename) {
  const wb = XLSX.utils.book_new();
  const h = ['Mentee','Grade','School','Mentor','Month','Session Type(s)','Date','Format','Duration','Wellbeing','Engagement','Quality','Check-In Notes','School Update','Focus Notes','Action Items','Next Session','Short Goal','Long Goal','Evidence Link'];
  const rows = [h, ...sessions.map(s=>[s.menteeName,s.grade,s.school,s.mentorName,s.month,s.sessionTypes,s.date,s.format,s.duration,s.wellbeing,s.engagementRating,s.qualityRating,s.checkinNotes,s.schoolUpdate,s.focusNotes,s.actionItems,s.nextSession,s.goalShort,s.goalLong,s.evidenceFolderUrl])];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = h.map(()=>({wch:22}));
  XLSX.utils.book_append_sheet(wb, ws, 'Sessions');
  const mh = ['Name','Grade','School','Gender','Mentor','Sessions'];
  const mr = [mh, ...S.mentees.map(m=>{
    const cnt=S.sessions.filter(s=>s.menteeId===m.id).length;
    const mentor=S.users.find(u=>u.id===m.mentorId);
    return [m.name,m.grade,m.school,m.gender,mentor?.name||'',cnt];
  })];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mr), 'Mentees');
  XLSX.writeFile(wb, filename);
  toast('📥 Export downloaded!');
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function initials(name) {
  return (name||'?').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
}

function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3500);
}

// Load saved API URL
try {
  const savedUrl = localStorage.getItem('lgm_api_url');
  if (savedUrl) CONFIG.apiUrl = savedUrl;
} catch {}
