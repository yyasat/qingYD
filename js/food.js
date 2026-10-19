'use strict';
/* ============================================================
   饮食
   ============================================================ */
const SLOTS=[['早餐','bowl'],['午餐','food'],['晚餐','apple'],['加餐','coffee']];
let mealSlot=0;
function todayMeal(){
  const k=TODAY_KEY();
  if(!S.meals[k]) S.meals[k]={items:[],water:0};
  return S.meals[k];
}
function renderFood(){
  const m=todayMeal(), lim=+S.settings.kcal;
  const total=m.items.reduce((a,x)=>a+(+x.kcal||0),0);
  const pct=Math.min(100, lim?total/lim*100:0);
  $('#f-sub').textContent=`今日 ${total} / ${lim} kcal`;
  $('#btn-food-add').innerHTML=I.plus(19);

  const bySlot=SLOTS.map(([n],i)=>m.items.filter(x=>x.slot===i));
  const cur=bySlot[mealSlot];

  $('#food-body').innerHTML=`
    <div class="card">
      <div class="card-h"><h2>${I.flame(15)} 今日热量</h2>
        <span class="fs12 ${total>lim?'':'muted'}" style="font-weight:650;${total>lim?'color:var(--clay)':''}">${total>lim?`超出 ${total-lim}`:`剩余 ${lim-total}`} kcal</span></div>
      <div class="kcal-bar ${total>lim?'over':''}"><i style="width:${pct}%"></i></div>
      <div style="display:flex;justify-content:space-between" class="fs12 muted"><span>0</span><span>${lim} kcal</span></div>
      <div class="stat-row" style="margin-top:14px">
        ${SLOTS.map(([n],i)=>`<div class="stat" style="padding:10px 6px"><b style="font-size:15px">${bySlot[i].reduce((a,x)=>a+(+x.kcal||0),0)}</b><span>${n}</span></div>`).slice(0,3).join('')}
      </div>
    </div>

    <div class="card">
      <div class="meal-tabs">${SLOTS.map(([n,ic],i)=>`<button class="meal-tab ${i===mealSlot?'on':''}" data-slot="${i}">${n}</button>`).join('')}</div>
      ${cur.length? cur.map(x=>`<div class="food">
          <div class="fi">${I[SLOTS[x.slot][1]](17)}</div>
          <div style="flex:1"><b>${esc(x.name)}</b><span>${SLOTS[x.slot][0]}</span></div>
          <div class="fk">${x.kcal||0} kcal</div>
          <button class="mini-btn" data-fdel="${x.id}" aria-label="删除">${I.trash(15)}</button>
        </div>`).join('')
        : `<div class="empty" style="padding:26px 10px">${I.bowl(30)}<p>${SLOTS[mealSlot][0]}还没有记录</p></div>`}
      <button class="btn w soft sm" id="f-quick" style="margin-top:12px">${I.plus(15)} 添加到${SLOTS[mealSlot][0]}</button>
    </div>

    <div class="card">
      <div class="card-h"><h2>${I.water(15)} 饮水</h2><span class="fs12 muted" style="font-weight:650">${m.water} / 8 杯</span></div>
      <div class="water-row">${Array.from({length:8},(_,i)=>`<div class="cup ${i<m.water?'on':''}" data-cup="${i+1}"></div>`).join('')}</div>
      <p class="fs12 muted" style="margin:12px 0 0">每杯约 250ml。少奶茶，多水，就是计划里那句「少奶茶」。</p>
    </div>

    <div class="sec-title">提示</div>
    <div class="card flat">
      ${PLAN.goals.map(([a,b])=>`<div class="setting-row"><div><div class="sl" style="font-size:13px">${a}</div></div><b class="fs12" style="color:var(--accent)">${b}</b></div>`).join('')}
      <p class="fs12 muted" style="margin:12px 0 0;line-height:1.6">到 10月28日目标：现在 54.8kg。两条路径的差别，基本就在奶茶上。</p>
    </div>`;

  $$('[data-slot]').forEach(b=>b.onclick=()=>{mealSlot=+b.dataset.slot;renderFood()});
  $('#f-quick').onclick=()=>openFoodSheet(mealSlot);
  $$('[data-fdel]').forEach(b=>b.onclick=()=>{
    m.items=m.items.filter(x=>x.id!==b.dataset.fdel); save(); renderFood();
  });
  $$('[data-cup]').forEach(c=>c.onclick=()=>{
    const n=+c.dataset.cup;
    m.water = m.water===n ? n-1 : n;
    save(); renderFood();
    if(m.water>=8) toast(null,'饮水达标','8 杯水完成，身体会轻一点。','water');
  });
}
$('#btn-food-add').addEventListener('click',()=>openFoodSheet(mealSlot));

const PRESET=[['米饭 1碗',200],['鸡蛋 1个',75],['牛奶 250ml',130],['鸡胸肉 100g',165],['苹果 1个',95],['全麦面包 1片',80],['奶茶 中杯',350],['沙拉 1份',120]];
function openFoodSheet(slot){
  $('#sheet-body').innerHTML=`
    <h2>添加食物</h2>
    <div class="field"><label>餐次</label>
      <div class="seg" id="fs-slot">${SLOTS.map(([n],i)=>`<button class="${i===slot?'on':''}" data-s="${i}">${n}</button>`).join('')}</div></div>
    <div class="field"><label>名称</label><input class="inp" id="fs-n" placeholder="例如：鸡胸肉 100g"></div>
    <div class="field"><label>热量 (kcal)</label><input class="inp" id="fs-k" type="number" inputmode="numeric" placeholder="可留空"></div>
    <div class="field"><label>常用</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${PRESET.map(([n,k])=>`<button class="chip" data-p="${n}|${k}">${n}</button>`).join('')}</div></div>
    <button class="btn w" id="fs-ok">添加</button>`;
  openSheet();
  let sel=slot;
  $$('#fs-slot button').forEach(b=>b.onclick=()=>{
    $$('#fs-slot button').forEach(x=>x.classList.remove('on'));b.classList.add('on');sel=+b.dataset.s;
  });
  $$('[data-p]').forEach(b=>b.onclick=()=>{
    const [n,k]=b.dataset.p.split('|');
    $('#fs-n').value=n; $('#fs-k').value=k;
  });
  $('#fs-ok').onclick=()=>{
    const n=$('#fs-n').value.trim(); if(!n) return toast(null,'请输入名称','','close');
    todayMeal().items.push({id:uid(),slot:sel,name:n,kcal:parseInt($('#fs-k').value)||0});
    save(); mealSlot=sel; closeSheet(); renderFood();
  };
}