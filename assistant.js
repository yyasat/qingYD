'use strict';
/* ============================================================
   管家 AI 系统
   ============================================================ */

// 6.2.5 默认人格模板
const DEFAULT_PERSONA = `你是用户的私人健身管家，名字可以由用户自定义。你的职责是：

1. 陪伴用户完成每日锻炼目标
2. 分析食物热量并给出建议
3. 根据训练数据生成鼓励性评语
4. 在用户需要时提供支持和建议

性格特点：
- 温暖友善，像贴心的朋友
- 专业但不说教，用轻松的方式传递知识
- 善于鼓励，永远不打击用户的热情
- 幽默风趣，适当调侃但不过分
- 关注用户的感受和进步

说话风格：
- 简洁明了，不啰嗦
- 多用"咱们"、"一起"等拉近距离的词
- 适当使用emoji表情
- 避免过度专业术语
- 根据用户完成情况调整语气（完成得好就更热情）`;

// 全局点击追踪
let lastClickPos = { x: 0, y: 0, time: 0 };
let clickCount = 0;
let clickTimer = null;

document.addEventListener('click', (e) => {
  lastClickPos = {
    x: e.clientX,
    y: e.clientY,
    time: Date.now()
  };
  
  // 6.4.2 点击计数
  clickCount++;
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    if (clickCount >= (S.assistantSettings?.clickThreshold || 5)) {
      if (S.assistantSettings?.globalMode) {
        triggerAssistant('global');
      }
    }
    clickCount = 0;
  }, 2000);
});

// 6.1.1 保存 API 配置
function saveAPIConfig(url, key, model) {
  if (!S.assistantSettings) S.assistantSettings = {};
  S.assistantSettings.apiUrl = url;
  S.assistantSettings.apiKey = key;
  S.assistantSettings.model = model;
  save();
}

// 6.1.2 拉取模型列表
async function fetchModelList() {
  const settings = S.assistantSettings;
  if (!settings || !settings.apiUrl || !settings.apiKey) {
    throw new Error('请先配置 API URL 和密钥');
  }
  
  try {
    const response = await fetch(`${settings.apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`
      }
    });
    
    if (!response.ok) throw new Error('获取模型列表失败');
    
    const data = await response.json();
    return data.data || data.models || [];
  } catch (error) {
    throw new Error('连接失败：' + error.message);
  }
}

// 6.1.3 调用 AI 接口
async function callAI(messages, options = {}) {
  const settings = S.assistantSettings;
  if (!settings || !settings.apiUrl || !settings.apiKey) {
    throw new Error('请先配置管家 API');
  }
  
  try {
    const response = await fetch(`${settings.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-3.5-turbo',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500
      })
    });
    
    if (!response.ok) throw new Error('API 调用失败');
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    throw new Error('调用失败：' + error.message);
  }
}

// 6.1.5 食品热量分析
async function analyzeFoodCalories(foodName) {
  const persona = getCurrentPersona();
  
  const messages = [
    { role: 'system', content: persona },
    { role: 'user', content: `请分析食物"${foodName}"的热量信息，按以下格式输出：
食物名称：
热量区间：（每100g或每份）
主要来源：（碳水/脂肪/蛋白质占比）
一句点评：（简短建议）` }
  ];
  
  return await callAI(messages);
}

// 6.1.6 今日评语
async function generateDailyComment() {
  const day = S.days[TODAY_KEY()];
  if (!day) return '今天还没有训练记录';
  
  const totalTime = day.totalTimer ? formatTime(day.totalTimer.elapsed || 0) : '未记录';
  const tasks = day.tasks || [];
  const completedTasks = tasks.filter(t => t.done);
  const taskTimes = tasks.map(t => `${t.name}: ${t.actualTime ? formatTime(t.actualTime) : '未计时'}`).join('\n');
  
  const persona = getCurrentPersona();
  const style = S.assistantSettings?.commentStyle || 'encouraging';
  
  const stylePrompts = {
    encouraging: '用鼓励和赞美的语气',
    humorous: '用幽默风趣的语气',
    professional: '用专业但温暖的语气',
    casual: '用轻松随意的语气'
  };
  
  const messages = [
    { role: 'system', content: persona },
    { role: 'user', content: `今天的训练情况：
总耗时：${totalTime}
完成项目：${completedTasks.length}/${tasks.length}
各项用时：
${taskTimes}

请${stylePrompts[style]}生成一条今日评语（50字以内），记住：永远不打击用户热情，即使完成度不高也要找到值得鼓励的点。` }
  ];
  
  return await callAI(messages);
}

// 获取当前人格
function getCurrentPersona() {
  const settings = S.assistantSettings;
  if (!settings) return DEFAULT_PERSONA;
  
  // 如果选用了方案
  if (settings.currentScheme) {
    const scheme = (settings.personaSchemes || []).find(s => s.id === settings.currentScheme);
    if (scheme) return scheme.content;
  }
  
  // 否则使用自定义内容
  return settings.customPersona || DEFAULT_PERSONA;
}

// 6.3.1 & 6.3.2 显示气泡（避开点击位置）
function showBubble(content) {
  // 移除旧气泡
  const oldBubble = $('.assistant-bubble');
  if (oldBubble) oldBubble.remove();
  
  const bubble = document.createElement('div');
  bubble.className = 'assistant-bubble';
  bubble.innerHTML = `
    <div class="assistant-bubble-content">${esc(content)}</div>
    <button class="assistant-bubble-close">${I.close(14)}</button>
  `;
  
  document.body.appendChild(bubble);
  
  // 6.3.2 计算位置（避开最近点击）
  const now = Date.now();
  const timeSinceClick = now - lastClickPos.time;
  
  let x, y;
  if (timeSinceClick < 1000) {
    // 最近有点击，避开该区域
    const avoidRadius = 150;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    
    // 选择离点击位置最远的角落
    const corners = [
      { x: 20, y: 100 },
      { x: screenW - 320, y: 100 },
      { x: 20, y: screenH - 200 },
      { x: screenW - 320, y: screenH - 200 }
    ];
    
    const distances = corners.map(c => 
      Math.sqrt(Math.pow(c.x - lastClickPos.x, 2) + Math.pow(c.y - lastClickPos.y, 2))
    );
    
    const farthest = corners[distances.indexOf(Math.max(...distances))];
    x = farthest.x;
    y = farthest.y;
  } else {
    // 随机位置
    x = 20 + Math.random() * (window.innerWidth - 320);
    y = 100 + Math.random() * (window.innerHeight - 300);
  }
  
  bubble.style.left = `${x}px`;
  bubble.style.top = `${y}px`;
  
  // 动画入场
  requestAnimationFrame(() => {
    bubble.classList.add('bubble-show');
  });
  
  // 关闭按钮
  bubble.querySelector('.assistant-bubble-close').onclick = () => {
    bubble.classList.remove('bubble-show');
    setTimeout(() => bubble.remove(), 300);
  };
  
  // 3秒后自动消失
  setTimeout(() => {
    if (bubble.parentNode) {
      bubble.classList.remove('bubble-show');
      setTimeout(() => bubble.remove(), 300);
    }
  }, 5000);
}

// 6.4.2 & 6.4.3 触发管家
async function triggerAssistant(context = 'general') {
  const name = S.assistantSettings?.name || '管家';
  
  try {
    let content = '';
    
    if (context === 'global') {
      // 全局唤醒
      content = await generateContextResponse();
    } else if (context === 'daily-comment') {
      // 今日评语
      content = await generateDailyComment();
    } else if (context.startsWith('food:')) {
      // 食物分析
      const foodName = context.split(':')[1];
      content = await analyzeFoodCalories(foodName);
    }
    
    showBubble(content);
  } catch (error) {
    showBubble(`${name}暂时无法回应：${error.message}`);
  }
}

// 生成上下文回应
async function generateContextResponse() {
  const persona = getCurrentPersona();
  const viewName = getCurrentViewName();
  const recentActions = getRecentActions();
  
  const messages = [
    { role: 'system', content: persona },
    { role: 'user', content: `用户在"${viewName}"页面连续点击了多次。最近操作：${recentActions}。请简短回应（20字以内），可以调侃或关心。` }
  ];
  
  return await callAI(messages, { maxTokens: 100 });
}

function getCurrentViewName() {
  const views = {
    'v-today': '今日',
    'v-cal': '日历',
    'v-weight': '体重',
    'v-food': '饮食',
    'v-me': '我的'
  };
  
  const activeView = $('.view.on');
  return activeView ? (views[activeView.id] || '主页') : '主页';
}

function getRecentActions() {
  // 简化版：返回当前页面状态
  return '浏览页面';
}

// 6.4.5 快捷唤醒
function quickAssistant(feature) {
  if (!S.assistantSettings?.features?.[feature]) {
    toast(null, '未启用', '请在设置中启用该功能', 'close');
    return;
  }
  
  triggerAssistant(feature);
}
