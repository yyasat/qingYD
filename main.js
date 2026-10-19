'use strict';
/* ============================================================
   启动
   ============================================================ */
function boot(){
  applyTheme();
  // 首次：写入起始体重
  if(!Object.keys(S.weights).length && S.profile.weight){
    S.weights[S.meta.installed||TODAY_KEY()]=S.profile.weight;
    S.profile.startWeight=S.profile.weight;
    save();
  }
  buildNav();
  renderToday(); renderCal(); renderMe();
  $('#btn-load-plan').innerHTML=`${I.list(14)} 载入计划`;

  // 日期跨天检测
  let last=TODAY_KEY();
  setInterval(()=>{ if(TODAY_KEY()!==last){ last=TODAY_KEY(); ensureToday(); renderAll() } }, 60000);

  // 首次引导
  if(!S.profile.name && !localStorage.getItem(KEY+'.welcomed')){
    localStorage.setItem(KEY+'.welcomed','1');
    setTimeout(()=>{
      $('#sheet-body').innerHTML=`
        <div class="tc" style="padding:6px 0 2px">
          <div style="width:62px;height:62px;border-radius:20px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;margin:0 auto 14px">${I.mountain(30)}</div>
          <h3 style="margin:0 0 6px;font-size:21px;font-weight:650;letter-spacing:-.02em">开始之前</h3>
          <p class="fs12" style="color:var(--text-2);margin:0;line-height:1.6">告诉我怎么称呼你，<br>以及现在的体重。其余随时可改。</p>
        </div>
        <div class="field" style="margin-top:18px"><label>名字</label><input class="inp" id="w-n" placeholder="例如：恍恍"></div>
        <div class="row2">
          <div class="field"><label>当前体重 (kg)</label><input class="inp" id="w-w" type="number" step="0.1" inputmode="decimal" value="54.8"></div>
          <div class="field"><label>目标体重 (kg)</label><input class="inp" id="w-g" type="number" step="0.1" inputmode="decimal" value="52.8"></div>
        </div>
        <p class="fs12 muted" style="margin:-4px 0 14px;line-height:1.6">计划表已内置：每天跳绳/燃脂操 + 薄背 + 核心 + 拉伸，体力好了就升级。</p>
        <button class="btn w" id="w-ok">进入</button>`;
      openSheet();
      $('#w-ok').onclick=()=>{
        const n=$('#w-n').value.trim(), w=parseFloat($('#w-w').value), g=parseFloat($('#w-g').value);
        if(n) S.profile.name=n;
        if(!isNaN(w)&&w>20&&w<300){ S.profile.weight=+w.toFixed(1); S.profile.startWeight=+w.toFixed(1); S.weights[TODAY_KEY()]=+w.toFixed(1) }
        if(!isNaN(g)&&g>20&&g<300) S.settings.goal=+g.toFixed(1);
        save(); closeSheet(); renderAll();
        toast(null,'准备好了','今天的项目已经在等你了。','spark');
      };
    }, 700);
  }
}
boot();