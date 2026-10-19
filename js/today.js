'use strict';
/* ============================================================
   渲染 — 今日
   ============================================================ */
const $ = s=>document.querySelector(s);
const $$ = s=>[...document.querySelectorAll(s)];
const WD = ['周一','周二','周三','周四','周五','周六','周日'];

function greet(){
  const h = new Date().getHours();
  const n = S.profile.name ? `，${S.profile.name}` : '';
  if(h<5) return '夜深了'+n;
  if(h<11) return '早上好'+n;
  if(h<14) return '午安'+n;
  if(h<18) return '下午好'+n;
  return '晚上好'+n;
}

function renderToday(){
  const k = TODAY_KEY(), d = parseD(k), day = ensureToday(), ph = phaseOf();
  $('#t-date').textContent = `${d.getMonth()+1}月${d.getDate()}日 · ${WD[wdIdx(d)]}`;
  $('#t-greet').textContent = greet();
  const st = dayStat(k);
  $('#t-sub').textContent = st.total ? (st.full ? '今日全部完成，漂亮。' : `还有 ${st.total-st.done} 项待完成`) : '尚未载入今日计划';

  const pct = st.total ? Math.round(st.done/st.total*100) : 0;
  const C = 2*Math.PI*45;
  $('#ring').style.strokeDasharray = C;
  $('#ring').style.strokeDashoffset = C*(1-pct/100);
  $('#ring-pct').textContent = pct;

  $('#hero-phase').textContent = PLAN.phases[ph].name + ' · ' + PLAN.phases[ph].range;
  $('#hero-title').textContent = `${WD[wdIdx(d)]} · 瘦全身 + 薄背`;
  const names = day.tasks.map(t=>t.cat||t.type).filter((v,i,a)=>a.indexOf(v)===i).join(' / ');
  $('#hero-desc').textContent = names || '点击下方载入计划';
  const sk = streak();
  $('#streak-chip').innerHTML = `${I.flame(13)} 连续 ${sk} 天${sk>=3?' · 保持住':''}`;

  // 总耗时显示
  renderTotalTimer();
  
  // 3.1.1 计划模式切换
  renderPlanModeSwitch();
  
  // 3.2.1 打卡次数显示
  renderCheckinStatus();

  $('#task-title').innerHTML = `${I.list(15)} 今日项目 <span class="muted nowrap" style="font-weight:600;font-size:12px">${st.done}/${st.total}</span>`;
  $('#btn-add-task').innerHTML = `${I.plus(16)} 添加运动项目`;
  $('#btn-quick-weight').innerHTML = I.scale(19);

  const list = $('#task-list');
  if(!day.tasks.length){
    list.innerHTML = `<div class="card empty">${I.aerobic(34)}<p>今天还没有项目<br>点「载入计划」按表格自动生成</p></div>`;
  } else {
    list.innerHTML = day.tasks.map(t=>{
      const ic = I[ICON_MAP[t.type]||'spark'];
      const tag = TYPE_TAG[t.cat]!==undefined?TYPE_TAG[t.cat]:'';
      const isRunning = day.taskTimers && day.taskTimers[t.id];
      return `<div class="task ${t.done?'done':''}" data-id="${t.id}" onclick="openActionDetail('${t.id}')">
        <div class="tick" onclick="event.stopPropagation();toggleTask('${t.id}', this.closest('.task'))">${I.check()}</div>
        <div class="t-body">
          <div class="t-name"><span class="strike">${esc(t.name)}</span></div>
          <div class="t-meta">
            <span class="tag ${tag}">${esc(t.cat||'运动')}</span>
            <span class="t-dur">${I.clock(11)} ${t.customDur||t.dur} 分钟</span>
            ${t.hasJump?`<span class="tag c1">${I.flame(11)} 跳跃</span>`:''}
          </div>
          <div class="task-timer-panel" data-task-id="${t.id}" data-running="${!!isRunning}" onclick="event.stopPropagation()">
            <div class="timer-display" data-timer-display="${t.id}">00:00</div>
            <div class="timer-controls">
              <button class="btn sm ${isRunning?'soft':'ghost'}" onclick="toggleTaskTimer('${t.id}', event)">
                ${isRunning?I.clock(14)+' 停止':I.clock(14)+' 开始'}
              </button>
              <button class="icon-btn sq" onclick="openTaskTimerSettings('${t.id}', event)" title="计时设置">
                ${I.edit(14)}
              </button>
            </div>
          </div>
        </div>
        <div class="t-act" onclick="event.stopPropagation()">
          <button class="mini-btn" data-edit="${t.id}" aria-label="编辑">${I.edit(15)}</button>
          <button class="mini-btn" data-del="${t.id}" aria-label="删除">${I.trash(15)}</button>
        </div>
      </div>`;
    }).join('');
    
    // 更新所有计时器显示
    day.tasks.forEach(t => {
      if(typeof updateTaskTimerUI === 'function') updateTaskTimerUI(t.id);
    });
  }

  // 薄背每天必做
  const bd = PLAN.backDaily.map(([n,v])=>`<div class="food"><div class="fi">${I.back(17)}</div><div style="flex:1"><b>${n}</b></div><div class="fk">${v[ph]}</div></div>`).join('');
  if(!$('#back-daily')){
    const sec = document.createElement('div');
    sec.innerHTML = `<div class="sec-title">薄背每天必做 · 无器械</div><div class="card" id="back-daily"></div>`;
    $('#v-today').appendChild(sec);
  }
  $('#back-daily').innerHTML = bd;
}

/* 渲染总耗时面板 */
function renderTotalTimer(){
  if(!$('#total-timer-card')){
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'total-timer-card';
    card.style.marginBottom = '16px';
    $('#task-list').parentNode.insertBefore(card, $('#task-list'));
  }
  
  const day = ensureToday();
  const elapsed = typeof getTotalElapsed === 'function' ? getTotalElapsed() : 0;
  const timeStr = typeof formatTime === 'function' ? formatTime(elapsed) : '00:00';
  
  let rangeStr = '';
  if(day.totalTimer){
    const start = typeof formatTimestamp === 'function' ? formatTimestamp(day.totalTimer.start) : '';
    const end = day.totalTimer.end && typeof formatTimestamp === 'function' ? formatTimestamp(day.totalTimer.end) : '进行中';
    rangeStr = `<div class="fs12 muted" style="margin-top:4px" id="total-timer-range">${start} - ${end}</div>`;
  }
  
  const isRunning = day.totalTimer && !day.totalTimer.end;
  
  $('#total-timer-card').innerHTML = `
    <div class="card-h">
      <h2>${I.battery(15)} 总耗时</h2>
    </div>
    <div style="text-align:center;padding:12px 0">
      <div style="font-size:32px;font-weight:650;font-variant-numeric:tabular-nums;letter-spacing:-0.02em" id="total-timer-display">${timeStr}</div>
      ${rangeStr}
    </div>
    <button class="btn w ${isRunning?'soft':'ghost'}" id="btn-total-timer">
      ${I.clock(16)} ${isRunning?'停止计时':'开始计时'}
    </button>
  `;
  
  const btn = $('#btn-total-timer');
  if(btn){
    btn.onclick = ()=>{
      if(typeof startTotalTimer === 'function' && typeof stopTotalTimer === 'function'){
        if(isRunning){
          stopTotalTimer();
        } else {
          startTotalTimer();
        }
        renderTotalTimer();
      }
    };
  }
}

/* 动作计时器开关 */
function toggleTaskTimer(taskId, event){
  event.stopPropagation();
  const day = ensureToday();
  const isRunning = day.taskTimers && day.taskTimers[taskId];
  
  if(typeof startTaskTimer === 'function' && typeof stopTaskTimer === 'function'){
    if(isRunning){
      stopTaskTimer(taskId);
    } else {
      const task = day.tasks.find(t=>t.id===taskId);
      const mode = task.timerMode === 'preset' ? 'count-down' : 'count-up';
      startTaskTimer(taskId, mode);
    }
    renderToday();
  }
}

/* 打开计时器设置 */
function openTaskTimerSettings(taskId, event){
  event.stopPropagation();
  const day = ensureToday();
  const task = day.tasks.find(t=>t.id===taskId);
  if(!task) return;
  
  $('#sheet-body').innerHTML = `
    <h2>计时设置</h2>
    <div class="field">
      <label>计时模式</label>
      <div class="seg">
        <button class="${task.timerMode==='preset'?'on':''}" data-mode="preset">动作自带时间</button>
        <button class="${task.timerMode==='manual'?'on':''}" data-mode="manual">手动计时</button>
      </div>
    </div>
    <div class="field" id="custom-dur-field" style="${task.timerMode==='preset'?'':'display:none'}">
      <label>自定义时长（分钟）</label>
      <input class="inp" id="custom-dur" type="number" min="1" max="120" value="${task.customDur||task.dur}" placeholder="${task.dur}">
    </div>
    <div class="field">
      <label>倒计时/正计时</label>
      <div class="seg">
        <button class="${task.timerMode!=='manual'?'on':''}" data-count="down">倒计时</button>
        <button class="${task.timerMode==='manual'?'on':''}" data-count="up">正计时</button>
      </div>
    </div>
    <button class="btn w" id="save-timer-settings">保存</button>
  `;
  
  openSheet();
  
  $$('[data-mode]').forEach(b=>b.onclick=()=>{
    $$('[data-mode]').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    $('#custom-dur-field').style.display = b.dataset.mode==='preset'?'':'none';
  });
  
  $$('[data-count]').forEach(b=>b.onclick=()=>{
    $$('[data-count]').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
  });
  
  $('#save-timer-settings').onclick=()=>{
    const mode = $$('[data-mode].on')[0]?.dataset.mode || 'preset';
    task.timerMode = mode;
    
    const dur = parseInt($('#custom-dur').value);
    if(!isNaN(dur) && dur>0){
      task.customDur = dur;
    }
    
    save();
    closeSheet();
    renderToday();
    toast(null,'已保存','计时设置已更新','check');
  };
}

function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* 打卡交互 */
$('#task-list').addEventListener('click', e=>{
  const del = e.target.closest('[data-del]'), ed = e.target.closest('[data-edit]');
  if(del){ e.stopPropagation(); delTask(del.dataset.del); return }
  if(ed){ e.stopPropagation(); openTaskSheet(ed.dataset.edit); return }
  // 注意：点击动作卡片会触发 openActionDetail，在HTML中已绑定
});

function toggleTask(id, el){
  const day = ensureToday();
  const t = day.tasks.find(x=>x.id===id); if(!t) return;
  const wasFull = dayStat(TODAY_KEY()).full;
  t.done = !t.done;
  save();
  if(t.done){
    el.classList.add('done');
    burst(el);
    if(navigator.vibrate) try{navigator.vibrate(12)}catch(e){}
  } else {
    el.classList.remove('done');
  }
  // 仅更新环与计数，避免重绘打断动画
  const st = dayStat(TODAY_KEY());
  const C = 2*Math.PI*45, pct = st.total?Math.round(st.done/st.total*100):0;
  $('#ring').style.strokeDashoffset = C*(1-pct/100);
  $('#ring-pct').textContent = pct;
  $('#task-title').innerHTML = `${I.list(15)} 今日项目 <span class="muted nowrap" style="font-weight:600;font-size:12px">${st.done}/${st.total}</span>`;
  $('#t-sub').textContent = st.full?'今日全部完成，漂亮。':`还有 ${st.total-st.done} 项待完成`;

  if(st.full && !wasFull){
    setTimeout(()=>onAllDone(), 620);
  } else if(t.done && S.settings.cheer){
    const m = ['稳。','这一下算数了。','节奏对了。','又近一点。','背会记得你今天的努力。'];
    toast(I.check?null:null, '已完成', m[Math.floor(Math.random()*m.length)], 'spark');
  }
}
function delTask(id){
  const day = ensureToday();
  day.tasks = day.tasks.filter(t=>t.id!==id);
  save(); renderToday();
}

/* 粒子 */
function burst(el){
  const r = el.getBoundingClientRect();
  const cx = r.left+26, cy = r.top+r.height/2;
  for(let i=0;i<10;i++){
    const s = document.createElement('div');
    s.className='spark';
    const sz = 3+Math.random()*3;
    const a = (-120+Math.random()*120)*Math.PI/180, dist=24+Math.random()*34;
    s.style.cssText=`width:${sz}px;height:${sz}px;left:${cx}px;top:${cy}px;position:fixed;z-index:200;--dx:${Math.cos(a)*dist}px;--dy:${Math.sin(a)*dist}px;animation:sparkUp ${500+Math.random()*320}ms var(--ease) forwards;background:${i%3===0?'var(--clay)':'var(--accent)'}`;
    document.body.appendChild(s);
    setTimeout(()=>s.remove(),900);
  }
}

/* 3.1.1 计划模式切换 */
function renderPlanModeSwitch(){
  if(!$('#plan-mode-card')){
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'plan-mode-card';
    card.style.marginBottom = '16px';
    $('#task-list').parentNode.insertBefore(card, $('#task-list'));
  }
  
  const mode = S.settings.planMode || 'original';
  
  $('#plan-mode-card').innerHTML = `
    <div class="card-h">
      <h2>${I.target(15)} 计划模式</h2>
    </div>
    <div class="seg">
      <button class="${mode==='original'?'on':''}" data-mode="original">原计划</button>
      <button class="${mode==='custom'?'on':''}" data-mode="custom">自拟计划</button>
      <button class="${mode==='either'?'on':''}" data-mode="either">任意完成</button>
    </div>
  `;
  
  $$('#plan-mode-card [data-mode]').forEach(btn => {
    btn.onclick = () => {
      if(typeof switchPlanMode === 'function'){
        switchPlanMode(btn.dataset.mode);
      }
    };
  });
}

/* 3.2.1 打卡次数显示 */
function renderCheckinStatus(){
  if(!$('#checkin-status-card')){
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'checkin-status-card';
    card.style.marginBottom = '16px';
    $('#task-list').parentNode.insertBefore(card, $('#task-list'));
  }
  
  const count = typeof getTodayCheckinCount === 'function' ? getTodayCheckinCount() : 0;
  const limit = S.settings.checkinsPerDay || 1;
  const canCheckin = typeof isCheckinComplete === 'function' ? isCheckinComplete() : false;
  const canAgain = typeof canCheckinAgain === 'function' ? canCheckinAgain() : true;
  
  $('#checkin-status-card').innerHTML = `
    <div class="card-h">
      <h2>${I.medal(15)} 今日打卡</h2>
      <span class="fs12 muted">${count} / ${limit}</span>
    </div>
    ${count > 0 ? `<div class="fs12 muted" style="margin-bottom:12px">已完成 ${count} 次打卡</div>` : ''}
    ${canCheckin && canAgain ? `
      <button class="btn w" id="btn-checkin">
        ${I.check(16)} 完成打卡
      </button>
    ` : !canCheckin ? `
      <div class="fs12 muted tc" style="padding:12px;background:var(--surface-2);border-radius:10px">
        完成今日项目后可打卡
      </div>
    ` : `
      <div class="fs12 muted tc" style="padding:12px;background:var(--surface-2);border-radius:10px">
        今日打卡次数已用完
      </div>
    `}
    <button class="btn w ghost sm" id="btn-edit-checkin" style="margin-top:8px">
      ${I.edit(14)} 设置打卡次数
    </button>
  `;
  
  const btnCheckin = $('#btn-checkin');
  if(btnCheckin){
    btnCheckin.onclick = () => {
      if(typeof completeCheckin === 'function'){
        completeCheckin();
        renderCheckinStatus();
      }
    };
  }
  
  const btnEdit = $('#btn-edit-checkin');
  if(btnEdit){
    btnEdit.onclick = () => {
      $('#sheet-body').innerHTML = `
        <h2>打卡设置</h2>
        <div class="field">
          <label>每日打卡次数</label>
          <input class="inp" id="checkin-limit" type="number" min="1" max="10" value="${limit}">
        </div>
        <button class="btn w" id="save-checkin-limit">保存</button>
      `;
      openSheet();
      $('#save-checkin-limit').onclick = () => {
        const val = parseInt($('#checkin-limit').value);
        if(!isNaN(val) && val > 0 && val <= 10){
          S.settings.checkinsPerDay = val;
          save();
          closeSheet();
          renderCheckinStatus();
          toast(null,'已保存',`每日可打卡 ${val} 次`,'check');
        }
      };
    };
  }
}

/* 3.4.1 今日感悟 */
function openReflectionSheet(){
  const day = ensureToday();
  const reflection = day.reflection || '';
  
  $('#sheet-body').innerHTML = `
    <h2>今日感悟</h2>
    <div class="field">
      <label>记录今天的感受与思考（非必填）</label>
      <textarea class="inp" id="reflection-text" placeholder="今天感觉怎么样？有什么想法？">${esc(reflection)}</textarea>
    </div>
    <button class="btn w" id="save-reflection">保存</button>
  `;
  
  openSheet();
  
  $('#save-reflection').onclick = () => {
    const text = $('#reflection-text').value.trim();
    if(typeof saveReflection === 'function'){
      saveReflection(text);
      closeSheet();
      toast(null,'已保存','今日感悟已记录','check');
    }
  };
}
