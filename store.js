'use strict';
/* ============================================================
   数据层
   ============================================================ */
const KEY = 'qing.fitness.v1';
const TODAY_KEY = () => fmt(new Date());

function fmt(d){const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
function parseD(s){const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function wdIdx(d){return (d.getDay()+6)%7} // 0=周一

/* —— 锻炼数据：严格按用户给定表格，禁止改动 —— */
const PLAN = {
  // 7天计划表，三阶段
  week: [
    {wd:'周一', p:[
      [['跳绳 30秒 × 8','jump','跳绳',10],['低强度操 15分钟','aerobic','燃脂操',15],['薄背','back','薄背',12]],
      [['跳绳 45秒 × 10','jump','跳绳',13],['操 20分钟','aerobic','燃脂操',20],['薄背','back','薄背',15]],
      [['跳绳 1分钟 × 10','jump','跳绳',15],['燃脂操 30分钟','aerobic','燃脂操',30],['薄背','back','薄背',18]]
    ]},
    {wd:'周二', p:[
      [['低强度操 20分钟','aerobic','燃脂操',20],['薄背','back','薄背',12],['核心','core','核心',8]],
      [['中低强度操 25分钟','aerobic','燃脂操',25],['薄背','back','薄背',15],['核心','core','核心',10]],
      [['帕梅拉 30分钟','aerobic','燃脂操',30],['薄背','back','薄背',18],['核心','core','核心',12]]
    ]},
    {wd:'周三', p:[
      [['低强度操 15分钟','aerobic','燃脂操',15],['拉伸','stretch','拉伸',10]],
      [['跳绳 45秒 × 8','jump','跳绳',10],['拉伸','stretch','拉伸',10]],
      [['跳绳 1分钟 × 8','jump','跳绳',12],['拉伸','stretch','拉伸',12]]
    ]},
    {wd:'周四', p:[
      [['跳绳 30秒 × 8','jump','跳绳',10],['薄背','back','薄背',12],['核心','core','核心',8]],
      [['跳绳 45秒 × 10','jump','跳绳',13],['薄背','back','薄背',15],['核心','core','核心',10]],
      [['跳绳 1分钟 × 10','jump','跳绳',15],['薄背','back','薄背',18],['核心','core','核心',12]]
    ]},
    {wd:'周五', p:[
      [['低强度操 20分钟','aerobic','燃脂操',20],['薄背','back','薄背',12]],
      [['中低强度操 25分钟','aerobic','燃脂操',25],['薄背','back','薄背',15]],
      [['刘畊宏 30分钟','aerobic','燃脂操',30],['薄背','back','薄背',18]]
    ]},
    {wd:'周六', p:[
      [['跳绳 30秒 × 8','jump','跳绳',10],['手臂','arm','手臂',10],['拉伸','stretch','拉伸',10]],
      [['跳绳 45秒 × 10','jump','跳绳',13],['手臂','arm','手臂',12],['拉伸','stretch','拉伸',10]],
      [['跳绳 1分钟 × 12','jump','跳绳',18],['手臂','arm','手臂',14],['拉伸','stretch','拉伸',12]]
    ]},
    {wd:'周日', p:[
      [['低强度操 15分钟','aerobic','燃脂操',15],['拉伸','stretch','拉伸',10]],
      [['低强度操 20分钟','aerobic','燃脂操',20],['拉伸','stretch','拉伸',10]],
      [['燃脂操 30分钟','aerobic','燃脂操',30],['拉伸','stretch','拉伸',12]]
    ]}
  ],
  // 薄背每天必做（无器械）
  backDaily: [
    ['靠墙站',['2分钟','3分钟','3分钟']],
    ['肩胛骨后缩',['3×15','3×20','4×20']],
    ['俯身飞鸟',['3×15','3×20','4×20']],
    ['面拉（徒手慢做）',['3×15','3×20','4×20']],
    ['拉伸斜方肌',['每边30秒','每边40秒','每边1分钟']],
    ['拉伸胸肌',['每边30秒','每边40秒','每边1分钟']]
  ],
  phases: [
    {name:'第1阶段',range:'现在 – 第2周',desc:'跳绳30秒跳/30秒休×8–10；低强度操15–20分钟；薄背：靠墙站、肩胛骨后缩、俯身飞鸟。每天动，低强度日算恢复。'},
    {name:'第2阶段',range:'第3–4周',desc:'跳绳45秒跳/30秒休×10；低强度操20分钟或中低强度燃脂操；薄背加弹力带（没有就徒手慢动作）。可连续跳2天，第3天低强度。'},
    {name:'第3阶段',range:'第2个月起',desc:'跳绳1分钟跳/30秒休×10–12；帕梅拉全身燃脂30分钟或刘畊宏30分钟；薄背：面拉、划船、俯身飞鸟，次数增加。可每天动，至少1天只拉伸。'}
  ],
  upgradeSignals: [
    ['跳完30秒不喘了','可以加到45秒'],
    ['45秒也不累了','可以加到1分钟'],
    ['低强度操做完没感觉','换中低强度'],
    ['走5层楼不累了','可以进第2阶段']
  ],
  goals: [['每天动 + 少奶茶','52.3–53.3kg'],['每天动 + 饮食照旧','53.3–54.3kg']]
};

const ICON_MAP = {jump:'rope',aerobic:'aerobic',back:'back',core:'core',stretch:'stretch',arm:'arm',other:'spark'};
const TYPE_TAG = {'跳绳':'c3','燃脂操':'','薄背':'c1','核心':'c2','手臂':'c1','拉伸':'c2','瘦全身':''};

const DEFAULT = {
  profile:{name:'',gender:'',age:'',height:'',weight:54.8,birthday:'',shape:'',startWeight:54.8,avatar:'',weightUnit:'kg'},
  settings:{theme:'auto',food:false,cheer:true,quiz:true,mile:7,goal:52.8,kcal:1500,autoAdjust:true,phase:0,checkinsPerDay:1,planMode:'original'},
  days:{},        // 'YYYY-MM-DD': {tasks:[{id,name,type,dur,done,timerMode,customDur,actualTime}], customTasks:[], totalTimer:{start,end,elapsed}, taskTimers:{}, checkins:[], reflection:'', mood:null, energy:null, soreness:null, note:'', videos:[]}
  weights:{},     // 'YYYY-MM-DD': number
  meals:{},       // 'YYYY-MM-DD': {items:[{id,slot,name,kcal}], water:0}
  tickets:{},     // 'YYYY-MM-DD': [{id,timestamp,quote,weightLoss}]
  quotes:[],      // 用户自定义励志语录
  meta:{lastMile:0, seenMiles:[], installed:fmt(new Date())},
  activeTimers:{} // 运行中的计时器状态
};

// 兼容旧内核：用 JSON 深拷贝替代 structuredClone
const clone = o => JSON.parse(JSON.stringify(o));
let S = load();
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return clone(DEFAULT);
    const d = JSON.parse(raw);
    return deepMerge(clone(DEFAULT), d);
  }catch(e){ return clone(DEFAULT) }
}
function deepMerge(base, over){
  for(const k in over){
    if(over[k] && typeof over[k]==='object' && !Array.isArray(over[k]) && base[k] && typeof base[k]==='object' && !Array.isArray(base[k])){
      deepMerge(base[k], over[k]);
    } else if(over[k]!==undefined){ base[k]=over[k] }
  }
  return base;
}
let saveTimer;
function save(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{ try{localStorage.setItem(KEY, JSON.stringify(S))}catch(e){} }, 120);
}
const uid = () => Math.random().toString(36).slice(2,9);
const esc = s => (s||'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* ============================================================
   计划生成
   ============================================================ */
function phaseOf(){ return Math.min(2, Math.max(0, S.settings.phase|0)) }

function buildPlan(dateStr){
  const d = parseD(dateStr), wi = wdIdx(d), ph = phaseOf();
  const items = PLAN.week[wi].p[ph];
  return items.map(([name,type,cat,dur])=>({
    id:uid(),
    name,
    type,
    cat,
    dur,
    done:false,
    timerMode:'preset',
    customDur:null,
    actualTime:0,
    hasJump:false,      // 4.2.1 跳跃属性
    howTo:'',           // 4.1.1 动作详情
    videoUrl:''         // 预留视频链接
  }));
}
function getDay(dateStr, create=false){
  let day = S.days[dateStr];
  if(!day && create){
    day = S.days[dateStr] = {
      tasks:[],
      customTasks:[],     // 自拟计划动作
      totalTimer:null,
      taskTimers:{},
      checkins:[],        // 打卡记录
      reflection:'',      // 今日感悟
      mood:null,
      energy:null,
      soreness:null,
      note:'',
      adj:0
    };
  }
  return day;
}
function ensureToday(){
  const k = TODAY_KEY();
  let day = getDay(k, true);
  if(!day.tasks.length && !day.loaded){
    day.tasks = buildPlan(k);
    day.loaded = true;
    save();
  }
  return day;
}
function dayStat(dateStr){
  const d = S.days[dateStr];
  if(!d || !d.tasks || !d.tasks.length) return {done:0,total:0,full:false,any:false};
  const done = d.tasks.filter(t=>t.done).length;
  return {done,total:d.tasks.length,full:done===d.tasks.length,any:done>0};
}
function streak(){
  let n=0, cur=new Date();
  // 今天未完成不中断，从昨天算起
  if(!dayStat(fmt(cur)).full) cur = addDays(cur,-1);
  while(dayStat(fmt(cur)).full){ n++; cur = addDays(cur,-1) }
  if(dayStat(TODAY_KEY()).full && n===0) n=1;
  else if(dayStat(TODAY_KEY()).full && !dayStat(fmt(addDays(new Date(),-1))).full) n=1;
  return n;
}
function totalDays(){ return Object.keys(S.days).filter(k=>dayStat(k).full).length }
