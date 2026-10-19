'use strict';
/* ============================================================
   动作管理系统
   ============================================================ */

// 4.1.1 打开动作详情
function openActionDetail(taskId) {
  const day = ensureToday();
  const task = day.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const howTo = task.howTo || '';
  
  $('#sheet-body').innerHTML = `
    <h2>${esc(task.name)}</h2>
    <div class="stat-row" style="margin-bottom:16px">
      <div class="stat"><b>${task.dur}</b><span>分钟</span></div>
      <div class="stat"><b>${esc(task.cat||'运动')}</b><span>类型</span></div>
      <div class="stat"><b>${task.hasJump?'有':'无'}</b><span>跳跃</span></div>
    </div>
    
    <div class="card flat" style="margin-bottom:14px">
      <div class="fs12 muted" style="margin-bottom:8px">动作说明</div>
      ${howTo ? `<div style="font-size:13px;line-height:1.6;color:var(--text);white-space:pre-wrap">${esc(howTo)}</div>` : '<div class="fs12 muted">暂无说明</div>'}
    </div>
    
    <button class="btn w ghost" id="btn-edit-action" style="margin-bottom:9px">
      ${I.edit(14)} 编辑动作说明
    </button>
    <button class="btn w" id="btn-close-action">关闭</button>
  `;
  
  openSheet();
  
  $('#btn-edit-action').onclick = () => {
    openEditActionDetail(taskId);
  };
  
  $('#btn-close-action').onclick = closeSheet;
}

// 4.1.2 编辑动作详情
function openEditActionDetail(taskId) {
  const day = ensureToday();
  const task = day.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  $('#sheet-body').innerHTML = `
    <h2>编辑动作详情</h2>
    <div class="field">
      <label>动作名称</label>
      <input class="inp" id="action-name" value="${esc(task.name)}">
    </div>
    <div class="field">
      <label>动作说明（如何做、注意事项）</label>
      <textarea class="inp" id="action-howto" placeholder="例如：\n1. 双脚并拢站立\n2. 向上跳起时双臂上举\n3. 落地时保持膝盖微曲\n\n注意：落地轻柔，避免膝盖受伤">${esc(task.howTo||'')}</textarea>
    </div>
    <div class="field">
      <label>跳跃属性</label>
      <div class="seg">
        <button class="${!task.hasJump?'on':''}" data-jump="false">无跳跃</button>
        <button class="${task.hasJump?'on':''}" data-jump="true">有跳跃</button>
      </div>
    </div>
    <button class="btn w" id="save-action">保存</button>
  `;
  
  openSheet();
  
  $$('[data-jump]').forEach(btn => {
    btn.onclick = () => {
      $$('[data-jump]').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
    };
  });
  
  $('#save-action').onclick = () => {
    task.name = $('#action-name').value.trim() || task.name;
    task.howTo = $('#action-howto').value.trim();
    task.hasJump = $$('[data-jump].on')[0]?.dataset.jump === 'true';
    
    save();
    closeSheet();
    renderToday();
    toast(null, '已保存', '动作详情已更新', 'check');
  };
}

// 4.2.2 每日首次打开选择跳跃版本
function showDailyJumpChoice() {
  const k = TODAY_KEY();
  const day = getDay(k);
  
  // 如果今天已经选择过或已有任务，不再显示
  if (day && (day.jumpChoiceMade || (day.tasks && day.tasks.length > 0))) {
    return;
  }
  
  // 检查是否今天首次打开
  const lastOpen = localStorage.getItem('lastOpenDate');
  if (lastOpen === k) return;
  
  localStorage.setItem('lastOpenDate', k);
  
  setTimeout(() => {
    $('#sheet-body').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="width:60px;height:60px;margin:0 auto 16px;border-radius:50%;background:var(--accent-soft);display:grid;place-items:center">
          ${I.rope(28)}
        </div>
        <h2 style="margin:0 0 8px">选择今日训练版本</h2>
        <p class="hint">根据身体状况选择合适的强度</p>
      </div>
      
      <button class="btn w" id="choose-jump" style="margin-bottom:12px">
        ${I.flame(16)} 有跳跃版本
        <div class="fs12 muted" style="margin-top:4px;font-weight:400">适合体力充沛，追求高强度</div>
      </button>
      
      <button class="btn w ghost" id="choose-no-jump">
        ${I.heart(16)} 无跳跃版本
        <div class="fs12 muted" style="margin-top:4px;font-weight:400">适合保护膝盖，低冲击训练</div>
      </button>
    `;
    
    openSheet();
    
    $('#choose-jump').onclick = () => {
      loadPlanWithJumpPreference(true);
      closeSheet();
    };
    
    $('#choose-no-jump').onclick = () => {
      loadPlanWithJumpPreference(false);
      closeSheet();
    };
  }, 800);
}

// 根据跳跃偏好载入计划
function loadPlanWithJumpPreference(hasJump) {
  const day = ensureToday();
  day.tasks = buildPlan(TODAY_KEY());
  
  // 设置跳跃属性（默认跳绳类动作有跳跃）
  day.tasks.forEach(t => {
    if (t.type === 'jump') {
      t.hasJump = hasJump;
    }
  });
  
  day.jumpChoiceMade = true;
  day.loaded = true;
  save();
  renderToday();
  
  toast(null, '已载入', hasJump ? '有跳跃版本' : '无跳跃版本', 'spark');
}

// 4.2.3 添加自定义动作组
function openAddActionGroup() {
  $('#sheet-body').innerHTML = `
    <h2>添加动作组</h2>
    <div class="field">
      <label>动作组名称</label>
      <input class="inp" id="group-name" placeholder="例如：晨间拉伸组合">
    </div>
    <div id="actions-in-group">
      <div class="field">
        <label>动作 1</label>
        <input class="inp action-name-input" placeholder="动作名称">
      </div>
    </div>
    <button class="btn w ghost sm" id="add-action-field" style="margin:10px 0">
      ${I.plus(14)} 添加动作
    </button>
    <button class="btn w" id="save-action-group">保存动作组</button>
  `;
  
  openSheet();
  
  $('#add-action-field').onclick = () => {
    const container = $('#actions-in-group');
    const index = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'field';
    div.innerHTML = `
      <label>动作 ${index}</label>
      <input class="inp action-name-input" placeholder="动作名称">
    `;
    container.appendChild(div);
  };
  
  $('#save-action-group').onclick = () => {
    const groupName = $('#group-name').value.trim();
    const actionInputs = $$('.action-name-input');
    const actions = actionInputs.map(inp => inp.value.trim()).filter(n => n.length > 0);
    
    if (!groupName || actions.length === 0) {
      toast(null, '请填写完整', '动作组名称和至少一个动作', 'close');
      return;
    }
    
    // 保存到自定义动作组
    if (!S.customActionGroups) S.customActionGroups = [];
    
    S.customActionGroups.push({
      id: uid(),
      name: groupName,
      actions: actions.map(name => ({
        id: uid(),
        name: name,
        type: 'other',
        cat: '自定义',
        dur: 10,
        hasJump: false,
        howTo: ''
      }))
    });
    
    save();
    closeSheet();
    toast(null, '已保存', `动作组"${groupName}"已创建`, 'check');
  };
}

// 4.3.1 设置里程碑间隔
function openMilestoneSettings() {
  const currentInterval = S.settings.mile || 7;
  
  $('#sheet-body').innerHTML = `
    <h2>里程碑设置</h2>
    <div class="field">
      <label>里程碑间隔（天）</label>
      <select class="inp" id="mile-interval">
        ${[3,5,7,10,14,21,30].map(d => 
          `<option value="${d}" ${d===currentInterval?'selected':''}>${d} 天</option>`
        ).join('')}
      </select>
    </div>
    <p class="hint">每达到设定天数，会弹出里程碑庆祝</p>
    <button class="btn w" id="save-mile">保存</button>
  `;
  
  openSheet();
  
  $('#save-mile').onclick = () => {
    const val = parseInt($('#mile-interval').value);
    S.settings.mile = val;
    save();
    closeSheet();
    renderCal();
    toast(null, '已保存', `里程碑间隔：${val} 天`, 'check');
  };
}
