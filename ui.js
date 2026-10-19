'use strict';
/* ============================================================
   导航 / 弹层 / Toast
   ============================================================ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const VIEWS=[
  {id:'v-today',ic:'today',n:'今日'},
  {id:'v-cal',ic:'cal',n:'日历'},
  {id:'v-weight',ic:'scale',n:'体重'},
  {id:'v-food',ic:'food',n:'饮食',opt:'food'},
  {id:'v-me',ic:'me',n:'我的'}
];
let curView='v-today';
function buildNav(){
  const list=VIEWS.filter(v=>!v.opt||S.settings[v.opt]);
  $('#nav').innerHTML=list.map(v=>`<button data-v="${v.id}" class="${v.id===curView?'on':''}">${I[v.ic](21)}<span>${v.n}</span></button>`).join('');
  $$('#nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
  if(!list.some(v=>v.id===curView)) go('v-today');
}
function go(id){
  curView=id;
  $$('.view').forEach(v=>v.classList.toggle('on',v.id===id));
  $$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===id));
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='v-cal')renderCal();
  if(id==='v-weight')renderWeight();
  if(id==='v-food')renderFood();
  if(id==='v-me')renderMe();
  if(id==='v-today')renderToday();
}

function openSheet(){ $('#scrim').classList.add('on'); $('#sheet').classList.add('on'); document.body.style.overflow='hidden' }
function closeSheet(){ $('#scrim').classList.remove('on'); $('#sheet').classList.remove('on'); document.body.style.overflow='' }
$('#scrim').addEventListener('click',closeSheet);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ closeSheet(); closeReveal() }
});
// 下拉关闭
(()=>{
  let y0=null;
  const sh=$('#sheet');
  sh.addEventListener('touchstart',e=>{ if(sh.scrollTop<=0) y0=e.touches[0].clientY },{passive:true});
  sh.addEventListener('touchmove',e=>{
    if(y0===null) return;
    const dy=e.touches[0].clientY-y0;
    if(dy>0) sh.style.transform=`translateY(${dy*.6}px)`;
  },{passive:true});
  sh.addEventListener('touchend',e=>{
    if(y0===null) return;
    const dy=(e.changedTouches[0].clientY-y0);
    sh.style.transform='';
    if(dy>110) closeSheet();
    y0=null;
  });
})();

function toast(_,title,msg,ic){
  if(!S.settings.cheer && ic!=='close') { if(ic!=='check'&&ic!=='scale'&&ic!=='list') return }
  const el=document.createElement('div');
  el.className='toast';
  el.innerHTML=`<div class="ti">${(I[ic]||I.spark)(17)}</div><div><b>${title}</b>${msg?`<p>${msg}</p>`:''}</div>`;
  $('#toasts').appendChild(el);
  setTimeout(()=>el.remove(),3900);
}

function renderAll(){
  renderToday();
  if(curView==='v-cal')renderCal();
  if(curView==='v-weight')renderWeight();
  if(curView==='v-food')renderFood();
  if(curView==='v-me')renderMe();
}