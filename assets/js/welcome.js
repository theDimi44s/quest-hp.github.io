// assets/js/welcome.js
document.addEventListener('DOMContentLoaded', () => {
  
  const envelope = document.getElementById('envelope');
  const btn = document.getElementById('btn-open');

  if(btn) {
    btn.addEventListener('click', async (ev) => {
      // Звук відкриття паперу (залишаємо як ефект інтерфейсу)
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 420;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.45);
      } catch(e) {}

      envelope.classList.add('open');

      // Перехід через 0.8с (без музики)
      setTimeout(() => {
        window.location.href = 'quest.html?id=001';
      }, 800); 
    });
  }

  // Свічки
  const candleContainer = document.getElementById('magic-candles-container');
  if (candleContainer) {
      const candleImages = ['c1.png', 'c2.png', 'c3.png', 'c4.png'];
      for (let i = 0; i < 25; i++) {
          const img = document.createElement('img');
          const randomImg = candleImages[Math.floor(Math.random() * candleImages.length)];
          img.src = `assets/img/${randomImg}`;
          img.classList.add('magic-candle'); 
          const size = 30 + Math.random() * 90; 
          img.style.width = `${size}px`; img.style.height = 'auto';
          img.style.left = `${Math.random() * 100}%`; img.style.top = `${Math.random() * 100}%`;
          if (size < 60) { img.style.opacity = '0.5'; img.style.filter = 'blur(2px)'; img.style.zIndex = '0'; } 
          else { img.style.opacity = '0.9'; img.style.filter = 'blur(0px)'; img.style.zIndex = '2'; }
          const duration = 5 + Math.random() * 10; const delay = -(Math.random() * 10);
          img.style.animationName = 'floatAnimation'; img.style.animationDuration = `${duration}s`;
          img.style.animationDelay = `${delay}s`; img.style.animationIterationCount = 'infinite';
          img.style.animationTimingFunction = 'ease-in-out';
          candleContainer.appendChild(img);
      }
  }
});