'use strict';
/* ============================================================
   记录与数据展示
   ============================================================ */

// 5.2.1 饮水历史记录
function openWaterHistory() {
  const dates = Object.keys(S.meals || {}).sort().reverse();
  const records = dates.map(date => {
    const meal = S.meals[date];
    const water = meal && meal.water ? meal.water : 0;
    return { date, water };
  }).filter(r => r.water > 0);
  
  if (records.length === 0) {
    $('#sheet-body').innerHTML = `
      <h2>饮水记录</h2>
      <div class="empty" style="padding:60px 20px">
        ${I.water(40)}
        <p>还没有饮水记录<br>每天记得喝水哦</p>
      </div>
    `;
    openSheet();
    return;
  }
  
  const historyHtml = records.map(r => {
    const d = parseD(r.date);
    const dateStr = `${d.getMonth()+1}月${d.getDate()}日`;
    return `
      <div class="food">
        <div class="fi">${I.water(17)}</div>
        <div style="flex:1"><b>${dateStr}</b></div>
        <div class="fk">${r.water} 杯</div>
      </div>
    `;
  }).join('');
  
  $('#sheet-body').innerHTML = `
    <h2>饮水记录</h2>
    <p class="hint">共 ${records.length} 天有记录</p>
    <div class="card flat">${historyHtml}</div>
  `;
  
  openSheet();
}

// 5.2.2 餐饮历史记录
function openMealHistory() {
  const dates = Object.keys(S.meals || {}).sort().reverse();
  const records = dates.map(date => {
    const meal = S.meals[date];
    const items = meal && meal.items ? meal.items : [];
    const totalKcal = items.reduce((sum, item) => sum + (item.kcal || 0), 0);
    return { date, items, totalKcal };
  }).filter(r => r.items.length > 0);
  
  if (records.length === 0) {
    $('#sheet-body').innerHTML = `
      <h2>餐饮记录</h2>
      <div class="empty" style="padding:60px 20px">
        ${I.bowl(40)}
        <p>还没有餐饮记录<br>记录饮食更了解自己</p>
      </div>
    `;
    openSheet();
    return;
  }
  
  const historyHtml = records.map(r => {
    const d = parseD(r.date);
    const dateStr = `${d.getMonth()+1}月${d.getDate()}日`;
    const itemsStr = r.items.map(item => item.name).join('、');
    return `
      <div style="padding:14px;border-bottom:1px solid var(--line)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <b style="font-size:14px">${dateStr}</b>
          <span style="font-size:13px;color:var(--accent);font-weight:650">${r.totalKcal} kcal</span>
        </div>
        <div style="font-size:12px;color:var(--text-2);line-height:1.5">${itemsStr}</div>
      </div>
    `;
  }).join('');
  
  $('#sheet-body').innerHTML = `
    <h2>餐饮记录</h2>
    <p class="hint">共 ${records.length} 天有记录</p>
    <div class="card flat">${historyHtml}</div>
  `;
  
  openSheet();
}

// 5.3.1 添加视频链接
function openAddVideo() {
  $('#sheet-body').innerHTML = `
    <h2>添加训练视频</h2>
    <div class="field">
      <label>视频链接</label>
      <input class="inp" id="video-url" placeholder="粘贴小红书、抖音、B站等视频链接">
    </div>
    <div class="field">
      <label>视频标题（可选）</label>
      <input class="inp" id="video-title" placeholder="例如：帕梅拉全身燃脂">
    </div>
    <p class="hint">支持的平台：小红书、抖音、快手、B站、YouTube</p>
    <button class="btn w" id="add-video-btn">添加</button>
  `;
  
  openSheet();
  
  $('#add-video-btn').onclick = () => {
    const url = $('#video-url').value.trim();
    const title = $('#video-title').value.trim();
    
    if (!url) {
      toast(null, '请输入链接', '', 'close');
      return;
    }
    
    const day = ensureToday();
    if (!day.videos) day.videos = [];
    
    day.videos.push({
      id: uid(),
      url: url,
      title: title || '训练视频',
      addedAt: Date.now()
    });
    
    save();
    closeSheet();
    renderToday();
    toast(null, '已添加', '视频已添加到今日项目', 'check');
  };
}

// 5.3.2 & 5.3.3 解析并播放视频
function openVideoPlayer(videoId) {
  const day = ensureToday();
  if (!day.videos) return;
  
  const video = day.videos.find(v => v.id === videoId);
  if (!video) return;
  
  // 5.3.2 尝试提取实际视频地址
  const embedUrl = getEmbedUrl(video.url);
  
  if (!embedUrl) {
    $('#sheet-body').innerHTML = `
      <h2>${esc(video.title)}</h2>
      <p class="hint" style="color:var(--clay)">
        ${I.close(16)} 暂不支持此平台的站内播放
      </p>
      <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin:16px 0">
        由于平台限制，无法直接播放。点击下方按钮在新标签页打开。
      </p>
      <button class="btn w" id="open-external">在浏览器中打开</button>
    `;
    
    openSheet();
    
    $('#open-external').onclick = () => {
      window.open(video.url, '_blank');
      closeSheet();
    };
    
    return;
  }
  
  // 5.3.3 ~ 5.3.6 内置播放器
  $('#sheet-body').innerHTML = `
    <h2>${esc(video.title)}</h2>
    <div style="position:relative;background:#000;border-radius:12px;overflow:hidden;margin-bottom:16px">
      <video id="video-player" style="width:100%;display:block" controls>
        <source src="${embedUrl}" type="video/mp4">
        您的浏览器不支持视频播放
      </video>
    </div>
    <div class="card flat" style="text-align:center;padding:20px">
      <div class="fs12 muted" style="margin-bottom:8px">倒计时</div>
      <div id="video-countdown" style="font-size:32px;font-weight:650;color:var(--accent);font-variant-numeric:tabular-nums">--:--</div>
      <div class="fs12 muted" style="margin-top:8px">倒计时不受播放速度影响</div>
    </div>
    <button class="btn w ghost" id="close-video">关闭</button>
  `;
  
  openSheet();
  
  const videoEl = $('#video-player');
  const countdownEl = $('#video-countdown');
  let countdownInterval = null;
  let startTime = null;
  let totalDuration = 0;
  
  // 5.3.3 读取视频总时长
  videoEl.addEventListener('loadedmetadata', () => {
    totalDuration = Math.floor(videoEl.duration);
    if (totalDuration > 0) {
      countdownEl.textContent = formatTime(totalDuration);
    }
  });
  
  // 5.3.4 点击播放开始倒计时
  videoEl.addEventListener('play', () => {
    if (!startTime) {
      startTime = Date.now();
      
      // 5.3.5 倒计时独立运行，不受播放速度影响
      countdownInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, totalDuration - elapsed);
        countdownEl.textContent = formatTime(remaining);
        
        // 5.3.6 倒计时结束自动暂停并记录用时
        if (remaining === 0) {
          clearInterval(countdownInterval);
          videoEl.pause();
          
          // 记录到总耗时
          if (typeof addVideoTimeToTotal === 'function') {
            addVideoTimeToTotal(totalDuration);
          }
          
          toast(null, '训练完成', `已记录 ${formatTime(totalDuration)}`, 'check');
        }
      }, 1000);
    }
  });
  
  videoEl.addEventListener('pause', () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  });
  
  $('#close-video').onclick = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    videoEl.pause();
    closeSheet();
  };
}

// 尝试获取嵌入式播放地址
function getEmbedUrl(url) {
  // B站
  if (url.includes('bilibili.com')) {
    const bvMatch = url.match(/BV[\w]+/);
    if (bvMatch) {
      return `//player.bilibili.com/player.html?bvid=${bvMatch[0]}&autoplay=0`;
    }
  }
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const idMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (idMatch) {
      return `https://www.youtube.com/embed/${idMatch[1]}`;
    }
  }
  
  // 直接返回原链接尝试
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }
  
  // 其他平台暂不支持
  return null;
}

// 渲染视频列表
function renderVideoList() {
  const day = ensureToday();
  if (!day.videos || day.videos.length === 0) return '';
  
  return `
    <div class="sec-title">训练视频</div>
    <div class="card">
      ${day.videos.map(v => `
        <div class="food" style="cursor:pointer" onclick="openVideoPlayer('${v.id}')">
          <div class="fi">${I.mountain(17)}</div>
          <div style="flex:1"><b>${esc(v.title)}</b></div>
          <div>${I.right(14)}</div>
        </div>
      `).join('')}
    </div>
  `;
}
