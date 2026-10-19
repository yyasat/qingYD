'use strict';
/* ============================================================
   全部完成 → 问答
   ============================================================ */
function onAllDone(){
  if(S.settings.quiz) openQuiz();
  else { cheerFull(); checkMilestone() }
}
function cheerFull(){
  const sk = streak();
  toast(null,'今日达成', `连续第 ${sk} 天。今天的身体记住了这件事。`, 'medal');
}

const QUIZ = [
  {k:'mood', q:'今天感觉如何？', d:'影响下一次的强度基调', opts:[
    {v:3,i:'smile',b:'很轻松',s:'还能再多来一点'},
    {v:2,i:'neutral',b:'正常',s:'刚好吃得消'},
    {v:1,i:'tired',b:'有点吃力',s:'明天想缓一缓'}]},
  {k:'energy', q:'跳完 30 秒还喘吗？', d:'对应升级信号表', opts:[
    {v:3,i:'battery',b:'完全不喘',s:'可以往上加时长'},
    {v:2,i:'flame',b:'有点喘',s:'维持当前节奏'},
    {v:1,i:'heart',b:'很喘',s:'今天先稳住'}]},
  {k:'soreness', q:'背和肩的感觉？', d:'决定薄背动作的量', opts:[
    {v:3,i:'back',b:'很顺',s:'次数可以加'},
    {v:2,i:'core',b:'轻微酸',s:'正常反应'},
    {v:1,i:'stretch',b:'明显酸痛',s:'多做拉伸'}]}
];
let quizState = {i:0, ans:{}};

function openQuiz(){
  quizState = {i:0, ans:{}};
  renderQuiz();
  openSheet();
}
function renderQuiz(){
  const q = QUIZ[quizState.i];
  if(!q) return finishQuiz();
  $('#sheet-body').innerHTML = `
    <div class="quiz-prog">${QUIZ.map((_,i)=>`<i class="${i<=quizState.i?'on':''}"></i>`).join('')}</div>
    <h3 class="quiz-q">${q.q}</h3>
    <p class="quiz-d">${q.d}</p>
    <div class="opts">${q.opts.map(o=>`
      <button class="opt" data-v="${o.v}">
        <div class="oi">${I[o.i](18)}</div>
        <div><b>${o.b}</b><span>${o.s}</span></div>
      </button>`).join('')}</div>
    <p class="tc fs12 muted" style="margin:16px 0 4px">${quizState.i+1} / ${QUIZ.length}</p>`;
  $$('#sheet-body .opt').forEach(b=>b.addEventListener('click',()=>{
    b.classList.add('sel');
    quizState.ans[q.k]=+b.dataset.v;
    setTimeout(()=>{ quizState.i++; renderQuiz() }, 260);
  }));
}
function finishQuiz(){
  const day = ensureToday();
  Object.assign(day, quizState.ans);
  const score = (quizState.ans.mood||2)+(quizState.ans.energy||2)+(quizState.ans.soreness||2);
  let adj = 0, msg = '', ic='target';
  if(S.settings.autoAdjust){
    if(score>=8){ adj=1; msg='下次计划时长 +10%，强度往上走一格。'; ic='up' }
    else if(score<=4){ adj=-1; msg='下次计划时长 -10%，先把恢复做好。'; ic='down' }
    else { msg='保持当前节奏，稳定比猛冲有用。'; ic='minus' }
    day.adj = adj;
    applyAdjust(adj);
  } else { msg='已记录今日状态。' }

  let upHint = '';
  if(quizState.ans.energy===3 && phaseOf()<2){
    upHint = `<div class="ph-badge on" style="margin-top:12px;cursor:default">
      <div class="pn">${I.spark(15)}</div>
      <div><b>可以考虑升级阶段</b><span>按升级信号表：跳完不喘 → 30秒加到45秒</span></div></div>`;
  }

  $('#sheet-body').innerHTML = `
    <div class="tc" style="padding:8px 0 4px">
      <div style="width:66px;height:66px;border-radius:22px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;margin:0 auto 16px">${I.medal(32)}</div>
      <h3 style="margin:0 0 6px;font-size:21px;font-weight:650;letter-spacing:-.02em">今日完成</h3>
      <p class="fs12" style="color:var(--text-2);margin:0 0 4px">连续第 ${streak()} 天 · ${PLAN.phases[phaseOf()].name}</p>
    </div>
    <div class="card flat" style="margin-top:14px">
      <div style="display:flex;gap:11px;align-items:flex-start">
        <div style="width:32px;height:32px;border-radius:10px;background:var(--surface);color:var(--accent);display:grid;place-items:center;flex:none;box-shadow:var(--shadow-s)">${I[ic](17)}</div>
        <div><b style="font-size:13.5px">强度调整</b><p class="fs12" style="color:var(--text-2);margin:2px 0 0;line-height:1.5">${msg}</p></div>
      </div>
    </div>
    ${upHint}
    <div class="field" style="margin-top:14px">
      <label>今日体重（可选）</label>
      <input class="inp" id="q-weight" type="number" step="0.1" inputmode="decimal" placeholder="${S.weights[TODAY_KEY()]||S.profile.weight||''}">
    </div>
    <button class="btn w" id="q-done" style="margin-top:4px">完成</button>`;
  $('#q-done').addEventListener('click',()=>{
    const v = parseFloat($('#q-weight').value);
    if(!isNaN(v) && v>20 && v<300){ S.weights[TODAY_KEY()]=+v.toFixed(1); S.profile.weight=+v.toFixed(1) }
    save(); closeSheet();
    setTimeout(()=>{ cheerFull(); checkMilestone(); renderAll() }, 260);
  });
}
function applyAdjust(adj){
  if(!adj) return;
  const k = fmt(addDays(new Date(),1));
  const day = getDay(k,true);
  if(day.tasks.length) return; // 已有计划不动
  day.tasks = buildPlan(k).map(t=>({...t, dur: Math.max(5, Math.round(t.dur*(1+adj*0.1)))}));
  day.loaded = true;
  save();
}