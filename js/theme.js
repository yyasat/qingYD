'use strict';
/* ============================================================
   主题
   ============================================================ */
const mq=window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){
  const t=S.settings.theme;
  const dark = t==='dark' || (t==='auto' && mq.matches);
  document.documentElement.dataset.theme = dark?'dark':'light';
  const mt=document.querySelector('meta[name=theme-color]');
  if(mt) mt.content = dark?'#13181e':'#eef1f5';
}
mq.addEventListener('change',()=>{ if(S.settings.theme==='auto') applyTheme() });
$$('#seg-theme button').forEach(b=>{
  b.innerHTML = {auto:I.spark(14)+' 自动',light:I.sun(14)+' 日间',dark:I.moon(14)+' 夜间'}[b.dataset.theme];
  b.addEventListener('click',()=>{
    S.settings.theme=b.dataset.theme; save(); applyTheme();
    $$('#seg-theme button').forEach(x=>x.classList.toggle('on',x===b));
  });
});