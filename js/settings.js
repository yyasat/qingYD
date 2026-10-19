'use strict';
/* ============================================================
   我的 / 设置
   ============================================================ */
const SHAPES=['偏瘦','标准','微胖','苹果型','梨型','匀称'];
function renderMe(){
  const p=S.profile;
  // 渲染头像
  const avText = $('#av-text');
  const avImg = $('#av-img');
  if(p.avatar){
    avImg.src = p.avatar;
    avImg.style.display = 'block';
    avText.style.display = 'none';
  } else {
    avText.textContent = p.name ? p.name.slice(0,1) : '轻';
    avImg.style.display = 'none';
    avText.style.display = 'block';
  }
  
  $('#me-name').textContent=p.name||'未设置名字';
  const bmi=(p.height&&p.weight)?(p.weight/Math.pow(p.height/100,2)).toFixed(1):null;
  $('#me-meta').textContent=[p.gender,p.age?p.age+'岁':'',bmi?'BMI '+bmi:''].filter(Boolean).join(' · ')||'补全资料，计划更贴合';
  $('#me-chips').innerHTML=[
    p.height?`身高 ${p.height}cm`:'', p.weight?`体重 ${p.weight}kg`:'',
    S.settings.goal?`目标 ${S.settings.goal}kg`:'', p.shape?`身材 ${p.shape}`:'',
    p.birthday?`生日 ${p.birthday.slice(5)}`:''
  ].filter(Boolean).map(c=>`<span class="chip">${c}</span>`).join('');

  $('#phase-list').innerHTML=PLAN.phases.map((ph,i)=>`
    <div class="ph-badge ${phaseOf()===i?'on':''}" data-ph="${i}">
      <div class="pn">${i+1}</div>
      <div style="flex:1"><b>${ph.name} · ${ph.range}</b><span>${ph.desc}</span></div>
    </div>`).join('') + `
    <div class="divider"></div>
    <div class="sl" style="font-size:12.5px;margin-bottom:8px">升级信号</div>
    ${PLAN.upgradeSignals.map(([a,b])=>`<div class="setting-row" style="padding:9px 0"><div><div class="sl" style="font-size:13px">${a}</div></div><b class="fs12" style="color:var(--accent)">${b}</b></div>`).join('')}
    <div class="divider"></div>
    <button class="btn w ghost sm" id="btn-ticket-gallery" style="margin-bottom:9px">
      ${I.medal(14)} 小票库
    </button>
    <button class="btn w ghost sm" id="btn-edit-quotes" style="margin-bottom:9px">
      ${I.edit(14)} 励志语录
    </button>
    <button class="btn w ghost sm" id="btn-reflection">
      ${I.heart(14)} 今日感悟
    </button>`;
  $$('[data-ph]').forEach(b=>b.onclick=()=>{
    S.settings.phase=+b.dataset.ph; save(); renderMe(); renderToday();
    toast(null,'已切换阶段',PLAN.phases[+b.dataset.ph].name+' · 下次载入计划生效','spark');
  });
  
  // 3.3.4 小票库入口
  const btnGallery = $('#btn-ticket-gallery');
  if(btnGallery){
    btnGallery.onclick = () => {
      if(typeof openTicketGallery === 'function'){
        openTicketGallery();
      }
    };
  }
  
  // 3.3.7 编辑语录入口
  const btnQuotes = $('#btn-edit-quotes');
  if(btnQuotes){
    btnQuotes.onclick = () => {
      if(typeof editQuotes === 'function'){
        editQuotes();
      }
    };
  }
  
  // 3.4.1 今日感悟入口
  const btnReflection = $('#btn-reflection');
  if(btnReflection){
    btnReflection.onclick = () => {
      if(typeof openReflectionSheet === 'function'){
        openReflectionSheet();
      }
    };
  }

  $('#sw-food').classList.toggle('on',S.settings.food);
  $('#sw-cheer').classList.toggle('on',S.settings.cheer);
  $('#sw-quiz').classList.toggle('on',S.settings.quiz);
  $('#sw-auto').classList.toggle('on',S.settings.autoAdjust);
  $('#sel-mile').value=S.settings.mile;
  $('#inp-goal').value=S.settings.goal;
  $('#inp-kcal').value=S.settings.kcal;
  $$('#seg-theme button').forEach(b=>b.classList.toggle('on',b.dataset.theme===S.settings.theme));
}

function bindSwitch(sel,key,after){
  $(sel).addEventListener('click',()=>{
    S.settings[key]=!S.settings[key]; save();
    $(sel).classList.toggle('on',S.settings[key]);
    after&&after();
  });
}
bindSwitch('#sw-food','food',()=>{buildNav();renderMe()});
bindSwitch('#sw-cheer','cheer');
bindSwitch('#sw-quiz','quiz');
bindSwitch('#sw-auto','autoAdjust');
$('#sel-mile').addEventListener('change',e=>{S.settings.mile=+e.target.value;save();renderCal()});
$('#inp-goal').addEventListener('change',e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){S.settings.goal=+v.toFixed(1);save();renderWeight()}});
$('#inp-kcal').addEventListener('change',e=>{const v=parseInt(e.target.value);if(v>0){S.settings.kcal=v;save();if(S.settings.food)renderFood()}});

/* 头像上传 */
$('#me-av').addEventListener('click',()=>$('#avatar-upload').click());
$('#avatar-upload').addEventListener('change',e=>{
  const f=e.target.files[0]; 
  if(!f) return;
  if(!f.type.startsWith('image/')){
    toast(null,'格式不支持','请选择图片文件','close');
    return;
  }
  if(f.size > 5*1024*1024){
    toast(null,'图片过大','请选择小于 5MB 的图片','close');
    return;
  }
  const r=new FileReader();
  r.onload=()=>{
    S.profile.avatar = r.result;
    save();
    renderMe();
    toast(null,'头像已更新','','check');
  };
  r.readAsDataURL(f);
  e.target.value='';
});

$('#btn-edit-profile').addEventListener('click',()=>{
  const p=S.profile;
  $('#sheet-body').innerHTML=`
    <h2>个人资料</h2>
    <div class="field"><label>名字</label><input class="inp" id="p-n" value="${esc(p.name)}" placeholder="怎么称呼你"></div>
    <div class="row2">
      <div class="field"><label>性别</label><select class="inp" id="p-g"><option value="">未选择</option>${['女','男','其他'].map(g=>`<option ${p.gender===g?'selected':''}>${g}</option>`).join('')}</select></div>
      <div class="field"><label>年龄</label><input class="inp" id="p-a" type="number" inputmode="numeric" value="${p.age}"></div>
    </div>
    <div class="row2">
      <div class="field"><label>身高 (cm)</label><input class="inp" id="p-h" type="number" inputmode="decimal" value="${p.height}"></div>
      <div class="field"><label>当前体重 (kg)</label><input class="inp" id="p-w" type="number" step="0.1" inputmode="decimal" value="${p.weight}"></div>
    </div>
    <div class="row2">
      <div class="field"><label>生日</label><input class="inp" id="p-b" type="date" value="${p.birthday}"></div>
      <div class="field"><label>身材</label><select class="inp" id="p-s"><option value="">未选择</option>${SHAPES.map(s=>`<option ${p.shape===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>起始体重 (kg) · 用于计算变化</label><input class="inp" id="p-sw" type="number" step="0.1" inputmode="decimal" value="${p.startWeight}" placeholder="留空则使用首次体重记录"></div>
    <button class="btn w" id="p-ok">保存</button>`;
  openSheet();
  $('#p-ok').onclick=()=>{
    const g=id=>$(id).value.trim();
    Object.assign(S.profile,{
      name:g('#p-n'),gender:g('#p-g'),age:g('#p-a'),height:g('#p-h'),
      birthday:g('#p-b'),shape:g('#p-s'),
      weight:parseFloat(g('#p-w'))||S.profile.weight,
      startWeight:parseFloat(g('#p-sw'))||S.profile.startWeight
    });
    const w=parseFloat(g('#p-w'));
    if(!isNaN(w)&&w>20&&w<300 && !S.weights[TODAY_KEY()]) S.weights[TODAY_KEY()]=+w.toFixed(1);
    save(); closeSheet(); renderAll();
    toast(null,'已保存','资料更新完成','check');
  };
});

/* 导入导出 */
$('#btn-export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`qing-fitness-${TODAY_KEY()}.json`;
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast(null,'已导出','JSON 文件已下载','check');
});
$('#btn-import').addEventListener('click',()=>$('#file-import').click());
$('#file-import').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      S=deepMerge(clone(DEFAULT),d);
      save(); applyTheme(); buildNav(); renderAll();
      toast(null,'导入成功','数据已恢复','check');
    }catch(err){ toast(null,'导入失败','文件格式不正确','close') }
  };
  r.readAsText(f); e.target.value='';
});
$('#btn-reset').addEventListener('click',()=>{
  $('#sheet-body').innerHTML=`
    <h2>清空所有数据</h2>
    <p class="hint">将删除全部打卡、体重、饮食与个人资料，且无法恢复。建议先导出备份。</p>
    <button class="btn w ghost" id="r-no" style="margin-bottom:9px">取消</button>
    <button class="btn w" id="r-yes" style="background:var(--clay);box-shadow:none">确认清空</button>`;
  openSheet();
  $('#r-no').onclick=closeSheet;
  $('#r-yes').onclick=()=>{
    localStorage.removeItem(KEY);
    S=clone(DEFAULT);
    save(); closeSheet(); applyTheme(); buildNav(); renderAll();
    toast(null,'已清空','可以重新开始了','check');
  };
});
