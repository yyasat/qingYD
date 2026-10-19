'use strict';
/* ============================================================
   体重页
   ============================================================ */
let wRange=14;
function renderWeight(){
  const ws=weightSeries();
  const start=S.profile.startWeight||(ws[0]?ws[0].v:S.profile.weight);
  const now=ws.length?ws[ws.length-1].v:S.profile.weight;
  const chg=+(now-start).toFixed(1), goal=+S.settings.goal, togo=+(now-goal).toFixed(1);
  const unit = S.profile.weightUnit || 'kg';
  
  $('#w-now').textContent=now?now.toFixed(1):'—';
  $('#w-chg').textContent=(chg>0?'+':'')+chg.toFixed(1);
  $('#w-chg-box').className='stat '+(chg<0?'down':chg>0?'up':'');
  $('#w-togo').textContent=togo>0?togo.toFixed(1):'达成';
  $('#w-sub').textContent=`起点 ${start.toFixed(1)} → 目标 ${goal.toFixed(1)} ${unit}`;
  $('#btn-weight-add').innerHTML=I.plus(19);
  $('#w-chart-title').innerHTML=`${I.trend(15)} 变化曲线`;

  // 曲线
  const cut=fmt(addDays(new Date(),-wRange+1));
  const series=ws.filter(s=>s.d>=cut);
  if(series.length<2){
    $('#w-chart').innerHTML=`<div class="tc" style="padding:40px 0;color:var(--text-3)"><p class="fs12">记录 2 天以上可显示曲线</p></div>`;
  } else {
    const vs=series.map(s=>s.v), minV=Math.min(...vs,goal), maxV=Math.max(...vs,goal);
    const pad=Math.max((maxV-minV)*.18, 1);
    const yMin=Math.max(0,minV-pad), yMax=maxV+pad;
    const w=360, h=190, ml=32, mr=8, mt=16, mb=28;
    const pw=w-ml-mr, ph=h-mt-mb;
    const xStep=pw/(series.length-1), yScale=ph/(yMax-yMin);
    const pts=series.map((s,i)=>`${ml+i*xStep},${mt+(yMax-s.v)*yScale}`).join(' ');
    const goalY=mt+(yMax-goal)*yScale;
    const areaPath=`M${ml},${mt+ph} L${pts} L${ml+pw},${mt+ph} Z`;
    const linePath=`M${pts.split(' ').join(' L')}`;
    const last=series[series.length-1];
    $('#w-chart').innerHTML=`<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="gradW" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.01"/>
      </linearGradient></defs>
      <path class="chart-area" d="${areaPath}"/>
      <path class="chart-line" d="${linePath}"/>
      ${series.map((s,i)=>`<circle class="chart-dot ${i===series.length-1?'last':''}" cx="${ml+i*xStep}" cy="${mt+(yMax-s.v)*yScale}" r="4"/>`).join('')}
      <line class="chart-goal" x1="${ml}" y1="${goalY}" x2="${ml+pw}" y2="${goalY}"/>
      <text class="chart-lbl" x="${ml}" y="${mt-4}" text-anchor="start">${maxV.toFixed(1)}</text>
      <text class="chart-lbl" x="${ml}" y="${mt+ph+18}" text-anchor="start">${yMin.toFixed(1)}</text>
      <text class="chart-lbl" x="${ml+pw}" y="${goalY-6}" text-anchor="end" fill="var(--clay)">目标 ${goal.toFixed(1)}</text>
    </svg>`;
  }

  const dates=Object.keys(S.weights).sort().reverse().slice(0,30);
  if(!dates.length){
    $('#w-log').innerHTML=`<p class="fs12 muted tc" style="padding:20px 0">还没有记录，点右上角 + 添加</p>`;
  } else {
    $('#w-log').innerHTML=dates.map(d=>{
      const v=S.weights[d], pd=parseD(d);
      return `<div class="food"><div style="flex:1"><b>${pd.getMonth()+1}月${pd.getDate()}日</b></div><div class="fk">${v.toFixed(1)} ${unit}</div></div>`;
    }).join('');
  }
}

function weightSeries(){
  const dates=Object.keys(S.weights).sort();
  return dates.map(d=>({d,v:S.weights[d]}));
}

function openWeightSheet(){
  const k=TODAY_KEY();
  const unit = S.profile.weightUnit || 'kg';
  
  // 5.1.2 & 5.1.3 不默认填入，使用 placeholder
  const currentWeight = S.weights[k];
  const placeholder = S.profile.startWeight ? `例如：${S.profile.startWeight}` : '输入体重';
  
  $('#sheet-body').innerHTML=`
    <h2>记录体重</h2>
    <p class="hint">建议每天同一时间称量，数字更有参考价值。</p>
    <div class="field">
      <label>日期</label>
      <input class="inp" id="nw-d" type="date" value="${k}" max="${k}">
    </div>
    <div class="field">
      <label>体重单位</label>
      <div class="seg">
        <button class="${unit==='kg'?'on':''}" data-unit="kg">千克 (kg)</button>
        <button class="${unit==='lb'?'on':''}" data-unit="lb">磅 (lb)</button>
      </div>
    </div>
    <div class="field">
      <label>体重 (${unit})</label>
      <input class="inp" id="nw-v" type="number" step="0.1" inputmode="decimal" value="${currentWeight||''}" placeholder="${placeholder}">
    </div>
    <button class="btn w" id="nw-ok">保存</button>`;
  
  openSheet();
  setTimeout(()=>$('#nw-v').focus(),420);
  
  $$('[data-unit]').forEach(btn => {
    btn.onclick = () => {
      $$('[data-unit]').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
    };
  });
  
  $('#nw-ok').onclick=()=>{
    const d=$('#nw-d').value;
    const v=parseFloat($('#nw-v').value);
    const selectedUnit = $$('[data-unit].on')[0]?.dataset.unit || 'kg';
    
    if(!d||isNaN(v)||v<20||v>999) {
      return toast(null,'请检查输入','体重需在合理范围','close');
    }
    
    S.profile.weightUnit = selectedUnit;
    S.weights[d]=+v.toFixed(1);
    
    // 不自动更新个人资料体重
    save(); 
    closeSheet(); 
    renderAll();
    toast(null,'已记录',`${d} · ${v.toFixed(1)} ${selectedUnit}`,'scale');
  };
}
