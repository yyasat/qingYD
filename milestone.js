'use strict';
/* ============================================================
   里程碑 — 全屏体重变化
   ============================================================ */
function checkMilestone(){
  const sk = streak(), n = +S.settings.mile;
  if(sk>0 && sk % n === 0 && !S.meta.seenMiles.includes(sk)){
    S.meta.seenMiles.push(sk); save();
    setTimeout(()=>showReveal(sk), 900);
  } else if(sk>0 && sk%n!==0 && S.settings.cheer && sk>=2){
    const left = n - (sk%n);
    setTimeout(()=>toast(null,`连续 ${sk} 天`,`再 ${left} 天解锁一次完整回顾。`,'lock'), 1500);
  }
}

function weightSeries(){
  return Object.keys(S.weights).sort().map(k=>({d:k, v:S.weights[k]}));
}
function showReveal(sk){
  const ws = weightSeries();
  const start = S.profile.startWeight || (ws[0]?ws[0].v : S.profile.weight);
  const now = ws.length ? ws[ws.length-1].v : S.profile.weight;
  const delta = +(now-start).toFixed(1);
  const goal = +S.settings.goal;
  const togo = +(now-goal).toFixed(1);
  const totalMin = Object.keys(S.days).reduce((a,k)=>{
    const d=S.days[k]; return a + (d.tasks||[]).filter(t=>t.done).reduce((b,t)=>b+(t.dur||0),0);
  },0);

  const series = ws.slice(-14);
  const chart = series.length>=2 ? revealChart(series, goal) : `<p class="fs12 muted tc" style="padding:40px 0">记录两次以上体重，这里会画出你的曲线</p>`;

  const quotes = [
    '变化不是某一天发生的，是每一天都发生了一点。',
    '你没有在等结果，你在制造它。',
    '身体很诚实，它记得你做过的每一次。',
    '坚持的意义，是让选择变成习惯。'
  ];
  const good = delta<0;

  $('#reveal-inner').innerHTML = `
    <button class="icon-btn rv-close" id="rv-x" aria-label="关闭">${I.close(17)}</button>
    <div class="fade-up" style="animation-delay:.05s">
      <div class="rv-kicker">milestone · ${sk} days</div>
      <h2 class="rv-title">连续 ${sk} 天<br>没有缺席</h2>
      <p class="rv-sub">${S.profile.name?S.profile.name+'，':''}这是你从 ${start.toFixed(1)}kg 出发之后的全部轨迹。</p>
    </div>
    <div class="fade-up" style="animation-delay:.3s">
      <div class="rv-num"><b id="rv-n">0.0</b><i>kg</i></div>
      <div class="rv-delta ${good?'good':''}">${delta<0?I.down(14):delta>0?I.up(14):I.minus(14)} ${delta>0?'+':''}${delta.toFixed(1)} kg 相较起点</div>
    </div>
    <div class="rv-chart fade-up" style="animation-delay:.45s">${chart}</div>
    <div class="rv-grid fade-up" style="animation-delay:.7s">
      <div class="rv-cell"><b>${totalDays()}</b><span>完成天数</span></div>
      <div class="rv-cell"><b>${Math.round(totalMin/60*10)/10}<span style="font-size:12px;letter-spacing:0;text-transform:none;color:var(--text-3)"> 小时</span></b><span>累计运动</span></div>
      <div class="rv-cell"><b>${togo>0?togo.toFixed(1):'达成'}</b><span>${togo>0?'距目标 KG':'目标已达'}</span></div>
      <div class="rv-cell"><b>${PLAN.phases[phaseOf()].name.replace('第','').replace('阶段','')}</b><span>当前阶段</span></div>
    </div>
    <div class="rv-foot fade-up" style="animation-delay:.9s">
      <p class="rv-quote">${quotes[sk%quotes.length]}</p>
      <button class="btn w" id="rv-go">继续前进</button>
    </div>`;

  $('#reveal').classList.add('on');
  document.body.style.overflow='hidden';
  countTo($('#rv-n'), now, 1500, 1);
  revealSparks();
  $('#rv-x').onclick = $('#rv-go').onclick = closeReveal;
}
function closeReveal(){
  $('#reveal').classList.remove('on');
  document.body.style.overflow='';
}
function countTo(el, to, dur, dp){
  const from = 0, t0 = performance.now();
  (function step(t){
    const p = Math.min(1,(t-t0)/dur);
    const e = 1-Math.pow(1-p,3);
    el.textContent = (from+(to-from)*e).toFixed(dp);
    if(p<1) requestAnimationFrame(step);
  })(t0);
}
function revealSparks(){
  const box = $('#reveal-inner');
  for(let i=0;i<16;i++){
    const s=document.createElement('div');
    s.className='spark';
    const sz=2+Math.random()*3.5;
    s.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${60+Math.random()*40}%;position:absolute;--dx:${-20+Math.random()*40}px;--dy:${-120-Math.random()*220}px;animation:sparkUp ${2400+Math.random()*2200}ms ${Math.random()*1600}ms var(--ease) forwards;background:${i%4===0?'var(--clay)':'var(--accent)'}`;
    box.appendChild(s);
  }
}
function revealChart(series, goal){
  const W=460,H=150,pl=8,pr=8,pt=16,pb=22;
  const vals = series.map(s=>s.v).concat([goal]);
  let lo=Math.min(...vals), hi=Math.max(...vals);
  if(hi-lo<1.2){const m=(hi+lo)/2;lo=m-.7;hi=m+.7}
  const pad=(hi-lo)*.14; lo-=pad; hi+=pad;
  const X=i=>pl+(W-pl-pr)*(series.length===1?.5:i/(series.length-1));
  const Y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
  const pts=series.map((s,i)=>[X(i),Y(s.v)]);
  const path=smooth(pts);
  const gy=Y(goal);
  const dots=pts.map((p,i)=>`<circle class="rv-pt" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===pts.length-1?4.5:2.8}" fill="${i===pts.length-1?'var(--accent)':'var(--surface)'}" stroke="var(--accent)" stroke-width="2" style="animation-delay:${(.6+i*0.12).toFixed(2)}s;transform-origin:${p[0].toFixed(1)}px ${p[1].toFixed(1)}px"/>`).join('');
  const len = pathLen(pts);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <line x1="${pl}" y1="${gy.toFixed(1)}" x2="${W-pr}" y2="${gy.toFixed(1)}" class="chart-goal"/>
    <text x="${W-pr}" y="${(gy-6).toFixed(1)}" text-anchor="end" class="chart-lbl" fill="var(--clay)">目标 ${goal}</text>
    <path class="rv-path" style="--len:${len}" d="${path}"/>
    ${dots}
    <text x="${pl}" y="${H-5}" class="chart-lbl">${series[0].d.slice(5)}</text>
    <text x="${W-pr}" y="${H-5}" text-anchor="end" class="chart-lbl">${series[series.length-1].d.slice(5)}</text>
  </svg>`;
}
function pathLen(pts){
  let l=0; for(let i=1;i<pts.length;i++){l+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1])}
  return Math.ceil(l*1.25)||1;
}
function smooth(pts){
  if(pts.length<2) return pts.length?`M${pts[0][0]},${pts[0][1]}`:'';
  let d=`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[i-1]||pts[i], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
    const t=.2;
    const c1=[p1[0]+(p2[0]-p0[0])*t, p1[1]+(p2[1]-p0[1])*t];
    const c2=[p2[0]-(p3[0]-p1[0])*t, p2[1]-(p3[1]-p1[1])*t];
    d+=` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}