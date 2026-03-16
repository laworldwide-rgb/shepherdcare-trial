// ============================================================
//  ShepherdCare · Trial Demo Version
//  ─────────────────────────────────
//  ✅ No backend required — all data is in-memory
//  ✅ One-click demo login (try any role!)
//  ✅ Fully interactive — add notes, tasks, members, etc.
//  ✅ "Your Church" placeholder branding
//  ✅ Demo banner throughout
//
//  To use: drop this file into a React project as App.jsx
//  No .env or supabase.js needed.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Permissions ──────────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  'Senior Pastor': { canViewAllMembers:true,  canEditMembers:true,  canDeleteMembers:true,  canAddNotes:true,  canViewAllPrivate:true,  canManageTeam:true,  canViewReports:true  },
  'Co-Pastor':     { canViewAllMembers:true,  canEditMembers:true,  canDeleteMembers:false, canAddNotes:true,  canViewAllPrivate:true,  canManageTeam:false, canViewReports:true  },
  'Care Pastor':   { canViewAllMembers:true,  canEditMembers:true,  canDeleteMembers:false, canAddNotes:true,  canViewAllPrivate:false, canManageTeam:false, canViewReports:true  },
  'Elder':         { canViewAllMembers:false, canEditMembers:false, canDeleteMembers:false, canAddNotes:true,  canViewAllPrivate:false, canManageTeam:false, canViewReports:false },
  'Volunteer':     { canViewAllMembers:false, canEditMembers:false, canDeleteMembers:false, canAddNotes:true,  canViewAllPrivate:false, canManageTeam:false, canViewReports:false },
  'Youth Minister':{ canViewAllMembers:false, canEditMembers:true,  canDeleteMembers:false, canAddNotes:true,  canViewAllPrivate:false, canManageTeam:false, canViewReports:false },
};

// ─── Constants ────────────────────────────────────────────────────────────────
const NOTE_ICONS  = { visit:'🏠', hospital:'🏥', call:'📞', text:'💬', meeting:'🤝', prayer:'🙏', email:'✉️' };
const STATUS_CFG  = {
  active:       { label:'Active',     color:'#10b981' },
  'needs-care': { label:'Needs Care', color:'#f59e0b' },
  critical:     { label:'Critical',   color:'#ef4444' },
};
const PRI_COLOR  = { urgent:'#ef4444', high:'#f59e0b', medium:'#6366f1', low:'#94a3b8' };
const ROLE_COLOR = { 'Senior Pastor':'#6366f1','Co-Pastor':'#3b82f6','Care Pastor':'#10b981','Elder':'#f59e0b','Volunteer':'#94a3b8','Youth Minister':'#ec4899' };
const ALL_ROLES  = ['Senior Pastor','Co-Pastor','Care Pastor','Elder','Volunteer','Youth Minister'];
const ALL_GROUPS = ['General','Seniors','Youth','Young Adults','Bereaved','Hospital Watch','New Members','Homebound'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt      = d => d ? new Date(d).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' }) : '—';
const fmtMD = d => {
  if (!d) return '—';
  const parts = d.split('-');
  const mo = parts.length === 3 ? parseInt(parts[1]) : parseInt(parts[0]);
  const dy = parts.length === 3 ? parseInt(parts[2]) : parseInt(parts[1]);
  return new Date(2000, mo-1, dy).toLocaleDateString('en-US',{ month:'short', day:'numeric' });
};
const fmtShort = d => d ? new Date(d).toLocaleDateString('en-US',{ month:'short', day:'numeric' }) : '';
const fmtTime  = d => d ? new Date(d).toLocaleTimeString('en-US',{ hour:'numeric', minute:'2-digit' }) : '';
const uid      = () => Math.random().toString(36).slice(2,10);
const daysUntil = d => {
  if (!d) return 999;
  const now = new Date();
  const [,mo,dy] = d.split('-');
  const next = new Date(now.getFullYear(), +mo-1, +dy);
  if (next < now) next.setFullYear(now.getFullYear()+1);
  return Math.ceil((next - now)/86400000);
};

// ─── Mock Team ────────────────────────────────────────────────────────────────
const MOCK_TEAM = [
  { id:'t1', authId:'a1', name:'Pastor David Mercer',   email:'david@yourchurch.org',   phone:'555-0101', role:'Senior Pastor',  avatar:'DM', color:'#6366f1', status:'active', joinedDate:'2018-01-01' },
  { id:'t2', authId:'a2', name:'Pastor Grace Okonkwo',  email:'grace@yourchurch.org',   phone:'555-0102', role:'Co-Pastor',      avatar:'GO', color:'#3b82f6', status:'active', joinedDate:'2019-03-15' },
  { id:'t3', authId:'a3', name:'Elder Ruth Santana',    email:'ruth@yourchurch.org',    phone:'555-0103', role:'Care Pastor',    avatar:'RS', color:'#10b981', status:'active', joinedDate:'2020-06-01' },
  { id:'t4', authId:'a4', name:'Elder James Whitfield', email:'james@yourchurch.org',   phone:'555-0104', role:'Elder',          avatar:'JW', color:'#f59e0b', status:'active', joinedDate:'2021-01-20' },
  { id:'t5', authId:'a5', name:'Marcus Webb',           email:'marcus@yourchurch.org',  phone:'555-0105', role:'Youth Minister', avatar:'MW', color:'#ec4899', status:'active', joinedDate:'2022-09-01' },
  { id:'t6', authId:'a6', name:'Sandra Kim',            email:'sandra@yourchurch.org',  phone:'555-0106', role:'Volunteer',      avatar:'SK', color:'#94a3b8', status:'active', joinedDate:'2023-01-01' },
];

// ─── Mock Members ─────────────────────────────────────────────────────────────
const now = new Date();
const ago = (days) => new Date(now - days*86400000).toISOString();
const thisYear = now.getFullYear();

const MOCK_MEMBERS = [
  { id:'m1',  name:'Margaret & Harold Thompson', phone:'555-1001', email:'margaret.thompson@email.com', address:'142 Maple Ave',       birthday:`${thisYear-1}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()+4).padStart(2,'0')}`, anniversary:'1998-06-12', status:'active',      assignedTo:'t1', groups:['General','Seniors'],       gender:'Female', maritalStatus:'married', spouseName:'Harold Thompson', spouseId:null, hasChildren:true,  children:[{id:1,name:'Carol Thompson',birthday:'1985-03-10'},{id:2,name:'Robert Thompson',birthday:'1988-07-22'}], memberType:'member' },
  { id:'m2',  name:'Kevin Osei',                 phone:'555-1002', email:'kevin.osei@email.com',        address:'88 Birchwood Dr',     birthday:`${thisYear-1}-03-22`, anniversary:'',           status:'active',      assignedTo:'t2', groups:['Young Adults','New Members'], gender:'Male',   maritalStatus:'single',  spouseName:'',                spouseId:null, hasChildren:false, children:[], memberType:'member' },
  { id:'m3',  name:'Dolores Vasquez',            phone:'555-1003', email:'d.vasquez@email.com',         address:'301 Oak Street',      birthday:`${thisYear-1}-07-04`, anniversary:'',           status:'needs-care',  assignedTo:'t3', groups:['Seniors','Homebound'],       gender:'Female', maritalStatus:'widowed', spouseName:'',                spouseId:null, hasChildren:true,  children:[{id:1,name:'Elena Vasquez',birthday:'1980-11-05'}], memberType:'member' },
  { id:'m4',  name:'Tyler & Brianna Jackson',    phone:'555-1004', email:'tyler.jackson@email.com',     address:'55 Sycamore Blvd',    birthday:`${thisYear-1}-11-30`, anniversary:`${thisYear-1}-08-14`, status:'active', assignedTo:'t1', groups:['General','Young Adults'],   gender:'Male',   maritalStatus:'married', spouseName:'Brianna Jackson', spouseId:null, hasChildren:true,  children:[{id:1,name:'Ava Jackson',birthday:'2019-05-02'},{id:2,name:'Liam Jackson',birthday:'2021-09-18'}], memberType:'member' },
  { id:'m5',  name:'Pastor Elijah Monroe',       phone:'555-1005', email:'elijah.monroe@email.com',     address:'19 Cedar Lane',       birthday:`${thisYear-1}-${String(now.getMonth()+1).padStart(2,'0')}-${String(Math.min(now.getDate()+1,28)).padStart(2,'0')}`, anniversary:'2005-09-03', status:'active', assignedTo:'t2', groups:['General'],                  gender:'Male',   maritalStatus:'married', spouseName:'Patricia Monroe', spouseId:null, hasChildren:true,  children:[{id:1,name:'Isaiah Monroe',birthday:'2008-02-14'}], memberType:'member' },
  { id:'m6',  name:'Helen Carmichael',           phone:'555-1006', email:'helen.c@email.com',           address:'77 Elm Court',        birthday:`${thisYear-1}-02-28`, anniversary:'',           status:'critical',    assignedTo:'t3', groups:['Seniors','Hospital Watch'],  gender:'Female', maritalStatus:'widowed', spouseName:'',                spouseId:null, hasChildren:false, children:[], memberType:'member' },
  { id:'m7',  name:'DeShawn & Alicia Williams',  phone:'555-1007', email:'deshawn.w@email.com',         address:'200 Pinecrest Rd',    birthday:`${thisYear-1}-09-15`, anniversary:'2015-05-22', status:'active',      assignedTo:'t4', groups:['General','Bereaved'],        gender:'Male',   maritalStatus:'married', spouseName:'Alicia Williams', spouseId:null, hasChildren:true,  children:[{id:1,name:'Jordan Williams',birthday:'2012-06-30'}], memberType:'member' },
  { id:'m8',  name:'Zoe Nakamura',               phone:'555-1008', email:'zoe.naka@email.com',          address:'14 Willow Way',       birthday:`${thisYear-1}-06-21`, anniversary:'',           status:'active',      assignedTo:'t5', groups:['Youth'],                    gender:'Female', maritalStatus:'single',  spouseName:'',                spouseId:null, hasChildren:false, children:[], memberType:'member' },
  { id:'m9',  name:'Frank & Dorothy Bellamy',    phone:'555-1009', email:'frank.bellamy@email.com',     address:'600 Rosewood Ave',    birthday:`${thisYear-1}-12-05`, anniversary:'1979-11-02', status:'needs-care',  assignedTo:'t3', groups:['Seniors','Homebound'],       gender:'Male',   maritalStatus:'married', spouseName:'Dorothy Bellamy', spouseId:null, hasChildren:true,  children:[{id:1,name:'Greg Bellamy',birthday:'1975-03-18'},{id:2,name:'Sandra Bellamy',birthday:'1977-08-25'}], memberType:'member' },
  { id:'m10', name:'Priya Sharma',               phone:'555-1010', email:'priya.sharma@email.com',      address:'33 Magnolia St',      birthday:`${thisYear-1}-04-17`, anniversary:'',           status:'active',      assignedTo:'t2', groups:['Young Adults','New Members'], gender:'Female', maritalStatus:'single',  spouseName:'',                spouseId:null, hasChildren:false, children:[], memberType:'member' },
  { id:'m11', name:'Carl Hutchins',              phone:'555-1011', email:'carl.h@email.com',            address:'89 Aspen Drive',      birthday:`${thisYear-1}-08-09`, anniversary:'',           status:'critical',    assignedTo:'t3', groups:['Hospital Watch','Bereaved'],  gender:'Male',   maritalStatus:'widowed', spouseName:'',                spouseId:null, hasChildren:true,  children:[{id:1,name:'Maria Hutchins',birthday:'1990-04-22'}], memberType:'member' },
  { id:'m12', name:'Aaliyah & Marcus Grant',     phone:'555-1012', email:'aaliyah.grant@email.com',     address:'401 Chestnut Blvd',   birthday:`${thisYear-1}-05-30`, anniversary:'2017-10-08', status:'active',      assignedTo:'t1', groups:['General','Young Adults'],   gender:'Female', maritalStatus:'married', spouseName:'Marcus Grant',    spouseId:null, hasChildren:false, children:[], memberType:'member' },
  { id:'m13', name:'Noah Fitzgerald',            phone:'555-1013', email:'noah.fitz@email.com',         address:'22 Harbor View Ct',   birthday:`${thisYear-1}-01-14`, anniversary:'',           status:'active',      assignedTo:'t5', groups:['Youth'],                    gender:'Male',   maritalStatus:'single',  spouseName:'',                spouseId:null, hasChildren:false, children:[], memberType:'member' },
  { id:'m14', name:'Sister Agnes Moreau',        phone:'555-1014', email:'agnes.moreau@email.com',      address:'5 Convent Road',      birthday:`${thisYear-1}-10-11`, anniversary:'',           status:'active',      assignedTo:'t4', groups:['General','Seniors'],       gender:'Female', maritalStatus:'single',  spouseName:'',                spouseId:null, hasChildren:false, children:[], memberType:'member' },
  { id:'m15', name:'Raymond & Gloria Patel',     phone:'555-1015', email:'raymond.patel@email.com',     address:'118 Sunflower Dr',    birthday:`${thisYear-1}-${String(now.getMonth()+1).padStart(2,'0')}-${String(Math.min(now.getDate()+8,28)).padStart(2,'0')}`, anniversary:'2001-04-30', status:'active', assignedTo:'t1', groups:['General','New Members'], gender:'Male', maritalStatus:'married', spouseName:'Gloria Patel', spouseId:null, hasChildren:true, children:[{id:1,name:'Arjun Patel',birthday:'2005-07-12'}], memberType:'member' },
];

// ─── Mock Notes ───────────────────────────────────────────────────────────────
const MOCK_NOTES = [
  { id:'n1',  memberId:'m6',  authorId:'t3', authorName:'Elder Ruth Santana',    authorRole:'Care Pastor',    authorAvatar:'RS', authorColor:'#10b981', type:'hospital', content:'Helen was admitted to St. Luke\'s Hospital on Monday. She had a fall at home and fractured her hip. Surgery is scheduled for Thursday. Her daughter Patricia is flying in from Phoenix. Please keep her in prayer.', private:false, date:ago(1) },
  { id:'n2',  memberId:'m3',  authorId:'t3', authorName:'Elder Ruth Santana',    authorRole:'Care Pastor',    authorAvatar:'RS', authorColor:'#10b981', type:'visit',    content:'Visited Dolores at home. She\'s been struggling with mobility since her knee surgery. Her spirits were good — we prayed together and I brought communion. She asked if the church could help arrange transportation to Sunday service.', private:false, date:ago(2) },
  { id:'n3',  memberId:'m11', authorId:'t1', authorName:'Pastor David Mercer',   authorRole:'Senior Pastor',  authorAvatar:'DM', authorColor:'#6366f1', type:'call',     content:'Called Carl to check in after the passing of his wife last month. He is grieving deeply but surrounded by his daughter Maria and her family. He mentioned he\'s not ready to return to Sunday services yet but appreciates the calls.', private:false, date:ago(2) },
  { id:'n4',  memberId:'m7',  authorId:'t4', authorName:'Elder James Whitfield', authorRole:'Elder',          authorAvatar:'JW', authorColor:'#f59e0b', type:'prayer',   content:'DeShawn and Alicia reached out — they lost a pregnancy last week. They are devastated. Alicia asked specifically that we not make a public announcement. They want prayers privately.', private:true,  date:ago(3) },
  { id:'n5',  memberId:'m1',  authorId:'t1', authorName:'Pastor David Mercer',   authorRole:'Senior Pastor',  authorAvatar:'DM', authorColor:'#6366f1', type:'visit',    content:'Harold and Margaret are celebrating their 27th anniversary next week. Stopped by with flowers from the congregation. Margaret shared she has been having some health concerns — scheduling a follow-up conversation with her doctor.', private:false, date:ago(4) },
  { id:'n6',  memberId:'m9',  authorId:'t3', authorName:'Elder Ruth Santana',    authorRole:'Care Pastor',    authorAvatar:'RS', authorColor:'#10b981', type:'visit',    content:'Frank\'s dementia has progressed noticeably since last month. Dorothy is the primary caregiver and is showing signs of caregiver burnout. Suggested she connect with our respite care volunteers. Bringing a meal on Friday.', private:false, date:ago(5) },
  { id:'n7',  memberId:'m2',  authorId:'t2', authorName:'Pastor Grace Okonkwo',  authorRole:'Co-Pastor',      authorAvatar:'GO', authorColor:'#3b82f6', type:'meeting',  content:'Met with Kevin for coffee. He is settling into the city after relocating from Atlanta. He\'s a software engineer, very interested in helping with the media ministry. He\'s looking for community — encouraged him to join the Young Adults group.', private:false, date:ago(5) },
  { id:'n8',  memberId:'m6',  authorId:'t1', authorName:'Pastor David Mercer',   authorRole:'Senior Pastor',  authorAvatar:'DM', authorColor:'#6366f1', type:'prayer',   content:'Visited Helen pre-surgery. We prayed together at her bedside. She was calm and at peace. Her daughter Patricia and son-in-law were present. The surgical team expects a positive outcome. Follow up post-surgery.', private:false, date:ago(0) },
  { id:'n9',  memberId:'m10', authorId:'t2', authorName:'Pastor Grace Okonkwo',  authorRole:'Co-Pastor',      authorAvatar:'GO', authorColor:'#3b82f6', type:'email',    content:'Priya replied to the welcome email. She\'s new to the area and found us through a Google search. She\'s from a Hindu background and is spiritually curious. She\'d like to have a private conversation with a pastor before attending a service.', private:true,  date:ago(6) },
  { id:'n10', memberId:'m4',  authorId:'t1', authorName:'Pastor David Mercer',   authorRole:'Senior Pastor',  authorAvatar:'DM', authorColor:'#6366f1', type:'meeting',  content:'Tyler and Brianna are having some financial difficulties following a job change. They are embarrassed and asked for discretion. Referred them to our benevolence fund and connected them with a financial counselor in our congregation.', private:true,  date:ago(7) },
  { id:'n11', memberId:'m8',  authorId:'t5', authorName:'Marcus Webb',           authorRole:'Youth Minister', authorAvatar:'MW', authorColor:'#ec4899', type:'call',     content:'Zoe has been missing youth group for 3 weeks. Called to check in — she\'s been dealing with some bullying at school. She opened up a lot. We\'re setting up a mentorship connection with one of our young adult leaders.', private:false, date:ago(8) },
  { id:'n12', memberId:'m14', authorId:'t4', authorName:'Elder James Whitfield', authorRole:'Elder',          authorAvatar:'JW', authorColor:'#f59e0b', type:'visit',    content:'Visited Sister Agnes. She is 84 and sharp as ever! She wanted to discuss the new worship format — she misses the traditional hymns. We had a wonderful conversation and prayed together. She gave a generous tithe for the building fund.', private:false, date:ago(10) },
];

// ─── Mock Tasks ───────────────────────────────────────────────────────────────
const MOCK_TASKS = [
  { id:'tk1', memberId:'m6',  assignedTo:'t3', assigneeName:'Elder Ruth Santana',    memberName:'Helen Carmichael',           createdBy:'t1', title:'Follow up after hip surgery',              due:new Date(now.getTime()+2*86400000).toISOString().split('T')[0], done:false, priority:'urgent' },
  { id:'tk2', memberId:'m9',  assignedTo:'t3', assigneeName:'Elder Ruth Santana',    memberName:'Frank & Dorothy Bellamy',    createdBy:'t3', title:'Arrange respite care volunteers for Dorothy', due:new Date(now.getTime()+3*86400000).toISOString().split('T')[0], done:false, priority:'high'   },
  { id:'tk3', memberId:'m3',  assignedTo:'t6', assigneeName:'Sandra Kim',            memberName:'Dolores Vasquez',            createdBy:'t3', title:'Coordinate Sunday transport for Dolores',   due:new Date(now.getTime()+5*86400000).toISOString().split('T')[0], done:false, priority:'medium' },
  { id:'tk4', memberId:'m11', assignedTo:'t1', assigneeName:'Pastor David Mercer',   memberName:'Carl Hutchins',              createdBy:'t1', title:'Weekly check-in call with Carl',            due:new Date(now.getTime()+1*86400000).toISOString().split('T')[0], done:false, priority:'high'   },
  { id:'tk5', memberId:'m7',  assignedTo:'t2', assigneeName:'Pastor Grace Okonkwo',  memberName:'DeShawn & Alicia Williams',  createdBy:'t1', title:'Send grief resources to Alicia Williams',   due:new Date(now.getTime()+2*86400000).toISOString().split('T')[0], done:false, priority:'urgent' },
  { id:'tk6', memberId:'m2',  assignedTo:'t2', assigneeName:'Pastor Grace Okonkwo',  memberName:'Kevin Osei',                 createdBy:'t2', title:'Introduce Kevin to media ministry team',    due:new Date(now.getTime()+7*86400000).toISOString().split('T')[0], done:false, priority:'medium' },
  { id:'tk7', memberId:'m10', assignedTo:'t2', assigneeName:'Pastor Grace Okonkwo',  memberName:'Priya Sharma',               createdBy:'t2', title:'Schedule pastoral meeting with Priya',      due:new Date(now.getTime()+4*86400000).toISOString().split('T')[0], done:false, priority:'medium' },
  { id:'tk8', memberId:'m8',  assignedTo:'t5', assigneeName:'Marcus Webb',           memberName:'Zoe Nakamura',               createdBy:'t5', title:'Connect Zoe with a youth mentor',           due:new Date(now.getTime()+3*86400000).toISOString().split('T')[0], done:false, priority:'high'   },
  { id:'tk9', memberId:'m1',  assignedTo:'t1', assigneeName:'Pastor David Mercer',   memberName:'Margaret & Harold Thompson', createdBy:'t1', title:'Follow up on Margaret\'s health concerns',  due:new Date(now.getTime()+6*86400000).toISOString().split('T')[0], done:false, priority:'medium' },
  { id:'tk10',memberId:'m4',  assignedTo:'t1', assigneeName:'Pastor David Mercer',   memberName:'Tyler & Brianna Jackson',    createdBy:'t1', title:'Connect Jacksons with financial counselor', due:new Date(now.getTime()+5*86400000).toISOString().split('T')[0], done:true,  priority:'high'   },
  { id:'tk11',memberId:'m5',  assignedTo:'t2', assigneeName:'Pastor Grace Okonkwo',  memberName:'Pastor Elijah Monroe',       createdBy:'t2', title:'Schedule guest speaking opportunity',       due:new Date(now.getTime()+14*86400000).toISOString().split('T')[0],done:false, priority:'low'    },
  { id:'tk12',memberId:'m15', assignedTo:'t1', assigneeName:'Pastor David Mercer',   memberName:'Raymond & Gloria Patel',     createdBy:'t1', title:'Welcome call for the Patel family',         due:new Date(now.getTime()+2*86400000).toISOString().split('T')[0], done:true,  priority:'medium' },
];

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{-webkit-text-size-adjust:100%;}
  body{overscroll-behavior:none;}
  ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:#2a2d3a;border-radius:2px;}

  .sc-input{background:#1a1e2e;border:1.5px solid #2a2d3a;border-radius:10px;color:#e8e4d9;
    font-family:'DM Sans',sans-serif;font-size:15px;padding:12px 14px;width:100%;outline:none;
    transition:border-color .15s;-webkit-appearance:none;appearance:none;}
  .sc-input:focus{border-color:#8b5cf6;}
  textarea.sc-input{resize:vertical;min-height:90px;}
  select.sc-input{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px;}
  select option{background:#1a1e2e;}

  .sc-btn{cursor:pointer;border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-weight:600;
    transition:all .15s;-webkit-tap-highlight-color:transparent;
    display:inline-flex;align-items:center;justify-content:center;gap:6px;}
  .sc-btn:active{transform:scale(.97);opacity:.85;}
  .sc-btn-primary{background:#8b5cf6;color:#fff;padding:13px 20px;font-size:15px;width:100%;}
  .sc-btn-secondary{background:#1a1e2e;border:1.5px solid #2a2d3a;color:#94a3b8;padding:11px 16px;font-size:14px;}
  .sc-btn-sm{padding:7px 13px;font-size:12px;border-radius:8px;}
  .sc-btn:disabled{opacity:.45;cursor:not-allowed;}

  .sc-card{background:#171b26;border:1px solid #1e2336;border-radius:14px;padding:16px;}
  .sc-tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;
    font-family:'DM Sans',sans-serif;font-weight:600;white-space:nowrap;}

  .bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:50;background:#0a0c12;
    border-top:1px solid #1a1d2e;display:flex;align-items:stretch;
    padding-bottom:env(safe-area-inset-bottom,0px);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:8px 4px 6px;cursor:pointer;-webkit-tap-highlight-color:transparent;
    color:#475569;transition:color .15s;gap:3px;font-family:'DM Sans',sans-serif;
    font-size:10px;font-weight:500;min-height:56px;}
  .bnav-item.active{color:#c4b5fd;}
  .bnav-item .bnav-icon{font-size:20px;line-height:1;}

  .sidebar{width:220px;flex-shrink:0;background:#0a0c12;border-right:1px solid #141620;
    display:flex;flex-direction:column;padding:22px 10px;}
  .nav-item{cursor:pointer;padding:10px 13px;border-radius:9px;display:flex;align-items:center;
    gap:10px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;
    transition:all .14s;color:#94a3b8;-webkit-tap-highlight-color:transparent;}
  .nav-item:hover{background:rgba(255,255,255,.06);color:#e8e4d9;}
  .nav-item.active{background:rgba(139,92,246,.18);color:#c4b5fd;}

  .member-row{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:12px;
    cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent;
    border:1px solid #1a1d2e;margin-bottom:6px;}
  .member-row:active{background:#1a1e2e;}

  .note-card{border-left:3px solid #8b5cf6;background:#0f1117;border-radius:0 12px 12px 0;
    padding:13px 14px;margin-bottom:10px;}

  .task-row{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:12px;
    background:#171b26;border:1px solid #1e2336;margin-bottom:8px;}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;
    display:flex;align-items:flex-end;justify-content:center;}
  .modal-sheet{background:#111520;border-radius:20px 20px 0 0;border:1px solid #1e2336;
    border-bottom:none;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;
    padding:8px 20px 20px;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px));}
  .modal-handle{width:40px;height:4px;background:#2a2d3a;border-radius:2px;margin:10px auto 18px;}

  .search-overlay{position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.88);
    display:flex;flex-direction:column;padding:16px;
    padding-top:calc(16px + env(safe-area-inset-top,0px));}
  .search-result-item{display:flex;align-items:center;gap:12px;padding:13px 14px;
    border-radius:12px;cursor:pointer;-webkit-tap-highlight-color:transparent;
    border:1px solid #1e2336;margin-bottom:6px;background:#111520;}
  .search-result-item:active{background:#1a1e2e;}

  .sc-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:#1e2a1e;border:1px solid #2d5a2d;color:#6ee77a;padding:11px 22px;
    border-radius:30px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;
    z-index:999;white-space:nowrap;animation:toastIn .3s ease;pointer-events:none;}

  .demo-banner{position:fixed;top:0;left:0;right:0;z-index:999;
    background:linear-gradient(90deg,#7c3aed,#4f46e5);
    padding:7px 16px;display:flex;align-items:center;justify-content:center;gap:10px;
    font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#fff;
    letter-spacing:.03em;}

  .app-header{position:sticky;top:0;z-index:40;background:#0a0c12;
    border-bottom:1px solid #141620;padding:0 12px;
    padding-top:env(safe-area-inset-top,0px);
    display:flex;align-items:center;gap:6px;height:56px;}

  .stat-card{background:#171b26;border:1px solid #1e2336;border-radius:12px;
    padding:14px 12px;text-align:center;cursor:pointer;transition:transform .15s,border-color .15s;}

  .fab{position:fixed;right:18px;bottom:76px;z-index:45;width:54px;height:54px;
    border-radius:50%;background:#8b5cf6;color:#fff;border:none;cursor:pointer;
    font-size:24px;display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 20px rgba(139,92,246,.45);-webkit-tap-highlight-color:transparent;
    transition:transform .15s,box-shadow .15s;}
  .fab:active{transform:scale(.93);}

  .pulse{animation:pulse 1.5s ease-in-out infinite;}
  .live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;
    margin-right:5px;animation:pulse 2s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
  @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

  .grid-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
  .lbl{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;
    letter-spacing:.08em;color:#64748b;margin-bottom:6px;display:block;}
  .avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-family:'DM Sans',sans-serif;font-weight:700;flex-shrink:0;}

  .login-card{background:#0f1117;border:1px solid #1e2336;border-radius:20px;
    padding:28px 24px;width:100%;max-width:460px;}

  .role-card{background:#0f1117;border:1.5px solid #2a2d3a;border-radius:14px;padding:16px 18px;
    cursor:pointer;transition:all .2s;-webkit-tap-highlight-color:transparent;}
  .role-card:hover,.role-card:active{border-color:#8b5cf6;background:#12172a;}

  @media(min-width:480px){.login-card{padding:34px 32px;}}
  @media(min-width:600px){.grid-stats{grid-template-columns:repeat(3,1fr);}}
  @media(min-width:768px){
    .grid-stats{grid-template-columns:repeat(5,1fr);gap:12px;}
    .sc-toast{bottom:28px;}
    .modal-overlay{align-items:center;}
    .modal-sheet{border-radius:18px;border-bottom:1px solid #1e2336;max-height:88vh;}
    .modal-handle{display:none;}
    .fab{bottom:28px;right:28px;width:50px;height:50px;}
    .demo-banner{font-size:13px;}
  }
  @media(min-width:768px){
    #desktop-sidebar{display:flex !important;}
    .bottom-nav{display:none !important;}
    .fab{bottom:28px !important;right:28px !important;}
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// DEMO LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [selected, setSelected] = useState(null);

  const demoRoles = [
    { member: MOCK_TEAM[0], desc: 'Full access — all members, team management, reports' },
    { member: MOCK_TEAM[1], desc: 'Broad access — all members, care notes, reports' },
    { member: MOCK_TEAM[2], desc: 'Care focus — all members, notes, limited admin' },
    { member: MOCK_TEAM[3], desc: 'Assigned members only — add notes, prayer' },
    { member: MOCK_TEAM[4], desc: 'Youth group — assigned members, notes' },
    { member: MOCK_TEAM[5], desc: 'Volunteer — assigned members only' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, background:'#08090e', overflowY:'auto' }}>
    <div style={{ minWidth:'100vw', minHeight:'100vh', background:'#08090e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', padding:'60px 16px 40px' }}>
      <style>{CSS}</style>

      {/* Demo banner */}
      <div className="demo-banner" style={{ position:'fixed', top:0 }}>
        <span>🎮</span>
        <span>TRIAL DEMO — Your Church · ShepherdCare</span>
        <span style={{ opacity:.7 }}>All data is sample data</span>
      </div>

      <div style={{ textAlign:'center', marginBottom:32, marginTop:10 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:38, fontWeight:700, color:'#c4b5fd', lineHeight:1 }}>✦ ShepherdCare</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#475569', marginTop:6 }}>Pastoral Care Management · Your Church</div>
        <a href="/ShepherdCare_Tutorial.html" target="_blank" rel="noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#8b5cf622', border:'1.5px solid #8b5cf655', borderRadius:10, padding:'12px 24px', fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:'#c4b5fd', textDecoration:'none', letterSpacing:'.04em', marginTop:10 }}>
          📖 USER GUIDE
        </a>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#8b5cf6', marginTop:10, background:'#8b5cf611', border:'1px solid #8b5cf633', borderRadius:30, padding:'6px 16px', display:'inline-block' }}>
          👋 Choose a role below to explore the app
        </div>
      </div>

      <div className="login-card">
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#e8e4d9', marginBottom:4 }}>Sign in as…</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#64748b', marginBottom:20 }}>Each role has different permissions — try them all!</div>

        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {demoRoles.map(({ member, desc }) => (
            <div key={member.id} className="role-card"
              style={{ borderColor: selected?.id === member.id ? '#8b5cf6' : '#2a2d3a', background: selected?.id === member.id ? '#8b5cf611' : '#0f1117' }}
              onClick={() => setSelected(member)}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div className="avatar" style={{ width:40, height:40, fontSize:13, background: member.color+'22', color: member.color }}>{member.avatar}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:'#e8e4d9' }}>{member.name}</span>
                    {selected?.id === member.id && <span style={{ fontSize:14 }}>✓</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2, flexWrap:'wrap' }}>
                    <span className="sc-tag" style={{ background: member.color+'22', color: member.color, fontSize:10 }}>{member.role}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#475569' }}>{desc}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="sc-btn sc-btn-primary" disabled={!selected} onClick={() => selected && onLogin(selected)}
          style={{ opacity: selected ? 1 : 0.4 }}>
          {selected ? `Enter as ${selected.name.split(' ').slice(0,2).join(' ')} →` : 'Select a role above'}
        </button>

        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#334155', marginTop:14, textAlign:'center' }}>
          No login required · All changes reset on refresh · 100% sample data
        </div>
      </div>

      <div style={{ marginTop:28, display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center' }}>
        {[['15','Members'],['12','Care Notes'],['12','Tasks'],['6','Team Members']].map(([v,l])=>(
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:700, color:'#8b5cf6' }}>{v}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function SearchOverlay({ members, notes, onSelect, onClose }) {
  const [q, setQ] = useState('');
  const ref = useRef();
  useEffect(() => { setTimeout(() => ref.current?.focus(), 80); }, []);

  const q2 = q.trim().toLowerCase();
  const mRes = q2.length > 0 ? members.filter(m =>
    m.name.toLowerCase().includes(q2) ||
    (m.email||'').toLowerCase().includes(q2) ||
    (m.phone||'').includes(q2) ||
    m.groups.some(g => g.toLowerCase().includes(q2)) ||
    (m.children||[]).some(c=>(c.name||'').toLowerCase().includes(q2))
  ).slice(0, 6) : [];

  const nRes = q2.length > 1 ? notes.filter(n =>
    !n.private && n.content.toLowerCase().includes(q2)
  ).slice(0, 3) : [];

  return (
    <div className="search-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
          <div style={{ flex:1, position:'relative' }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:17 }}>🔍</span>
            <input ref={ref} className="sc-input" style={{ paddingLeft:42, fontSize:16, borderRadius:12 }}
              placeholder="Search members, notes, groups…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button onClick={onClose} className="sc-btn sc-btn-secondary sc-btn-sm" style={{ whiteSpace:'nowrap', flexShrink:0 }}>Cancel</button>
        </div>
        {q2.length === 0 && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#475569', textAlign:'center', paddingTop:40 }}>Start typing to search…</div>}
        {mRes.length > 0 && <>
          <div className="lbl" style={{ paddingLeft:4, marginBottom:8 }}>Members</div>
          {mRes.map(m => {
            const s = STATUS_CFG[m.status];
            return (
              <div key={m.id} className="search-result-item" onClick={() => { onSelect(m); onClose(); }}>
                <div className="avatar" style={{ width:38, height:38, fontSize:13, background:s.color+'22', color:s.color }}>
                  {m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:'#e8e4d9' }}>{m.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b', marginTop:1 }}>
                    {m.groups.join(' · ')}
                    {(m.children||[]).some(c=>(c.name||'').toLowerCase().includes(q2)) &&
                      <span style={{ color:'#a78bfa', marginLeft: m.groups.length ? 6 : 0 }}>
                        · 👶 {(m.children||[]).find(c=>(c.name||'').toLowerCase().includes(q2))?.name}
                      </span>
                    }
                  </div>
                </div>
                <span className="sc-tag" style={{ background:s.color+'22', color:s.color, fontSize:10 }}>{s.label}</span>
              </div>
            );
          })}
        </>}
        {nRes.length > 0 && <>
          <div className="lbl" style={{ paddingLeft:4, marginBottom:8, marginTop:12 }}>Care Notes</div>
          {nRes.map(n => {
            const m = members.find(x => x.id === n.memberId);
            return (
              <div key={n.id} className="search-result-item" onClick={() => { if (m) onSelect(m); onClose(); }}>
                <div style={{ fontSize:22 }}>{NOTE_ICONS[n.type]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#c4b5fd' }}>{m?.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.content.slice(0, 60)}…</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#475569', marginTop:2 }}>{n.authorName} · {fmtShort(n.date)}</div>
                </div>
              </div>
            );
          })}
        </>}
        {q2.length > 0 && !mRes.length && !nRes.length && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#475569', textAlign:'center', paddingTop:40 }}>No results for "{q}"</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL (read-only in trial for Volunteer/Youth; full for Pastors)
// ─────────────────────────────────────────────────────────────────────────────
function AdminPanel({ team, setTeam, currentUser, onClose, showToast }) {
  const [view, setView] = useState('team');
  const [inv, setInv] = useState({ name:'', email:'', phone:'', role:'Volunteer' });

  const doInvite = () => {
    if (!inv.name.trim() || !inv.email.trim()) return;
    const newMember = {
      id: uid(), authId: uid(),
      name: inv.name, email: inv.email, phone: inv.phone,
      role: inv.role, avatar: inv.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
      color: '#a78bfa', status: 'pending', joinedDate: new Date().toISOString().split('T')[0],
    };
    setTeam(prev => [...prev, newMember]);
    setInv({ name:'', email:'', phone:'', role:'Volunteer' });
    setView('team');
    showToast('Team member invited ✓ (demo only)');
  };

  const statusColors = { active:'#10b981', pending:'#f59e0b', deactivated:'#ef4444' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth:'100%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#e8e4d9', fontWeight:600 }}>⚙ Team Management</div>
          <button onClick={onClose} className="sc-btn sc-btn-secondary sc-btn-sm">✕</button>
        </div>
        <div style={{ background:'#8b5cf611', border:'1px solid #8b5cf633', borderRadius:9, padding:'9px 13px', marginBottom:14, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#c4b5fd' }}>
          🎮 Demo — changes won't persist after refresh
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:18, overflowX:'auto', paddingBottom:2 }}>
          {[['team','👥 Members'],['invite','✉️ Invite'],['perms','🔐 Roles']].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} className="sc-btn" style={{ padding:'8px 14px', borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, whiteSpace:'nowrap', background:view===v?'#8b5cf622':'#1a1e2e', border:`1.5px solid ${view===v?'#8b5cf6':'#2a2d3a'}`, color:view===v?'#c4b5fd':'#64748b' }}>{l}</button>
          ))}
        </div>

        {view === 'team' && team.map(m => (
          <div key={m.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'12px 13px', background:'#0f1117', borderRadius:11, marginBottom:7, border:'1px solid #1a1d2e' }}>
            <div className="avatar" style={{ width:38, height:38, fontSize:11, background:m.color+'22', color:m.color }}>{m.avatar}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#e8e4d9' }}>{m.name}</span>
                {m.id === currentUser.id && <span className="sc-tag" style={{ background:'#6366f122', color:'#818cf8', fontSize:10 }}>You</span>}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:ROLE_COLOR[m.role]||'#64748b', marginTop:2 }}>{m.role}</div>
            </div>
            <span className="sc-tag" style={{ background:statusColors[m.status]+'22', color:statusColors[m.status], fontSize:10 }}>{m.status}</span>
          </div>
        ))}

        {view === 'invite' && <div>
          {[{l:'Full Name *',k:'name',t:'text',p:'First and Last'},{l:'Email *',k:'email',t:'email',p:'name@email.com'},{l:'Mobile',k:'phone',t:'tel',p:'555-0100'}].map(f=>(
            <div key={f.k} style={{ marginBottom:13 }}>
              <label className="lbl">{f.l}</label>
              <input className="sc-input" type={f.t} placeholder={f.p} value={inv[f.k]} onChange={e=>setInv({...inv,[f.k]:e.target.value})} />
            </div>
          ))}
          <div style={{ marginBottom:18 }}>
            <label className="lbl">Role</label>
            <select className="sc-input" value={inv.role} onChange={e=>setInv({...inv,role:e.target.value})}>
              {ALL_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={doInvite} className="sc-btn sc-btn-primary" style={{ flex:1 }}>💾 Save Profile (Demo)</button>
            <button onClick={()=>setView('team')} className="sc-btn sc-btn-secondary">Cancel</button>
          </div>
        </div>}

        {view === 'perms' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
              <div key={role} style={{ background:'#0f1117', border:'1px solid #1a1d2e', borderRadius:10, padding:'12px 13px' }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:ROLE_COLOR[role]||'#94a3b8', marginBottom:9 }}>{role}</div>
                {Object.entries(perms).map(([p,v]) => (
                  <div key={p} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:v?'#6ee77a':'#f87171', marginBottom:4 }}>
                    {v?'✓':'✗'} {p.replace(/([A-Z])/g,' $1').replace(/^can /,'').trim()}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function ShepherdCareDemo() {
  // ── Auth ──
  const [authUser, setAuthUser] = useState(null);

  // ── Data (in-memory) ──
  const [team,    setTeam]    = useState(MOCK_TEAM);
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [notes,   setNotes]   = useState(MOCK_NOTES);
  const [tasks,   setTasks]   = useState(MOCK_TASKS);

  // ── UI state ──
  const [page,      setPageRaw]    = useState('dashboard');
  const [selMember, setSelMember]  = useState(null);
  const [fGroup,    setFGroup]     = useState('All');
  const [fStatus,   setFStatus]    = useState('All');
  const [fSort,     setFSort]      = useState('az');
  const [dashFilter,setDashFilter] = useState(null);

  const setPage = (newPage, opts={}) => {
    if (!opts.fromPop) window.history.pushState({ page:newPage }, '', window.location.pathname);
    setPageRaw(newPage);
  };

  useEffect(() => {
    const onPop = (e) => { const p = e.state?.page || 'dashboard'; setSelMember(null); setPageRaw(p); };
    window.addEventListener('popstate', onPop);
    window.history.replaceState({ page:'dashboard' }, '', window.location.pathname);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const [showNote,   setShowNote]   = useState(false);
  const [showTask,   setShowTask]   = useState(false);
  const [showAddM,   setShowAddM]   = useState(false);
  const [showAdmin,  setShowAdmin]  = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [showChildren, setShowChildren] = useState(null);
  const [childF,     setChildF]     = useState({ name:'', birthday:'' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast,      setToast]      = useState(null);

  const [noteF, setNoteF] = useState({ type:'visit', content:'', isPrivate:false });
  const [editNote,  setEditNote]  = useState(null); // { id, type, content, isPrivate }
  const [selNote,   setSelNote]   = useState(null); // note open in detail modal
  const [taskF, setTaskF] = useState({ title:'', due:'', assignedTo:'', priority:'medium' });
  const [mbrF,  setMbrF]  = useState({ name:'', phone:'', email:'', birthday:'', anniversary:'', address:'', groups:[], assignedTo:'', status:'active', gender:'', maritalStatus:'single', spouseName:'', spouseId:null, hasChildren:false, children:[], memberType:'member' });

  const showToast = useCallback((msg) => {
    setToast(msg); setTimeout(() => setToast(null), 2800);
  }, []);

  // ── Login ──
  const handleLogin = (member) => {
    setAuthUser(member);
    setTaskF(f => ({ ...f, assignedTo: member.id }));
    setMbrF(f  => ({ ...f, assignedTo: member.id }));
  };

  const handleSignOut = () => {
    setAuthUser(null);
    setSelMember(null);
    setPageRaw('dashboard');
  };

  if (!authUser) return <LoginScreen onLogin={handleLogin} />;

  // ── Derived ──
  const perms    = ROLE_PERMISSIONS[authUser.role] || {};
  const visibleM = perms.canViewAllMembers
    ? members
    : members.filter(m => m.assignedTo === authUser.id);
  const canSeeNote = n => !n.private || n.authorId === authUser.id || perms.canViewAllPrivate;

  const SUFFIXES = new Set(['jr','jr.','sr','sr.','ii','iii','iv','v',
    'md','phd','dds','esq','rn','dd','dr','ret','emeritus']);
  const getLastName = name => {
    const parts = name.trim().split(/\s+/);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!SUFFIXES.has(parts[i].toLowerCase())) return parts[i].toLowerCase();
    }
    return parts[0].toLowerCase();
  };

  const filteredM = visibleM.filter(m => {
    const mg = fGroup==='All' || (fGroup==='__visitor' ? m.memberType==='visitor' : fGroup==='__member' ? m.memberType!=='visitor' : m.groups.includes(fGroup));
    const ms = fStatus === 'All' || m.status === fStatus;
    return mg && ms;
  }).sort((a, b) => {
    if (fSort === 'az')     return getLastName(a.name).localeCompare(getLastName(b.name));
    if (fSort === 'za')     return getLastName(b.name).localeCompare(getLastName(a.name));
    if (fSort === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
    if (fSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  const mNotes = selMember ? notes.filter(n => n.memberId === selMember.id && canSeeNote(n)) : [];
  const mTasks = selMember ? tasks.filter(t => t.memberId === selMember.id) : [];

  const stones = visibleM.flatMap(m => [
    m.birthday    ? { member:m, type:'Birthday 🎂',    days:daysUntil(m.birthday) }    : null,
    m.anniversary ? { member:m, type:'Anniversary 💍', days:daysUntil(m.anniversary) } : null,
  ]).filter(x => x && x.days <= 30).sort((a,b) => a.days - b.days);

  const stats = {
    total:     visibleM.length,
    critical:  visibleM.filter(m => m.status === 'critical').length,
    needsCare: visibleM.filter(m => m.status === 'needs-care').length,
    openTasks: tasks.filter(t => !t.done && (perms.canViewAllMembers || t.assignedTo === authUser.id)).length,
    notesWeek: notes.filter(n => canSeeNote(n) && Date.now() - new Date(n.date) < 7*864e5).length,
  };

  // ── Actions ──
  const openM  = m => { setSelMember(m); setPage('member'); };
  const goBack = () => { setSelMember(null); window.history.back(); };

  const doAddNote = () => {
    if (!noteF.content.trim()) return;
    const newNote = {
      id: uid(), memberId: selMember?.id || null,
      authorId: authUser.id, authorName: authUser.name,
      authorRole: authUser.role, authorAvatar: authUser.avatar, authorColor: authUser.color,
      type: noteF.type, content: noteF.content, private: noteF.isPrivate,
      date: new Date().toISOString(),
    };
    setNotes(p => [newNote, ...p]);
    setNoteF({ type:'visit', content:'', isPrivate:false });
    setShowNote(false);
    showToast('Care note saved ✓');
  };

  const doEditNote = () => {
    if (!editNote?.content.trim()) return;
    setNotes(p => p.map(n => n.id === editNote.id
      ? { ...n, type: editNote.type, content: editNote.content, private: editNote.isPrivate }
      : n
    ));
    setEditNote(null);
    showToast('Care note updated ✓');
  };

  const doAddTask = () => {
    if (!taskF.title.trim()) return;
    const assignee = team.find(l => l.id === (taskF.assignedTo || authUser.id));
    const newTask = {
      id: uid(), memberId: selMember?.id || null,
      assignedTo: taskF.assignedTo || authUser.id,
      assigneeName: assignee?.name || authUser.name,
      memberName: selMember?.name || '',
      createdBy: authUser.id, title: taskF.title,
      due: taskF.due, done: false, priority: taskF.priority,
    };
    setTasks(p => [newTask, ...p]);
    setTaskF({ title:'', due:'', assignedTo:authUser.id, priority:'medium' });
    setShowTask(false);
    showToast('Task created ✓');
  };

  const doAddMbr = () => {
    if (!mbrF.name.trim()) return;
    const newMbr = {
      id: uid(), ...mbrF,
      assignedTo: mbrF.assignedTo || authUser.id,
      memberType: mbrF.memberType || 'member',
      createdAt: new Date().toISOString(),
    };
    setMembers(p => [newMbr, ...p]);
    setMbrF({ name:'', phone:'', email:'', birthday:'', anniversary:'', address:'', groups:[], assignedTo:authUser.id, status:'active', gender:'', maritalStatus:'single', spouseName:'', spouseId:null, hasChildren:false, children:[], memberType:'member' });
    setShowAddM(false);
    showToast(`${newMbr.name} added ✓`);
  };

  const doEditMbr = () => {
    if (!mbrF.name.trim() || !editMember) return;
    const updated = { ...editMember, ...mbrF, memberType: mbrF.memberType || 'member' };
    setMembers(p => p.map(m => m.id === editMember.id ? updated : m));
    setSelMember(updated);
    setEditMember(null);
    showToast(`${mbrF.name} updated ✓`);
  };

  const toMD = d => {
    if (!d) return '';
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[1]}-${parts[2]}` : d;
  };

  const openEditMbr = (member) => {
    setMbrF({ name:member.name, phone:member.phone, email:member.email, address:member.address, birthday:member.birthday, anniversary:member.anniversary, status:member.status, assignedTo:member.assignedTo, groups:member.groups, gender:member.gender, maritalStatus:member.maritalStatus||'single', spouseName:member.spouseName, spouseId:member.spouseId, hasChildren:member.hasChildren, children:member.children||[], memberType:member.memberType||'member' });
    setEditMember(member);
  };

  const doSaveChild = (member) => {
    if (!childF.name.trim()) return;
    const newChild = { id: Date.now(), name:childF.name, birthday:childF.birthday };
    const updated = { ...member, children:[...(member.children||[]), newChild], hasChildren:true };
    setMembers(p => p.map(m => m.id === member.id ? updated : m));
    setShowChildren(updated);
    setChildF({ name:'', birthday:'' });
    showToast(`${childF.name} added ✓`);
  };

  const doDeleteChild = (member, childId) => {
    const updatedChildren = (member.children||[]).filter(c => c.id !== childId);
    const updated = { ...member, children:updatedChildren, hasChildren:updatedChildren.length > 0 };
    setMembers(p => p.map(m => m.id === member.id ? updated : m));
    setShowChildren(updated);
    showToast('Child removed');
  };

  const doToggleTask = (id, currentDone) => {
    setTasks(p => p.map(t => t.id === id ? {...t, done:!currentDone} : t));
    showToast(!currentDone ? 'Task completed ✓' : 'Task reopened');
  };

  const doUpdateStatus = (memberId, status) => {
    setMembers(p => p.map(m => m.id === memberId ? {...m, status} : m));
    if (selMember?.id === memberId) setSelMember(s => ({...s, status}));
    showToast('Status updated ✓');
  };

  const doDeleteMember = () => {
    if (!confirmDelete) return;
    setMembers(p => p.filter(m => m.id !== confirmDelete.id));
    setNotes(p => p.filter(n => n.memberId !== confirmDelete.id));
    setTasks(p => p.filter(t => t.memberId !== confirmDelete.id));
    const name = confirmDelete.name;
    setConfirmDelete(null);
    setSelMember(null);
    setPage('members');
    showToast(`${name} removed`);
  };

  // ─── PAGE RENDERS ──────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:600, color:'#e8e4d9', lineHeight:1.2 }}>
          Hello,<br />{authUser.name.split(' ').slice(0, 2).join(' ')}.
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#64748b', marginTop:6, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
          <span className="sc-tag" style={{ background:ROLE_COLOR[authUser.role]+'22', color:ROLE_COLOR[authUser.role] }}>{authUser.role}</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#8b5cf6', display:'flex', alignItems:'center', background:'#8b5cf611', padding:'2px 8px', borderRadius:20 }}>
            🎮 Demo Mode
          </span>
        </div>
      </div>

      <div className="grid-stats" style={{ marginBottom:18 }}>
        {[
          {l:'Members',    v:stats.total,     c:'#8b5cf6', i:'✦', action:()=>{ setDashFilter(null); setFStatus('All'); setPage('members'); }},
          {l:'Critical',   v:stats.critical,  c:'#ef4444', i:'◉', action:()=>{ setDashFilter('critical');   setFStatus('critical');   setPage('members'); }},
          {l:'Needs Care', v:stats.needsCare, c:'#f59e0b', i:'◎', action:()=>{ setDashFilter('needs-care'); setFStatus('needs-care'); setPage('members'); }},
          {l:'Open Tasks', v:stats.openTasks, c:'#6366f1', i:'◻', action:()=>{ setPage('tasks'); }},
          {l:'Notes/Week', v:stats.notesWeek, c:'#10b981', i:'◈', action:()=>{ setPage('activity'); }},
        ].map(s => (
          <div key={s.l} className="stat-card" onClick={s.action}
            onMouseEnter={e=>e.currentTarget.style.borderColor=s.c}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#1e2336'}>
            <div style={{ fontSize:17, color:s.c, marginBottom:4 }}>{s.i}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:s.c, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#64748b', marginTop:3, textTransform:'uppercase', letterSpacing:'.06em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {visibleM.filter(m => m.status !== 'active').length > 0 && (
        <div className="sc-card" style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#e8e4d9', marginBottom:12 }}>⚠ Needs Attention</div>
          {visibleM.filter(m => m.status !== 'active').map(m => {
            const s = STATUS_CFG[m.status];
            return (
              <div key={m.id} className="member-row" onClick={()=>openM(m)}>
                <div className="avatar" style={{ width:40, height:40, fontSize:13, background:s.color+'22', color:s.color }}>
                  {m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:'#e8e4d9' }}>{m.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.groups.join(' · ')}</div>
                </div>
                <span className="sc-tag" style={{ background:s.color+'22', color:s.color }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="sc-card" style={{ marginBottom:14 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#e8e4d9', marginBottom:12 }}>◻ My Tasks</div>
        {tasks.filter(t => !t.done && t.assignedTo === authUser.id).slice(0, 5).map(t => (
          <div key={t.id} className="task-row">
            <div onClick={()=>doToggleTask(t.id, t.done)} style={{ width:22, height:22, border:`2px solid ${PRI_COLOR[t.priority]}`, borderRadius:5, cursor:'pointer', flexShrink:0, marginTop:1 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13.5, fontWeight:500, color:'#e8e4d9' }}>{t.title}</div>
              {t.memberName && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b', marginTop:2 }}>re: {t.memberName}</div>}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b', whiteSpace:'nowrap' }}>{t.due || 'TBD'}</div>
          </div>
        ))}
        {tasks.filter(t => !t.done && t.assignedTo === authUser.id).length === 0 && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#475569' }}>✓ All caught up!</div>
        )}
      </div>

      {stones.length > 0 && (
        <div className="sc-card" style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#e8e4d9', marginBottom:12 }}>◑ Upcoming Milestones</div>
          {stones.slice(0, 5).map((x, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'#0f1117', borderRadius:10, marginBottom:7, cursor:'pointer' }} onClick={()=>openM(x.member)}>
              <div style={{ fontSize:22 }}>{x.type.split(' ')[1]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:'#e8e4d9' }}>{x.member.name}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b' }}>{x.type.split(' ')[0]}</div>
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:x.days<=7?'#f59e0b':'#64748b' }}>
                {x.days === 0 ? '🎉' : `${x.days}d`}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sc-card">
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#e8e4d9', marginBottom:12 }}>◈ Recent Activity</div>
        {notes.filter(n => canSeeNote(n)).slice(0, 5).map(n => {
          const m = members.find(x => x.id === n.memberId);
          return (
            <div key={n.id} style={{ display:'flex', gap:10, marginBottom:13, cursor:'pointer' }} onClick={()=>m&&openM(m)}>
              <div style={{ fontSize:20, marginTop:1 }}>{NOTE_ICONS[n.type]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#c4b5fd' }}>{m?.name}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.content}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#475569', marginTop:2 }}>{n.authorName} · {fmtShort(n.date)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMembers = () => (
    <div>
      {dashFilter && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:dashFilter==='critical'?'#ef444422':'#f59e0b22', border:`1px solid ${dashFilter==='critical'?'#ef4444':'#f59e0b'}`, borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:dashFilter==='critical'?'#ef4444':'#f59e0b' }}>
            {dashFilter === 'critical' ? '◉ Showing Critical members' : '◎ Showing Needs Care members'}
          </div>
          <button onClick={()=>{ setDashFilter(null); setFStatus('All'); }} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#64748b' }}>✕ Clear</button>
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <select className="sc-input" style={{ flex:1, minWidth:130 }} value={fGroup} onChange={e=>setFGroup(e.target.value)}>
          <option value="All">All Groups</option>
          <option value="__member">⛪ Members Only</option>
          <option value="__visitor">👋 Visitors Only</option>
          {ALL_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
        <select className="sc-input" style={{ flex:1, minWidth:120 }} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="needs-care">Needs Care</option>
          <option value="critical">Critical</option>
        </select>
        <select className="sc-input" style={{ flex:1, minWidth:120 }} value={fSort} onChange={e=>setFSort(e.target.value)}>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
          <option value="recent">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#64748b', marginBottom:10 }}>{filteredM.length} members</div>
      {filteredM.map(m => {
        const s = STATUS_CFG[m.status];
        const a = team.find(l => l.id === m.assignedTo);
        const ln = notes.filter(n => n.memberId === m.id && canSeeNote(n)).sort((a,b) => new Date(b.date)-new Date(a.date))[0];
        return (
          <div key={m.id} className="member-row" onClick={()=>openM(m)}>
            <div className="avatar" style={{ width:44, height:44, fontSize:14, background:s.color+'22', color:s.color }}>
              {m.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:'#e8e4d9' }}>{m.name}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {m.groups.join(' · ')}{ln ? ` · ${fmtShort(ln.date)}` : ''}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
              <span className="sc-tag" style={{ background:s.color+'18', color:s.color, fontSize:10 }}>{s.label}</span>
              {m.memberType === 'visitor' && <span className="sc-tag" style={{ background:'#f0fdf4', color:'#16a34a', fontSize:10, border:'1px solid #bbf7d0' }}>👋 Visitor</span>}
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#475569' }}>{a?.name.split(' ').slice(-1)[0]}</div>
            </div>
          </div>
        );
      })}
      {filteredM.length === 0 && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#475569', textAlign:'center', paddingTop:40 }}>
          No members match these filters.
        </div>
      )}
    </div>
  );

  const renderMemberDetail = () => {
    if (!selMember) return null;
    const s = STATUS_CFG[selMember.status];
    const assignee = team.find(l => l.id === selMember.assignedTo);
    const hiddenCnt = notes.filter(n => n.memberId === selMember.id && n.private && n.authorId !== authUser.id && !perms.canViewAllPrivate).length;
    return (
      <div>
        <div className="sc-card" style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            <div className="avatar" style={{ width:54, height:54, fontSize:18, fontWeight:700, background:s.color+'22', color:s.color }}>
              {selMember.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#e8e4d9' }}>{selMember.name}</div>
              <span className="sc-tag" style={{ background:s.color+'22', color:s.color, marginTop:4 }}>{s.label}</span>
            </div>
            {perms.canEditMembers && (
              <button onClick={()=>openEditMbr(selMember)} className="sc-btn sc-btn-secondary sc-btn-sm" style={{ flexShrink:0 }}>✏️ Edit</button>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              {i:'📞', l:'Phone',       v:selMember.phone},
              {i:'✉️', l:'Email',       v:selMember.email},
              {i:'🏠', l:'Address',     v:selMember.address},
              {i:'🎂', l:'Birthday',    v:selMember.birthday ? fmt(selMember.birthday) : null},
              {i:'💍', l:'Anniversary', v:selMember.anniversary ? fmt(selMember.anniversary) : null},
              {i:'👤', l:'Assigned To', v:assignee?.name || 'To Be Assigned'},
              {i:'⚧',  l:'Gender',      v:selMember.gender || null},
              {i:'💑', l:'Marital',     v:selMember.maritalStatus ? ({single:'Single',married:'Married',widowed:'Widowed'}[selMember.maritalStatus]||selMember.maritalStatus) : null},
            ].filter(x => x.v).map(x => (
              <div key={x.l}>
                <div className="lbl">{x.i} {x.l}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#e8e4d9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.v}</div>
              </div>
            ))}
          </div>
          {selMember.groups.length > 0 && (
            <div style={{ marginTop:12 }}>
              <div className="lbl">Groups</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:5 }}>
                {selMember.groups.map(g => <span key={g} className="sc-tag" style={{ background:'#1e2336', color:'#94a3b8' }}>{g}</span>)}
              </div>
            </div>
          )}
          {selMember.maritalStatus === 'married' && selMember.spouseName && (
            <div style={{ marginTop:12 }}>
              <div className="lbl">💑 Spouse</div>
              <div style={{ marginTop:5, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#94a3b8' }}>{selMember.spouseName}</div>
            </div>
          )}
          <div style={{ marginTop:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div className="lbl">👶 Children</div>
              <button onClick={()=>setShowChildren(selMember)} className="sc-btn sc-btn-secondary sc-btn-sm">
                {selMember.hasChildren ? `View (${(selMember.children||[]).length})` : '+ Add'}
              </button>
            </div>
          </div>
        </div>

        {perms.canEditMembers && (
          <div className="sc-card" style={{ marginBottom:14 }}>
            <div className="lbl" style={{ marginBottom:9 }}>Update Status</div>
            <div style={{ display:'flex', gap:8 }}>
              {Object.entries(STATUS_CFG).map(([key, val]) => (
                <button key={key} onClick={()=>doUpdateStatus(selMember.id, key)} className="sc-btn"
                  style={{ flex:1, padding:'10px 6px', fontSize:12, background:selMember.status===key?val.color+'22':'#1a1e2e', border:`1.5px solid ${selMember.status===key?val.color:'#2a2d3a'}`, color:selMember.status===key?val.color:'#64748b' }}>
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {perms.canDeleteMembers && (
          <div className="sc-card" style={{ marginBottom:14, border:'1px solid #ef444433' }}>
            <div className="lbl" style={{ marginBottom:9, color:'#ef4444' }}>⚠ Danger Zone</div>
            <button onClick={()=>setConfirmDelete(selMember)} className="sc-btn" style={{ width:'100%', padding:'11px', background:'#ef444422', border:'1.5px solid #ef4444', color:'#ef4444', fontSize:13, fontWeight:600, borderRadius:10 }}>
              🗑 Remove Member
            </button>
          </div>
        )}

        {mTasks.length > 0 && (
          <div className="sc-card" style={{ marginBottom:14 }}>
            <div className="lbl" style={{ marginBottom:9 }}>Tasks</div>
            {mTasks.map(t => {
              const a = team.find(l => l.id === t.assignedTo);
              return (
                <div key={t.id} className="task-row">
                  <div onClick={()=>doToggleTask(t.id, t.done)} style={{ width:22, height:22, border:`2px solid ${t.done?'#10b981':PRI_COLOR[t.priority]}`, borderRadius:5, cursor:'pointer', background:t.done?'#10b981':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    {t.done && <span style={{ color:'#fff', fontSize:12 }}>✓</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:t.done?'#475569':'#e8e4d9', textDecoration:t.done?'line-through':'none' }}>{t.title}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b', marginTop:2 }}>→ {a?.name} · {t.due || 'TBD'}</div>
                  </div>
                  <span className="sc-tag" style={{ background:PRI_COLOR[t.priority]+'22', color:PRI_COLOR[t.priority], fontSize:10, flexShrink:0 }}>{t.priority}</span>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div className="lbl">Care Notes ({mNotes.length})</div>
            {perms.canAddNotes && (
              <button onClick={()=>setShowNote(true)} className="sc-btn sc-btn-secondary sc-btn-sm">+ Add Note</button>
            )}
          </div>
          {!perms.canViewAllPrivate && hiddenCnt > 0 && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#64748b', background:'#1a1e2e', borderRadius:9, padding:'8px 12px', marginBottom:10 }}>
              🔒 {hiddenCnt} private note{hiddenCnt > 1 ? 's' : ''} hidden
            </div>
          )}
          {mNotes.length === 0 && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#475569', padding:'16px 0' }}>No care notes yet.</div>}
          {mNotes.map(n=>{
            const canEditNote = n.authorId === authUser.id;
            return (
            <div key={n.id} className="note-card"
              style={{ borderLeftColor:n.private?'#f59e0b':'#8b5cf6', cursor:'pointer', transition:'background .15s' }}
              onClick={()=>setSelNote(n)}
              onMouseEnter={e=>e.currentTarget.style.background='#161926'}
              onMouseLeave={e=>e.currentTarget.style.background=''}
            >
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7, flexWrap:'wrap', gap:5 }}>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontSize:16 }}>{NOTE_ICONS[n.type]}</span>
                  <span className="sc-tag" style={{ background:'#1e2336',color:'#94a3b8' }}>{n.type}</span>
                  {n.private && <span className="sc-tag" style={{ background:'#f59e0b22',color:'#f59e0b' }}>🔒</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#475569' }}>{fmtShort(n.date)} · {fmtTime(n.date)}</div>
                  {canEditNote && <button onClick={e=>{e.stopPropagation();setEditNote({id:n.id,type:n.type,content:n.content,isPrivate:n.private});}} style={{ background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#64748b',padding:'0 2px' }}>✏️</button>}
                </div>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13.5, lineHeight:1.7, color:'#cbd5e1',
                overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>
                {n.content}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#475569' }}>— {n.authorName} · {n.authorRole}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#334155' }}>Tap to read</div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderActivity = () => (
    <div>
      {notes.filter(n => canSeeNote(n)).slice(0, 30).map(n => {
        const m = members.find(x => x.id === n.memberId);
        return (
          <div key={n.id} style={{ display:'flex', gap:12, marginBottom:20 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div className="avatar" style={{ width:36, height:36, fontSize:11, background:n.authorColor+'22', color:n.authorColor }}>{n.authorAvatar}</div>
              <div style={{ width:1, flex:1, background:'#1e2336', marginTop:5 }} />
            </div>
            <div style={{ flex:1, paddingBottom:14, minWidth:0 }}>
              <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#e8e4d9' }}>{n.authorName}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#64748b' }}>· {n.type} ·</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#c4b5fd', cursor:'pointer' }} onClick={()=>m&&openM(m)}>{m?.name}</span>
                {n.private && <span className="sc-tag" style={{ background:'#f59e0b22', color:'#f59e0b', fontSize:10 }}>🔒</span>}
              </div>
              <div className="note-card" onClick={()=>setSelNote(n)}
                style={{ marginBottom:5, cursor:'pointer', transition:'background .15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='#161926'}
                onMouseLeave={e=>e.currentTarget.style.background=''}
              >
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.65, color:'#cbd5e1',
                  overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>
                  {n.content}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#334155', marginTop:6 }}>Tap to read</div>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#475569' }}>{fmt(n.date)} at {fmtTime(n.date)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTasks = () => (
    <div>
      {['urgent','high','medium','low'].map(pri => {
        const pt = tasks.filter(t => t.priority === pri && !t.done && (perms.canViewAllMembers || t.assignedTo === authUser.id));
        if (!pt.length) return null;
        return (
          <div key={pri} style={{ marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:PRI_COLOR[pri] }} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:PRI_COLOR[pri] }}>{pri}</span>
            </div>
            {pt.map(t => (
              <div key={t.id} className="task-row">
                <div onClick={()=>doToggleTask(t.id, t.done)} style={{ width:24, height:24, border:`2px solid ${PRI_COLOR[t.priority]}`, borderRadius:5, cursor:'pointer', flexShrink:0, marginTop:1 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13.5, fontWeight:500, color:'#e8e4d9' }}>{t.title}</div>
                  {t.memberName && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b', marginTop:2 }}>re: {t.memberName}</div>}
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b', marginTop:1 }}>→ {t.assignedTo==='all'?'👥 All Team Members':t.assigneeName} · Due {t.due || 'TBD'}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {tasks.filter(t => t.done).length > 0 && (
        <div style={{ opacity:.5 }}>
          <div className="lbl" style={{ marginBottom:10 }}>Completed</div>
          {tasks.filter(t => t.done).map(t => (
            <div key={t.id} className="task-row">
              <div onClick={()=>doToggleTask(t.id, t.done)} style={{ width:24, height:24, border:'2px solid #10b981', borderRadius:5, cursor:'pointer', background:'#10b981', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ color:'#fff', fontSize:12 }}>✓</span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#475569', textDecoration:'line-through' }}>{t.title}</div>
            </div>
          ))}
        </div>
      )}
      {tasks.filter(t => !t.done && (perms.canViewAllMembers || t.assignedTo === authUser.id)).length === 0 && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#475569', textAlign:'center', paddingTop:40 }}>✓ No open tasks!</div>
      )}
    </div>
  );

  const renderMilestones = () => (
    <div>
      {stones.length === 0 && <div style={{ fontFamily:"'DM Sans',sans-serif", color:'#475569', fontSize:13, paddingTop:20 }}>No milestones in the next 30 days.</div>}
      {stones.map((x, i) => (
        <div key={i} className="sc-card" style={{ display:'flex', gap:14, alignItems:'center', marginBottom:10, cursor:'pointer' }} onClick={()=>openM(x.member)}>
          <div style={{ fontSize:32 }}>{x.type.split(' ')[1]}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:'#e8e4d9' }}>{x.member.name}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#64748b' }}>{x.type.split(' ')[0]}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:x.days<=7?'#f59e0b':'#8b5cf6', lineHeight:1 }}>{x.days===0?'🎉':x.days}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#475569', textTransform:'uppercase' }}>{x.days===0?'Today':'days'}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReports = () => (
    <div>
      <div className="sc-card" style={{ marginBottom:14 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#e8e4d9', marginBottom:14 }}>Congregation Status</div>
        {Object.entries(STATUS_CFG).map(([key, val]) => {
          const cnt = visibleM.filter(m => m.status === key).length;
          const pct = visibleM.length ? Math.round(cnt/visibleM.length*100) : 0;
          return (
            <div key={key} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:val.color, fontWeight:600 }}>{val.label}</span>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:val.color, fontWeight:700 }}>{cnt} <span style={{ fontSize:12, color:'#475569' }}>({pct}%)</span></span>
              </div>
              <div style={{ height:7, background:'#1a1e2e', borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:val.color, borderRadius:4 }} />
              </div>
            </div>
          );
        })}
      </div>
      {perms.canViewAllMembers && team.filter(l => l.status === 'active').map(l => {
        const asgn = members.filter(m => m.assignedTo === l.id);
        const ln   = notes.filter(n => n.authorId === l.id);
        const lt   = tasks.filter(t => t.assignedTo === l.id && !t.done);
        return (
          <div key={l.id} className="sc-card" style={{ marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div className="avatar" style={{ width:38, height:38, fontSize:12, background:l.color+'22', color:l.color }}>{l.avatar}</div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#e8e4d9' }}>{l.name}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:ROLE_COLOR[l.role]||'#64748b' }}>{l.role}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, textAlign:'center' }}>
              {[{v:asgn.length,l:'Members'},{v:ln.length,l:'Notes'},{v:lt.length,l:'Tasks'}].map(s => (
                <div key={s.l} style={{ background:'#0f1117', borderRadius:9, padding:'10px 4px' }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:l.color }}>{s.v}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'.05em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Nav ──
  const NAV = [
    { id:'dashboard',  icon:'⌂',  label:'Home'    },
    { id:'members',    icon:'✦',  label:'People'  },
    { id:'tasks',      icon:'◻', label:'Tasks'   },
    { id:'milestones', icon:'◑',  label:'Events'  },
    { id:'reports',    icon:'◧',  label:'Reports' },
    { id:'activity',   icon:'◈',  label:'Feed'    },
  ];
  const isActive = id => page === id || (page === 'member' && id === 'members');

  const pageCfg = {
    dashboard:  { title:'Dashboard',     fab: perms.canEditMembers ? ()=>setPage('members') : null },
    members:    { title:'Congregation',  fab: perms.canEditMembers ? ()=>{ setMbrF({ name:'', phone:'', email:'', birthday:'', anniversary:'', address:'', groups:[], assignedTo:authUser.id, status:'active', gender:'', maritalStatus:'single', spouseName:'', spouseId:null, hasChildren:false, children:[], memberType:'member' }); setEditMember(null); setShowAddM(true); } : null },
    member:     { title:selMember?.name?.split(' ')[0]||'Member', fab: perms.canAddNotes ? ()=>setShowNote(true) : null },
    activity:   { title:'Activity Feed', fab: null },
    tasks:      { title:'Tasks',         fab: ()=>setShowTask(true) },
    milestones: { title:'Milestones',    fab: null },
    reports:    { title:'Reports',       fab: null },
  };
  const cfg = pageCfg[page] || pageCfg.dashboard;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', height:'100vh', width:'100vw', background:'#0f1117', color:'#e8e4d9', overflow:'hidden' }}>
      <style>{CSS}</style>

      {/* Fixed demo banner at top */}
      <div className="demo-banner">
        <span>🎮</span>
        <span>TRIAL DEMO · Your Church · ShepherdCare</span>
        <span style={{ opacity:.7, fontSize:11 }}>Sample data only · resets on refresh</span>
      </div>

      {/* Desktop Sidebar */}
      <aside className="sidebar" style={{ display:'none', paddingTop:44 }} id="desktop-sidebar">
        <div style={{ paddingLeft:8, marginBottom:26 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:'#c4b5fd' }}>✦ ShepherdCare</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#475569', marginTop:2 }}>Your Church · Trial</div>
        </div>
        <nav style={{ flex:1 }}>
          {NAV.map(i => (
            <div key={i.id} className={`nav-item ${isActive(i.id)?'active':''}`} onClick={()=>{ setSelMember(null); setPage(i.id); }}>
              <span style={{ fontSize:13, opacity:.8 }}>{i.icon}</span> {i.label}
            </div>
          ))}
          {perms.canManageTeam && <>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#1e2336', textTransform:'uppercase', letterSpacing:'.08em', padding:'8px 13px 4px', marginTop:8 }}>Admin</div>
            <div className="nav-item" onClick={()=>setShowAdmin(true)}><span style={{ fontSize:13 }}>⚙</span> Team Mgmt</div>
          </>}
        </nav>
        <a href="/ShepherdCare_Tutorial.html" target="_blank" rel="noreferrer" className="sc-btn sc-btn-secondary" style={{ width:'100%', marginBottom:8, justifyContent:'flex-start', padding:'10px 13px', gap:8, textDecoration:'none', display:'flex', alignItems:'center' }}>
          <span>📖</span><span style={{ fontSize:13, color:'#c4b5fd', fontWeight:700 }}>USER GUIDE</span>
        </a>
        <button onClick={()=>setShowSearch(true)} className="sc-btn sc-btn-secondary" style={{ width:'100%', marginBottom:10, justifyContent:'flex-start', padding:'10px 13px', gap:8 }}>
          <span>🔍</span><span style={{ fontSize:13, color:'#64748b' }}>Search…</span>
          <span style={{ marginLeft:'auto', fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#334155' }}>⌘K</span>
        </button>
        <div style={{ borderTop:'1px solid #141620', paddingTop:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, background:'#0d0f18' }}>
            <div className="avatar" style={{ width:32, height:32, fontSize:11, background:authUser.color+'33', color:authUser.color }}>{authUser.avatar}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:'#e8e4d9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{authUser.name.split(' ').slice(0,2).join(' ')}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:ROLE_COLOR[authUser.role]||'#64748b' }}>{authUser.role}</div>
            </div>
          </div>
          <button onClick={handleSignOut} style={{ width:'100%', marginTop:7, padding:'7px', background:'none', border:'1px solid #1e2336', borderRadius:7, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#8b5cf6', cursor:'pointer', fontWeight:600 }}>
            ← Switch Role
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', paddingTop:33 }}>
        {/* Mobile header */}
        <div className="app-header">
          {page === 'member'
            ? <button onClick={goBack} style={{ background:'none', border:'none', color:'#8b5cf6', fontFamily:"'DM Sans',sans-serif", fontSize:15, cursor:'pointer', padding:'4px 8px 4px 0', display:'flex', alignItems:'center', gap:4 }}>‹ Back</button>
            : <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:'#c4b5fd' }}>✦</div>
          }
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:'#e8e4d9', flex:1 }}>{cfg.title}</div>
          <a href="/ShepherdCare_Tutorial.html" target="_blank" rel="noreferrer"
            style={{ background:'#8b5cf622', border:'1.5px solid #8b5cf655', borderRadius:8, padding:'7px 14px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:'#c4b5fd', textDecoration:'none', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5, flexShrink:0, letterSpacing:'.03em' }}>
            📖 USER GUIDE
          </a>
          <button onClick={()=>setShowSearch(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:'8px', color:'#94a3b8', fontSize:20, lineHeight:1, display:'flex', alignItems:'center' }}>🔍</button>
          {perms.canManageTeam && <button onClick={()=>setShowAdmin(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:'8px', color:'#94a3b8', fontSize:18, lineHeight:1, display:'flex', alignItems:'center' }}>⚙</button>}
          <div className="avatar" style={{ width:32, height:32, fontSize:11, background:authUser.color+'33', color:authUser.color, cursor:'pointer' }} onClick={handleSignOut} title="Switch role">{authUser.avatar}</div>
        </div>

        {/* Role banner */}
        {!perms.canViewAllMembers && (
          <div style={{ background:'#1a1e2e', borderBottom:'1px solid #2a2d3a', padding:'8px 16px', fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ color:ROLE_COLOR[authUser.role] }}>●</span>
            {authUser.role} — showing {visibleM.length} assigned members
          </div>
        )}

        {/* Page */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 16px calc(72px + env(safe-area-inset-bottom,0px))' }}>
          {page === 'dashboard'  && renderDashboard()}
          {page === 'members'    && renderMembers()}
          {page === 'member'     && renderMemberDetail()}
          {page === 'activity'   && renderActivity()}
          {page === 'tasks'      && renderTasks()}
          {page === 'milestones' && renderMilestones()}
          {page === 'reports'    && renderReports()}
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav" style={{ paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 0px)' }}>
        {NAV.map(i => (
          <div key={i.id} className={`bnav-item ${isActive(i.id)?'active':''}`} onClick={()=>{ setSelMember(null); setPage(i.id); }}>
            <span className="bnav-icon">{i.icon}</span>{i.label}
          </div>
        ))}
      </nav>

      {/* FAB */}
      {cfg.fab && <button className="fab" onClick={cfg.fab}>{page==='member'?'✎':'+'}</button>}

      {/* Search */}
      {showSearch && <SearchOverlay members={visibleM} notes={notes} onSelect={openM} onClose={()=>setShowSearch(false)} />}

      {/* Note modal */}
      {showNote && perms.canAddNotes && (
        <div className="modal-overlay" onClick={()=>setShowNote(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#e8e4d9', marginBottom:16 }}>Add Care Note</div>
            <div style={{ background:'#8b5cf611', border:'1px solid #8b5cf633', borderRadius:9, padding:'8px 12px', marginBottom:14, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#c4b5fd' }}>
              🎮 Demo — this note will appear in the feed but won't persist after refresh
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="lbl">Type</label>
              <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:7 }}>
                {Object.entries(NOTE_ICONS).map(([t, i]) => (
                  <button key={t} onClick={()=>setNoteF({...noteF,type:t})} className="sc-btn"
                    style={{ padding:'8px 13px', fontSize:13, background:noteF.type===t?'#8b5cf622':'#1a1e2e', border:`1.5px solid ${noteF.type===t?'#8b5cf6':'#2a2d3a'}`, color:noteF.type===t?'#c4b5fd':'#64748b' }}>
                    {i} {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="lbl">Note</label>
              <textarea className="sc-input" style={{ marginTop:6, minHeight:100 }} placeholder="Care interaction details, prayer requests…" value={noteF.content} onChange={e=>setNoteF({...noteF,content:e.target.value})} />
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, cursor:'pointer' }}>
              <input type="checkbox" checked={noteF.isPrivate} onChange={e=>setNoteF({...noteF,isPrivate:e.target.checked})} style={{ width:18, height:18, accentColor:'#8b5cf6' }} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#94a3b8' }}>🔒 Mark as private</span>
            </label>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={doAddNote} className="sc-btn sc-btn-primary" style={{ flex:1 }}>Save Note</button>
              <button onClick={()=>setShowNote(false)} className="sc-btn sc-btn-secondary" style={{ padding:'13px 18px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Task modal */}
      {showTask && (
        <div className="modal-overlay" onClick={()=>setShowTask(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#e8e4d9', marginBottom:16 }}>Create Task</div>
            <div style={{ background:'#8b5cf611', border:'1px solid #8b5cf633', borderRadius:9, padding:'8px 12px', marginBottom:14, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#c4b5fd' }}>
              🎮 Demo — task will appear in the list but won't persist after refresh
            </div>
            {[
              {l:'Description', el:<input className="sc-input" placeholder="e.g. Follow-up call after hospital visit" value={taskF.title} onChange={e=>setTaskF({...taskF,title:e.target.value})} />},
              {l:'Due Date',    el:<div style={{ position:'relative' }}><input className="sc-input" style={{ paddingRight: taskF.due ? 40 : 12 }} type="date" value={taskF.due} onChange={e=>setTaskF({...taskF,due:e.target.value})} />{taskF.due && <button onClick={()=>setTaskF({...taskF,due:''})} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:16, lineHeight:1, padding:2 }}>✕</button>}</div>},
              {l:'Assign To',  el:<select className="sc-input" value={taskF.assignedTo} onChange={e=>setTaskF({...taskF,assignedTo:e.target.value})}>{team.filter(l=>l.status==='active').map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>},
              {l:'Priority',   el:<select className="sc-input" value={taskF.priority} onChange={e=>setTaskF({...taskF,priority:e.target.value})}>{['urgent','high','medium','low'].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select>},
            ].map(f => (
              <div key={f.l} style={{ marginBottom:13 }}>
                <label className="lbl">{f.l}</label>
                <div style={{ marginTop:6 }}>{f.el}</div>
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:6 }}>
              <button onClick={doAddTask} className="sc-btn sc-btn-primary" style={{ flex:1 }}>Create Task</button>
              <button onClick={()=>setShowTask(false)} className="sc-btn sc-btn-secondary" style={{ padding:'13px 18px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member modal */}
      {(showAddM || editMember) && perms.canEditMembers && (
        <div className="modal-overlay" onClick={()=>{ setShowAddM(false); setEditMember(null); }}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#e8e4d9', marginBottom:16 }}>
              {editMember ? `✏️ Edit — ${editMember.name}` : 'Add Member'}
            </div>
            <div style={{ background:'#8b5cf611', border:'1px solid #8b5cf633', borderRadius:9, padding:'8px 12px', marginBottom:14, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#c4b5fd' }}>
              🎮 Demo — changes won't persist after refresh
            </div>
            {[{l:'Full Name *',k:'name',t:'text',p:'First and Last Name'},{l:'Phone',k:'phone',t:'tel',p:'555-0100'},{l:'Email',k:'email',t:'email',p:'name@email.com'},{l:'Address',k:'address',t:'text',p:'123 Main St'}].map(f=>(
              <div key={f.k} style={{ marginBottom:11 }}>
                <label className="lbl">{f.l}</label>
                <input className="sc-input" style={{ marginTop:5 }} type={f.t} placeholder={f.p} value={mbrF[f.k]} onChange={e=>setMbrF({...mbrF,[f.k]:e.target.value})} />
              </div>
            ))}

            {/* Birthday & Anniversary - Month + Day only */}
            {[{l:'Birthday',k:'birthday'},{l:'Anniversary',k:'anniversary'}].map(f=>{
              const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
              const val = mbrF[f.k] || '';
              const saved = val.match(/^(\d{2})-(\d{2})$/);
              const mm = saved ? saved[1] : '';
              const dd = saved ? saved[2] : '';
              const daysInMonth = mm ? new Date(2000, parseInt(mm), 0).getDate() : 31;
              return (
                <div key={f.k} style={{ marginBottom:11 }}>
                  <label className="lbl">{f.l}</label>
                  <div style={{ display:'flex', gap:8, marginTop:5, alignItems:'center' }}>
                    <select className="sc-input" style={{ flex:2 }} value={mm}
                      onChange={e=>{
                        const newMm = e.target.value;
                        setMbrF({...mbrF, [f.k]: newMm ? (dd ? `${newMm}-${dd}` : `${newMm}-01`) : ''});
                      }}>
                      <option value="">Month</option>
                      {MONTHS.map((m,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
                    </select>
                    <select className="sc-input" style={{ flex:1 }} value={dd}
                      onChange={e=>setMbrF({...mbrF, [f.k]: mm ? `${mm}-${e.target.value}` : ''})}
                      disabled={!mm}>
                      <option value="">Day</option>
                      {Array.from({length:daysInMonth},(_,i)=><option key={i+1} value={String(i+1).padStart(2,'0')}>{i+1}</option>)}
                    </select>
                    {val && (
                      <button onClick={()=>setMbrF({...mbrF,[f.k]:''})}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:16, lineHeight:1, padding:'0 4px', flexShrink:0 }}>✕</button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Member Type */}
            <div style={{ marginBottom:11 }}>
              <label className="lbl">Member Type</label>
              <select className="sc-input" style={{ marginTop:5 }} value={mbrF.memberType} onChange={e=>setMbrF({...mbrF, memberType:e.target.value})}>
                <option value="member">Member</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>

            <div style={{ marginBottom:11 }}>
              <label className="lbl">Gender</label>
              <select className="sc-input" style={{ marginTop:5 }} value={mbrF.gender} onChange={e=>setMbrF({...mbrF,gender:e.target.value})}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div style={{ marginBottom:11 }}>
              <label className="lbl">Marital Status</label>
              <select className="sc-input" style={{ marginTop:5 }} value={mbrF.maritalStatus} onChange={e=>setMbrF({...mbrF,maritalStatus:e.target.value,spouseName:e.target.value!=='married'?'':mbrF.spouseName,spouseId:e.target.value!=='married'?null:mbrF.spouseId})}>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
            {mbrF.maritalStatus === 'married' && (
              <div style={{ marginBottom:11 }}>
                <label className="lbl">Spouse Name</label>
                <input className="sc-input" style={{ marginTop:5 }} type="text" placeholder="Search congregation..." value={mbrF.spouseName}
                  onChange={e=>setMbrF({...mbrF,spouseName:e.target.value,spouseId:null})} />
                {mbrF.spouseName.length > 1 && (() => {
                  const matches = members.filter(m => m.name.toLowerCase().includes(mbrF.spouseName.toLowerCase()) && (!editMember || m.id !== editMember.id)).slice(0,4);
                  return matches.length > 0 ? (
                    <div style={{ background:'#1a1e2e', border:'1px solid #2a2d3a', borderRadius:8, marginTop:4 }}>
                      {matches.map(m => (
                        <div key={m.id} onClick={()=>setMbrF({...mbrF,spouseName:m.name,spouseId:m.id})}
                          style={{ padding:'9px 13px', fontFamily:"'DM Sans',sans-serif", fontSize:13, color:mbrF.spouseId===m.id?'#c4b5fd':'#e8e4d9', cursor:'pointer', borderBottom:'1px solid #2a2d3a', background:mbrF.spouseId===m.id?'#8b5cf611':'transparent' }}>
                          {m.name} {mbrF.spouseId===m.id && '✓'}
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            <div style={{ marginBottom:16 }}>
              <label className="lbl">Children</label>
              <button onClick={()=>setMbrF({...mbrF,hasChildren:!mbrF.hasChildren})} className="sc-btn"
                style={{ marginTop:7, padding:'9px 16px', fontSize:13, background:mbrF.hasChildren?'#10b98122':'#1a1e2e', border:`1.5px solid ${mbrF.hasChildren?'#10b981':'#2a2d3a'}`, color:mbrF.hasChildren?'#10b981':'#64748b', borderRadius:10 }}>
                {mbrF.hasChildren ? '✓ Has Children' : 'Has Children?'}
              </button>
            </div>
            <div style={{ marginBottom:11 }}>
              <label className="lbl">Assign To</label>
              <select className="sc-input" style={{ marginTop:5 }} value={mbrF.assignedTo} onChange={e=>setMbrF({...mbrF,assignedTo:e.target.value})}>
                {team.filter(l=>l.status==='active').map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <label className="lbl">Groups</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:7 }}>
                {ALL_GROUPS.map(g => {
                  const sel = mbrF.groups.includes(g);
                  return <button key={g} onClick={()=>setMbrF({...mbrF,groups:sel?mbrF.groups.filter(x=>x!==g):[...mbrF.groups,g]})} className="sc-btn" style={{ padding:'7px 13px', borderRadius:20, fontSize:13, background:sel?'#8b5cf622':'#1a1e2e', border:`1.5px solid ${sel?'#8b5cf6':'#2a2d3a'}`, color:sel?'#c4b5fd':'#64748b' }}>{g}</button>;
                })}
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={editMember ? doEditMbr : doAddMbr} className="sc-btn sc-btn-primary" style={{ flex:1 }}>
                {editMember ? '💾 Save Changes' : 'Add Member'}
              </button>
              <button onClick={()=>{ setShowAddM(false); setEditMember(null); }} className="sc-btn sc-btn-secondary" style={{ padding:'13px 18px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Children modal */}
      {showChildren && (
        <div className="modal-overlay" onClick={()=>setShowChildren(null)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#e8e4d9' }}>👶 {showChildren.name}'s Children</div>
              <button onClick={()=>setShowChildren(null)} className="sc-btn sc-btn-secondary sc-btn-sm">✕</button>
            </div>
            {(showChildren.children||[]).length === 0 && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#64748b', marginBottom:16, textAlign:'center', padding:'14px' }}>No children added yet.</div>
            )}
            {(showChildren.children||[]).map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 13px', background:'#0f1117', borderRadius:10, marginBottom:7, border:'1px solid #1a1d2e' }}>
                <div style={{ fontSize:22 }}>👶</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:'#e8e4d9' }}>{c.name}</div>
                  {c.birthday && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#64748b', marginTop:2 }}>🎂 {fmt(c.birthday)}</div>}
                </div>
                {perms.canEditMembers && (
                  <button onClick={()=>doDeleteChild(showChildren, c.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:16, padding:4 }}>🗑</button>
                )}
              </div>
            ))}
            {perms.canEditMembers && (
              <div style={{ marginTop:14, padding:'14px', background:'#1a1e2e', borderRadius:10, border:'1px solid #2a2d3a' }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#c4b5fd', marginBottom:10 }}>+ Add Child</div>
                <div style={{ marginBottom:10 }}>
                  <label className="lbl">Name *</label>
                  <input className="sc-input" style={{ marginTop:5 }} type="text" placeholder="Child's name" value={childF.name} onChange={e=>setChildF({...childF,name:e.target.value})} />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label className="lbl">Birthday</label>
                  <input className="sc-input" style={{ marginTop:5 }} type="date" value={childF.birthday} onChange={e=>setChildF({...childF,birthday:e.target.value})} />
                </div>
                <button onClick={()=>doSaveChild(showChildren)} className="sc-btn sc-btn-primary" style={{ width:'100%' }}>Add Child</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin panel */}
      {showAdmin && perms.canManageTeam && (
        <AdminPanel team={team} setTeam={setTeam} currentUser={authUser} onClose={()=>setShowAdmin(false)} showToast={showToast} />
      )}

      {/* Delete confirm */}
      {/* ── Note Detail Modal ── */}
      {selNote && (() => {
        const n = selNote;
        const canEditNote = n.authorId === authUser.id;
        return (
          <div className="modal-overlay" onClick={()=>setSelNote(null)}>
            <div className="modal-sheet" onClick={e=>e.stopPropagation()} style={{ maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
              <div className="modal-handle" />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexShrink:0 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:20 }}>{NOTE_ICONS[n.type]}</span>
                  <span className="sc-tag" style={{ background:'#1e2336', color:'#94a3b8', fontSize:13 }}>{n.type}</span>
                  {n.private && <span className="sc-tag" style={{ background:'#f59e0b22', color:'#f59e0b' }}>🔒 Private</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {canEditNote && (
                    <button onClick={()=>{ setSelNote(null); setEditNote({ id:n.id, type:n.type, content:n.content, isPrivate:n.private }); }}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, color:'#64748b', padding:'2px 6px' }}>✏️</button>
                  )}
                  <button onClick={()=>setSelNote(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#64748b', lineHeight:1 }}>✕</button>
                </div>
              </div>
              <div style={{ overflowY:'auto', flex:1, paddingRight:4 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#475569', marginBottom:14 }}>
                  {fmtShort(n.date)} · {fmtTime(n.date)}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, lineHeight:1.8, color:'#e2e8f0', marginBottom:16, background:'#0d1117', borderRadius:10, padding:'14px 16px' }}>
                  {n.content}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'10px 14px', background:'#131722', borderRadius:10 }}>
                  <div className="avatar" style={{ width:34, height:34, fontSize:11, background:n.authorColor+'22', color:n.authorColor }}>{n.authorAvatar}</div>
                  <div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:'#e8e4d9' }}>{n.authorName}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:n.authorColor }}>{n.authorRole}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Edit Note Modal ── */}
      {editNote && (
        <div className="modal-overlay" onClick={()=>setEditNote(null)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#e8e4d9', marginBottom:16 }}>Edit Care Note</div>
            <div style={{ marginBottom:14 }}>
              <label className="lbl">Type</label>
              <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:7 }}>
                {Object.entries(NOTE_ICONS).map(([t,i])=>(
                  <button key={t} onClick={()=>setEditNote({...editNote,type:t})} className="sc-btn"
                    style={{ padding:'8px 13px',fontSize:13,background:editNote.type===t?'#8b5cf622':'#1a1e2e',border:`1.5px solid ${editNote.type===t?'#8b5cf6':'#2a2d3a'}`,color:editNote.type===t?'#c4b5fd':'#64748b' }}>{i} {t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="lbl">Note</label>
              <textarea className="sc-input" style={{ marginTop:6,minHeight:120 }} value={editNote.content} onChange={e=>setEditNote({...editNote,content:e.target.value})} />
            </div>
            <label style={{ display:'flex',alignItems:'center',gap:10,marginBottom:18,cursor:'pointer' }}>
              <input type="checkbox" checked={editNote.isPrivate} onChange={e=>setEditNote({...editNote,isPrivate:e.target.checked})} style={{ width:18,height:18,accentColor:'#8b5cf6' }} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#94a3b8' }}>🔒 Private</span>
            </label>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={doEditNote} className="sc-btn sc-btn-primary" style={{ flex:1 }}>💾 Save Changes</button>
              <button onClick={()=>setEditNote(null)} className="sc-btn sc-btn-secondary" style={{ padding:'13px 18px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={()=>setConfirmDelete(null)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()} style={{ maxWidth:420 }}>
            <div className="modal-handle" />
            <div style={{ textAlign:'center', padding:'10px 0 20px' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#e8e4d9', marginBottom:8 }}>Remove Member?</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:'#64748b', lineHeight:1.6, marginBottom:24 }}>
                <strong style={{ color:'#e8e4d9' }}>{confirmDelete.name}</strong> will be removed from this demo session.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={doDeleteMember} className="sc-btn" style={{ flex:1, padding:'13px', background:'#ef4444', color:'#fff', fontSize:14, fontWeight:600, borderRadius:10 }}>Yes, Remove</button>
                <button onClick={()=>setConfirmDelete(null)} className="sc-btn sc-btn-secondary" style={{ flex:1, padding:'13px' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="sc-toast">{toast}</div>}
    </div>
  );
}
