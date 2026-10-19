'use strict';
/* ============================================================
   日历
   ============================================================ */
let calCur = new Date();
function renderCal(){
  const y=calCur.getFullYear(), m=calCur.getMonth();
  $('#cal-label').textContent = `${y} 年 ${m+1} 月`;
  const first=new Date(y,m,1), days=new Date(y,m+1,0).getDate();
  const lead=wdIdx(first);
  let html='';
  for(let i=0;i<lead;i++) html+=`<div class="cday pad"></div>`;
  const tk=TODAY_KEY();
  let monthFull=0, monthHas=0;
  for(let d=1;d<=days;d++){
    const k=fmt(new Date(y,m,d)), st=dayStat(k), w=S.weights[k];
    const dayData = S.days[k];
    const hasTime = dayData && dayData.totalTimer && dayData.totalTimer.elapsed > 0;
    if(st.total) monthHas++;
    if(st.full) monthFull++;
    const cls=['cday']; if(st.full)cls.push('full'); else if(st.any)cls.push('part');
    if(k===tk)cls.push('today');
    // 2.1.3 在日历上显示有总耗时记录的标记（V）
    html+=`<div class="${cls.join(' ')}" data-d="${k}">${d}${w?`<i class="wdot"></i>`:''}${hasTime?`<i class="wv">⏱</i>`:''}</div>`;
  }
  $('#cal-grid').innerHTML=html;
  $('#cal-sub').textContent = `本月完成 ${monthFull} 天`;
  $('#st-streak').textContent = streak();
  $('#st-total').textContent = totalDays();
  $('#st-rate').textContent = monthHas? Math.round(monthFull/monthHas*100)+'%' : '0%';
  $('#cal-prev').innerHTML=I.left(17); $('#cal-next').innerHTML=I.right(17);
  $('#btn-reveal-test').innerHTML=I.medal(19);

  // 里程碑
  const n=+S.settings.mile, sk=streak();
  const list=[];
  for(let i=1;i<=4;i++){
    const target=n*i, got=S.meta.seenMiles.includes(target)||sk>=target;
    list.push(`<div class="ph-badge ${got?'on':''}" ${got?`data-mile="${target}"`:''} style="${got?'':'cursor:default'}">
      <div class="pn">${got?I.medal(15):I.lock(14)}</div>
      <div style="flex:1"><b>连续 ${target} 天</b><span>${got?'已解锁 · 点击回看成果':`还需 ${target-sk} 天`}</span></div>
    </div>`);
  }
  $('#milestones').innerHTML=list.join('');
}
$('#cal-prev').addEventListener('click',()=>{calCur=new Date(calCur.getFullYear(),calCur.getMonth()-1,1);renderCal()});
$('#cal-next').addEventListener('click',()=>{calCur=new Date(calCur.getFullYear(),calCur.getMonth()+1,1);renderCal()});
$('#cal-grid').addEventListener('click',e=>{
  const c=e.target.closest('.cday[data-d]'); if(c) openDaySheet(c.dataset.d);
});
$('#milestones').addEventListener('click',e=>{
  const b=e.target.closest('[data-mile]'); if(b) showReveal(+b.dataset.mile);
});
$('#btn-reveal-test').addEventListener('click',()=>showReveal(Math.max(streak(),+S.settings.mile)));

function openDaySheet(k){
  const d=parseD(k), day=S.days[k], st=dayStat(k), w=S.weights[k];
  const isFuture = k>TODAY_KEY();
  
  // 计算当天总耗时和动作耗时明细
  let totalTimeSeconds = 0;
  let taskTimesHtml = '';
  
  if(day && day.totalTimer){
    totalTimeSeconds = day.totalTimer.elapsed || 0;
  }
  
  if(day && day.tasks.length){
    taskTimesHtml = day.tasks.map(t=>{
      const actualTime = t.actualTime || 0;
      const timeStr = actualTime > 0 ? formatTime(actualTime) : '—';
      return `<div class="food"><div class="fi">${I[ICON_MAP[t.type]||'spark'](17)}</div>
       <div style="flex:1"><b>${esc(t.name)}</b><span>${esc(t.cat||'')} · ${t.dur}分钟</span></div>
       <div class="fk" style="color:${t.done?'var(--accent)':'var(--text-3)'}">
         ${t.done?'✓':'—'} ${actualTime > 0 ? `<span class="fs12 muted" style="margin-left:4px">${timeStr}</span>` : ''}
       </div></div>`;
    }).join('');
  } else {
    taskTimesHtml = `<p class="fs12 muted tc" style="padding:18px 0">这天没有记录</p>`;
  }
  
  const moodTxt = day&&day.mood ? ['','有点吃力','正常','很轻松'][day.mood] : '—';
  const totalTimeStr = totalTimeSeconds > 0 ? formatTime(totalTimeSeconds) : '—';
  
  // 显示总耗时和时间范围
  let timeRangeStr = '';
  if(day && day.totalTimer){
    const start = formatTimestamp(day.totalTimer.start);
    const end = day.totalTimer.end ? formatTimestamp(day.totalTimer.end) : '未停止';
    timeRangeStr = `<div class="fs12 muted" style="margin-top:2px">${start} - ${end}</div>`;
  }
  
  // 3.3.5 小票信息显示
  let ticketInfo = '';
  if(S.tickets && S.tickets[k] && S.tickets[k].length > 0){
    const ticket = S.tickets[k][S.tickets[k].length - 1];
    ticketInfo = `
      <div class="card" style="margin-bottom:14px;padding:14px;background:var(--surface-2)">
        <div class="fs12 muted" style="margin-bottom:6px">打卡小票</div>
        <div style="font-size:13px;line-height:1.5;color:var(--text-2);margin-bottom:8px">"${esc(ticket.quote)}"</div>
        ${ticket.weightLoss ? `<div class="fs12 muted">减重: ${ticket.weightLoss} kg</div>` : ''}
      </div>
    `;
  }
  
  // 3.4.2 今日感悟显示
  let reflectionInfo = '';
  if(day && day.reflection){
    reflectionInfo = `
      <div class="card flat" style="margin-bottom:14px;padding:14px">
        <div class="fs12 muted" style="margin-bottom:6px">今日感悟</div>
        <div style="font-size:13px;line-height:1.6;color:var(--text)">${esc(day.reflection)}</div>
      </div>
    `;
  }
  
  $('#sheet-body').innerHTML=`
    <h2>${d.getMonth()+1}月${d.getDate()}日 · ${WD[wdIdx(d)]}</h2>
    <div class="stat-row" style="margin-bottom:16px">
      <div class="stat"><b>${st.done}/${st.total||0}</b><span>完成项</span></div>
      <div class="stat"><b>${w?w.toFixed(1):'—'}</b><span>体重 KG</span></div>
      <div class="stat"><b style="font-size:14px">${moodTxt}</b><span>当日感受</span></div>
    </div>
    ${ticketInfo}
    ${reflectionInfo}
    ${totalTimeSeconds > 0 ? `
    <div class="card" style="margin-bottom:14px;text-align:center;padding:14px">
      <div class="fs12 muted" style="margin-bottom:4px">总耗时</div>
      <div style="font-size:24px;font-weight:650;color:var(--accent);font-variant-numeric:tabular-nums">${totalTimeStr}</div>
      ${timeRangeStr}
    </div>
    ` : ''}
    <div class="sec-title">动作明细</div>
    <div class="card flat" style="margin-bottom:14px">${taskTimesHtml}</div>
    <div class="field"><label>这天的体重</label>
      <input class="inp" id="d-w" type="number" step="0.1" inputmode="decimal" value="${w||''}" placeholder="未记录"></div>
    ${isFuture?'':`<button class="btn w ghost sm" id="d-load" style="margin-bottom:9px">按计划表载入这天的项目</button>`}
    <button class="btn w" id="d-save">保存</button>`;
  $('#d-save').onclick=()=>{
    const v=parseFloat($('#d-w').value);
    if(!isNaN(v)&&v>20&&v<300) S.weights[k]=+v.toFixed(1);
    else if($('#d-w').value==='') delete S.weights[k];
    save(); closeSheet(); renderAll();
  };
  const dl=$('#d-load');
  if(dl) dl.onclick=()=>{
    const dd=getDay(k,true); dd.tasks=buildPlan(k); dd.loaded=true;
    save(); closeSheet(); renderAll();
  };
  openSheet();
}