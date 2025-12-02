// assets/js/welcome.js
// Скрипт анімації конверта

document.addEventListener('DOMContentLoaded', () => {
  const envelope = document.getElementById('envelope');
  const btn = document.getElementById('btn-open');

  if(!btn) return;

  btn.addEventListener('click', async (ev) => {
    // Ефект кліку (звук, якщо політика браузера дозволяє)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 420;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      o.connect(g); g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.45);
    } catch(e) {}

    // Додаємо клас для анімації відкриття
    envelope.classList.add('open');

    // Чекаємо, поки конверт відкриється, і переходимо
    // Час підібраний так, щоб наступна сторінка з'явилася "зсередини"
    setTimeout(() => {
      window.location.href = 'quest.html?id=001';
    }, 800); 
  });
});