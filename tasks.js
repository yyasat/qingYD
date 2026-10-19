'use strict';
/* ============================================================
   运动项目编辑
   ============================================================ */
const CATS=['跳绳','燃脂操','薄背','核心','手臂','拉伸','瘦全身'];
const TYPES=[['jump','跳绳'],['aerobic','燃脂操/有氧'],['back','薄背'],['core','核心'],['arm','手臂'],['stretch','拉伸'],['other','其他']];
function openTaskSheet(id){
  const day=ensureToday();
  const t=id?day.tasks.find(x=>x.id===id):null;
  $('#sheet-body').innerHTML=`
    <h2>${t?'调整运动':'添加运动'}</h2>
    <div class="field"><label>名称</label><input class="inp" id="ts-n" value="${t?esc(t.name):''}" placeholder="例如：跳绳 45秒 × 10"></div>
    <div class="row2">
      <div class="field"><label>分类</label><select class="inp" id="ts-c">${CATS.map(c=>`<option ${t&&t.cat===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>时长 (分钟)</label><input class="inp" id="ts-d" type="number" inputmode="numeric" value="${t?t.dur:15}"></div>
    </div>
    <div class="field"><label>图标类型</label><select class="inp" id="ts-t">${TYPES.map(([v,n])=>`<option value="${v}" ${t&&t.type===v?'selected':''}>${n}</option>`).join('')}</select></div>
    <button class="btn w" id="ts-ok">${t?'保存':'添加'}</button>
    ${t?`<button class="btn w ghost sm" id="ts-del" style="margin-top:9px;color:var(--clay)">删除此项</button>`:''}`;
  openSheet();
  $('#ts-ok').onclick=()=>{
    const n=$('#ts-n').value.trim(); if(!n) return toast(null,'请输入名称','','close');
    const o={name:n,cat:$('#ts-c').value,dur:Math.max(1,parseInt($('#ts-d').value)||10),type:$('#ts-t').value};
    if(t) Object.assign(t,o); else day.tasks.push({id:uid(),done:false,...o});
    save(); closeSheet(); renderToday();
  };
  const dl=$('#ts-del'); if(dl) dl.onclick=()=>{ delTask(t.id); closeSheet() };
}
$('#btn-add-task').addEventListener('click',()=>openTaskSheet());
$('#btn-load-plan').addEventListener('click',()=>{
  const k=TODAY_KEY(), day=ensureToday();
  const doneNames=day.tasks.filter(t=>t.done).map(t=>t.name);
  day.tasks=buildPlan(k).map(t=>({...t,done:doneNames.includes(t.name)}));
  day.loaded=true; save(); renderToday();
  toast(null,'已载入',`${WD[wdIdx(parseD(k))]} · ${PLAN.phases[phaseOf()].name}`,'list');
});