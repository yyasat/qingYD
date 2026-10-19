'use strict';
/* ============================================================
   计时系统
   ============================================================ */

// 总耗时计时器状态
let totalTimerInterval = null;
let taskTimerIntervals = {}; // {taskId: intervalId}

/* ============================================================
   2.1 总耗时计时
   ============================================================ */

// 2.1.1 开始总耗时计时
function startTotalTimer() {
  const day = ensureToday();
  const now = Date.now();
  
  if (!day.totalTimer) {
    day.totalTimer = {
      start: now,
      end: null,
      elapsed: 0
    };
  } else if (day.totalTimer.end) {
    // 如果已停止，重新开始
    day.totalTimer.start = now - day.totalTimer.elapsed * 1000;
    day.totalTimer.end = null;
  }
  
  save();
  
  // 启动UI更新
  if (!totalTimerInterval) {
    totalTimerInterval = setInterval(updateTotalTimerUI, 1000);
  }
  
  updateTotalTimerUI();
  updateTotalTimerButton();
}

// 2.1.1 停止总耗时计时
function stopTotalTimer() {
  const day = ensureToday();
  if (!day.totalTimer || day.totalTimer.end) return;
  
  const now = Date.now();
  day.totalTimer.end = now;
  day.totalTimer.elapsed = Math.floor((now - day.totalTimer.start) / 1000);
  
  save();
  
  if (totalTimerInterval) {
    clearInterval(totalTimerInterval);
    totalTimerInterval = null;
  }
  
  updateTotalTimerUI();
  updateTotalTimerButton();
}

// 获取总耗时（秒）
function getTotalElapsed() {
  const day = S.days[TODAY_KEY()];
  if (!day || !day.totalTimer) return 0;
  
  if (day.totalTimer.end) {
    return day.totalTimer.elapsed;
  } else {
    return Math.floor((Date.now() - day.totalTimer.start) / 1000);
  }
}

// 2.1.2 格式化时间显示（秒转 HH:MM:SS）
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 2.1.2 格式化时间戳为时间（HH:MM）
function formatTimestamp(ts) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// 更新总耗时UI显示
function updateTotalTimerUI() {
  const elapsed = getTotalElapsed();
  const el = $('#total-timer-display');
  if (el) {
    el.textContent = formatTime(elapsed);
  }
  
  const day = S.days[TODAY_KEY()];
  if (day && day.totalTimer) {
    const timeRange = $('#total-timer-range');
    if (timeRange) {
      const start = formatTimestamp(day.totalTimer.start);
      const end = day.totalTimer.end ? formatTimestamp(day.totalTimer.end) : '进行中';
      timeRange.textContent = `${start} - ${end}`;
    }
  }
}

// 更新总耗时按钮状态
function updateTotalTimerButton() {
  const day = S.days[TODAY_KEY()];
  const btn = $('#btn-total-timer');
  if (!btn) return;
  
  const isRunning = day && day.totalTimer && !day.totalTimer.end;
  
  if (isRunning) {
    btn.innerHTML = `${I.clock(16)} 停止计时`;
    btn.classList.add('soft');
    btn.classList.remove('ghost');
  } else {
    btn.innerHTML = `${I.clock(16)} 开始计时`;
    btn.classList.remove('soft');
    btn.classList.add('ghost');
  }
}

/* ============================================================
   2.2 各动作耗时
   ============================================================ */

// 2.2.2 开始动作计时（倒计时或正计时）
function startTaskTimer(taskId, mode = 'count-up') {
  const day = ensureToday();
  const task = day.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const now = Date.now();
  
  if (!day.taskTimers) day.taskTimers = {};
  
  day.taskTimers[taskId] = {
    start: now,
    elapsed: 0,
    mode: mode, // 'count-up' | 'count-down'
    target: task.customDur || task.dur // 目标时长（分钟）
  };
  
  save();
  
  // 启动UI更新
  taskTimerIntervals[taskId] = setInterval(() => updateTaskTimerUI(taskId), 1000);
  
  updateTaskTimerUI(taskId);
}

// 2.2.3 停止动作计时
function stopTaskTimer(taskId) {
  const day = ensureToday();
  if (!day.taskTimers || !day.taskTimers[taskId]) return;
  
  const now = Date.now();
  const timer = day.taskTimers[taskId];
  const elapsed = Math.floor((now - timer.start) / 1000);
  
  // 记录实际耗时
  const task = day.tasks.find(t => t.id === taskId);
  if (task) {
    task.actualTime = elapsed;
  }
  
  // 删除计时器
  delete day.taskTimers[taskId];
  
  save();
  
  if (taskTimerIntervals[taskId]) {
    clearInterval(taskTimerIntervals[taskId]);
    delete taskTimerIntervals[taskId];
  }
  
  updateTaskTimerUI(taskId);
  
  // 如果没有开启总耗时，且所有动作完成，自动汇总
  checkAndSumTaskTimes();
}

// 获取动作耗时（秒）
function getTaskElapsed(taskId) {
  const day = S.days[TODAY_KEY()];
  if (!day || !day.taskTimers || !day.taskTimers[taskId]) {
    // 返回已记录的实际耗时
    const task = day && day.tasks.find(t => t.id === taskId);
    return task && task.actualTime ? task.actualTime : 0;
  }
  
  const timer = day.taskTimers[taskId];
  return Math.floor((Date.now() - timer.start) / 1000);
}

// 更新动作计时UI
function updateTaskTimerUI(taskId) {
  const el = $(`[data-timer-display="${taskId}"]`);
  if (!el) return;
  
  const day = S.days[TODAY_KEY()];
  const timer = day && day.taskTimers && day.taskTimers[taskId];
  
  if (timer) {
    const elapsed = Math.floor((Date.now() - timer.start) / 1000);
    const target = timer.target * 60; // 转秒
    
    if (timer.mode === 'count-down') {
      const remaining = Math.max(0, target - elapsed);
      el.textContent = formatTime(remaining);
      if (remaining === 0) {
        stopTaskTimer(taskId);
        if (navigator.vibrate) try { navigator.vibrate([200, 100, 200]) } catch(e) {}
        toast(null, '时间到', '动作计时完成', 'check');
      }
    } else {
      el.textContent = formatTime(elapsed);
    }
  } else {
    // 显示已记录的时间
    const task = day && day.tasks.find(t => t.id === taskId);
    if (task && task.actualTime) {
      el.textContent = formatTime(task.actualTime);
    } else {
      el.textContent = '00:00';
    }
  }
}

// 2.2.4 检查并汇总动作时间到总耗时
function checkAndSumTaskTimes() {
  const day = ensureToday();
  
  // 如果总耗时已开启，不自动汇总
  if (day.totalTimer) return;
  
  // 检查所有动作是否完成
  const allDone = day.tasks.length > 0 && day.tasks.every(t => t.done);
  if (!allDone) return;
  
  // 汇总所有动作的实际耗时
  let totalSeconds = 0;
  day.tasks.forEach(t => {
    if (t.actualTime) {
      totalSeconds += t.actualTime;
    }
  });
  
  // 如果有耗时，创建总耗时记录
  if (totalSeconds > 0) {
    const now = Date.now();
    day.totalTimer = {
      start: now - totalSeconds * 1000,
      end: now,
      elapsed: totalSeconds
    };
    save();
    updateTotalTimerUI();
    toast(null, '已汇总', `今日总耗时 ${formatTime(totalSeconds)}`, 'spark');
  }
}

/* ============================================================
   2.3 后台保活与计时精准
   ============================================================ */

// 2.3.1 & 2.3.2 后台保活机制
function initTimerPersistence() {
  // 使用 localStorage 持久化计时器状态
  // 页面可见性变化时保存状态
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 页面隐藏时保存当前状态
      save();
    } else {
      // 页面重新可见时恢复计时器
      resumeTimers();
    }
  });
  
  // 2.3.3 防止计时漂移：使用 Date.now() 而非累加计数
  // 页面加载时恢复计时器
  resumeTimers();
}

// 恢复计时器
function resumeTimers() {
  const day = S.days[TODAY_KEY()];
  if (!day) return;
  
  // 恢复总耗时计时器
  if (day.totalTimer && !day.totalTimer.end) {
    if (!totalTimerInterval) {
      totalTimerInterval = setInterval(updateTotalTimerUI, 1000);
    }
    updateTotalTimerUI();
  }
  
  // 恢复动作计时器
  if (day.taskTimers) {
    Object.keys(day.taskTimers).forEach(taskId => {
      if (!taskTimerIntervals[taskId]) {
        taskTimerIntervals[taskId] = setInterval(() => updateTaskTimerUI(taskId), 1000);
      }
      updateTaskTimerUI(taskId);
    });
  }
  
  updateTotalTimerButton();
}

// 清理所有计时器
function clearAllTimers() {
  if (totalTimerInterval) {
    clearInterval(totalTimerInterval);
    totalTimerInterval = null;
  }
  
  Object.values(taskTimerIntervals).forEach(id => clearInterval(id));
  taskTimerIntervals = {};
}

/* ============================================================
   2.4 视频倒计时接入（预留接口）
   ============================================================ */

// 2.4.1 接收视频倒计时结束产生的用时
function addVideoTimeToTotal(seconds) {
  const day = ensureToday();
  
  if (day.totalTimer && !day.totalTimer.end) {
    // 如果总耗时正在运行，无需额外处理（自动计入）
    return;
  }
  
  // 如果总耗时未开启，添加到总耗时
  if (!day.totalTimer) {
    const now = Date.now();
    day.totalTimer = {
      start: now - seconds * 1000,
      end: now,
      elapsed: seconds
    };
  } else {
    // 已停止，累加时间
    day.totalTimer.elapsed += seconds;
  }
  
  save();
  updateTotalTimerUI();
  toast(null, '视频时长已记录', `计入总耗时 ${formatTime(seconds)}`, 'spark');
}

/* ============================================================
   初始化
   ============================================================ */
function initTimers() {
  initTimerPersistence();
  
  // 页面卸载前保存
  window.addEventListener('beforeunload', () => {
    save();
  });
}

// 启动时初始化
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimers);
  } else {
    initTimers();
  }
}
