'use strict';
/* ============================================================
   打卡系统
   ============================================================ */

// 默认励志语录
const DEFAULT_QUOTES = [
  '今天的你，比昨天更接近目标。',
  '每一次坚持，都是对未来的投资。',
  '改变不会一夜发生，但每一天都在进步。',
  '你的身体会感谢今天的努力。',
  '不是因为有希望才坚持，而是坚持了才有希望。',
  '最难的是开始，你已经做到了。',
  '健康是一场马拉松，不是短跑。',
  '每一滴汗水，都在塑造更好的自己。',
  '别小看今天的付出，它终将回报你。',
  '你比想象中更强大。'
];

// 获取励志语录
function getMotivationalQuote() {
  const customQuotes = S.quotes || [];
  const allQuotes = customQuotes.length > 0 ? customQuotes : DEFAULT_QUOTES;
  return allQuotes[Math.floor(Math.random() * allQuotes.length)];
}

// 3.3.3 计算减重
function calculateWeightLoss() {
  const startWeight = S.profile.startWeight || S.profile.weight;
  const todayWeight = S.weights[TODAY_KEY()];
  
  if (!todayWeight || !startWeight) return null;
  
  const loss = startWeight - todayWeight;
  return loss > 0 ? loss.toFixed(1) : 0;
}

// 3.1.2 检查是否完成打卡
function isCheckinComplete() {
  const day = S.days[TODAY_KEY()];
  if (!day) return false;
  
  const mode = S.settings.planMode || 'original';
  
  if (mode === 'original') {
    // 原计划模式：所有tasks完成
    return day.tasks && day.tasks.length > 0 && day.tasks.every(t => t.done);
  } else if (mode === 'custom') {
    // 自拟计划模式：所有customTasks完成
    return day.customTasks && day.customTasks.length > 0 && day.customTasks.every(t => t.done);
  } else if (mode === 'either') {
    // 任意模式：完成任意一种即可
    const originalDone = day.tasks && day.tasks.length > 0 && day.tasks.every(t => t.done);
    const customDone = day.customTasks && day.customTasks.length > 0 && day.customTasks.every(t => t.done);
    return originalDone || customDone;
  }
  
  return false;
}

// 3.2.1 检查今日打卡次数
function getTodayCheckinCount() {
  const day = S.days[TODAY_KEY()];
  return day && day.checkins ? day.checkins.length : 0;
}

function canCheckinAgain() {
  const count = getTodayCheckinCount();
  const limit = S.settings.checkinsPerDay || 1;
  return count < limit;
}

// 3.3.1 完成打卡，生成小票
function completeCheckin() {
  const day = ensureToday();
  const now = Date.now();
  
  if (!day.checkins) day.checkins = [];
  if (!S.tickets) S.tickets = {};
  if (!S.tickets[TODAY_KEY()]) S.tickets[TODAY_KEY()] = [];
  
  const quote = getMotivationalQuote();
  const weightLoss = calculateWeightLoss();
  
  const ticket = {
    id: uid(),
    timestamp: now,
    quote: quote,
    weightLoss: weightLoss,
    date: TODAY_KEY()
  };
  
  day.checkins.push({
    id: ticket.id,
    timestamp: now
  });
  
  S.tickets[TODAY_KEY()].push(ticket);
  
  save();
  
  // 显示小票
  showTicket(ticket);
}

// 3.3.1 & 3.3.6 显示小票UI
function showTicket(ticket) {
  const overlay = document.createElement('div');
  overlay.className = 'ticket-overlay';
  overlay.innerHTML = `
    <div class="ticket-container">
      <div class="ticket">
        <div class="ticket-top">
          <div class="ticket-decoration"></div>
          <div class="ticket-quote">${esc(ticket.quote)}</div>
          <div class="ticket-decoration"></div>
        </div>
        <div class="ticket-perforation">
          ${Array(20).fill('<span></span>').join('')}
        </div>
        <div class="ticket-bottom">
          <div class="ticket-date">${formatDateChinese(ticket.date)}</div>
          ${ticket.weightLoss ? `
            <div class="ticket-weight">
              <div class="ticket-weight-label">已减重</div>
              <div class="ticket-weight-value">${ticket.weightLoss} <span>kg</span></div>
            </div>
          ` : '<div class="ticket-weight-placeholder">记录体重可查看减重数据</div>'}
        </div>
      </div>
      <div class="ticket-actions">
        <button class="btn ghost" id="ticket-tear">撕下收藏</button>
        <button class="btn" id="ticket-close">关闭</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // 3.3.2 撕下动画
  $('#ticket-tear').onclick = () => {
    const ticketEl = overlay.querySelector('.ticket');
    ticketEl.classList.add('ticket-tearing');
    setTimeout(() => {
      overlay.remove();
      toast(null, '已收藏', '可在小票库中查看', 'spark');
    }, 600);
  };
  
  $('#ticket-close').onclick = () => {
    overlay.remove();
  };
  
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  
  // 动画入场
  requestAnimationFrame(() => {
    overlay.classList.add('ticket-show');
  });
}

// 格式化日期（中文）
function formatDateChinese(dateStr) {
  const d = parseD(dateStr);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

// 3.3.4 打开小票库
function openTicketGallery() {
  const allTickets = [];
  
  Object.keys(S.tickets || {}).forEach(date => {
    const tickets = S.tickets[date];
    if (tickets && tickets.length > 0) {
      allTickets.push(...tickets.map(t => ({...t, date})));
    }
  });
  
  allTickets.sort((a, b) => b.timestamp - a.timestamp);
  
  if (allTickets.length === 0) {
    $('#sheet-body').innerHTML = `
      <h2>小票库</h2>
      <div class="empty" style="padding:60px 20px">
        ${I.medal(40)}
        <p>还没有收藏的小票<br>完成打卡后撕下保存</p>
      </div>
    `;
    openSheet();
    return;
  }
  
  const ticketsHtml = allTickets.map(ticket => `
    <div class="ticket-gallery-item" data-ticket-id="${ticket.id}">
      <div class="ticket-mini">
        <div class="ticket-quote">${esc(ticket.quote)}</div>
        <div class="ticket-mini-date">${formatDateChinese(ticket.date)}</div>
      </div>
    </div>
  `).join('');
  
  $('#sheet-body').innerHTML = `
    <h2>小票库</h2>
    <p class="hint">已收藏 ${allTickets.length} 张小票</p>
    <div class="ticket-gallery">
      ${ticketsHtml}
    </div>
  `;
  
  openSheet();
  
  // 点击查看大图
  $$('.ticket-gallery-item').forEach(item => {
    item.onclick = () => {
      const ticketId = item.dataset.ticketId;
      const ticket = allTickets.find(t => t.id === ticketId);
      if (ticket) {
        closeSheet();
        setTimeout(() => showTicket(ticket), 300);
      }
    };
  });
}

// 3.3.7 编辑励志语录
function editQuotes() {
  const quotes = S.quotes && S.quotes.length > 0 ? S.quotes : [...DEFAULT_QUOTES];
  
  $('#sheet-body').innerHTML = `
    <h2>励志语录</h2>
    <p class="hint">自定义打卡小票上的励志语录，每次随机显示一条</p>
    <div id="quotes-list">
      ${quotes.map((q, i) => `
        <div class="field">
          <input class="inp" data-quote-index="${i}" value="${esc(q)}" placeholder="输入励志语录">
        </div>
      `).join('')}
    </div>
    <button class="btn w ghost sm" id="add-quote" style="margin:10px 0">
      ${I.plus(14)} 添加一条
    </button>
    <button class="btn w" id="save-quotes">保存</button>
  `;
  
  openSheet();
  
  $('#add-quote').onclick = () => {
    const list = $('#quotes-list');
    const index = list.children.length;
    const div = document.createElement('div');
    div.className = 'field';
    div.innerHTML = `<input class="inp" data-quote-index="${index}" value="" placeholder="输入励志语录">`;
    list.appendChild(div);
  };
  
  $('#save-quotes').onclick = () => {
    const inputs = $$('[data-quote-index]');
    const newQuotes = inputs.map(inp => inp.value.trim()).filter(q => q.length > 0);
    
    if (newQuotes.length === 0) {
      toast(null, '至少保留一条', '语录不能全部为空', 'close');
      return;
    }
    
    S.quotes = newQuotes;
    save();
    closeSheet();
    toast(null, '已保存', `共 ${newQuotes.length} 条语录`, 'check');
  };
}

// 3.1.1 切换计划模式
function switchPlanMode(mode) {
  S.settings.planMode = mode;
  save();
  renderToday();
  toast(null, '已切换', mode === 'original' ? '原计划模式' : mode === 'custom' ? '自拟计划模式' : '任意完成模式', 'spark');
}

// 3.4.1 添加今日感悟
function saveReflection(text) {
  const day = ensureToday();
  day.reflection = text;
  save();
}
