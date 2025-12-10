// assets/js/welcome.js
// Скрипт анімації конверта + Магічні свічки

document.addEventListener('DOMContentLoaded', () => {
  
  // --- ЛОГІКА КОНВЕРТА ---
  const envelope = document.getElementById('envelope');
  const btn = document.getElementById('btn-open');

  if(btn) {
    btn.addEventListener('click', async (ev) => {
      // Ефект кліку (звук)
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

      // Анімація відкриття
      envelope.classList.add('open');

      // Перехід
      setTimeout(() => {
        window.location.href = 'quest.html?id=001';
      }, 800); 
    });
  }

  // --- ЛОГІКА МАГІЧНИХ СВІЧОК (НОВЕ) ---
  const candleContainer = document.getElementById('magic-candles-container');
  if (candleContainer) {
      const candleImages = ['c1.png', 'c2.png', 'c3.png', 'c4.png'];
      const totalCandles = 25; // Кількість свічок

      for (let i = 0; i < totalCandles; i++) {
          const img = document.createElement('img');
          const randomImg = candleImages[Math.floor(Math.random() * candleImages.length)];
          img.src = `assets/img/${randomImg}`;
          img.classList.add('magic-candle'); // Клас для CSS анімації

          // 1. Випадковий розмір (ефект глибини)
          const size = 30 + Math.random() * 90; // від 30px до 120px
          img.style.width = `${size}px`;
          img.style.height = 'auto';

          // 2. Випадкова позиція
          img.style.left = `${Math.random() * 100}%`;
          img.style.top = `${Math.random() * 100}%`;

          // 3. Стиль залежно від глибини (розмиття для маленьких)
          if (size < 60) {
              img.style.opacity = '0.5';
              img.style.filter = 'blur(2px)';
              img.style.zIndex = '0';
          } else {
              img.style.opacity = '0.9';
              img.style.filter = 'blur(0px)';
              img.style.zIndex = '2';
          }

          // 4. Унікальна анімація для кожної
          const duration = 5 + Math.random() * 10; // 5-15 секунд
          const delay = -(Math.random() * 10); // Старт з випадкового місця анімації
          
          img.style.animationName = 'floatAnimation'; // Має бути в CSS
          img.style.animationDuration = `${duration}s`;
          img.style.animationDelay = `${delay}s`;
          img.style.animationIterationCount = 'infinite';
          img.style.animationTimingFunction = 'ease-in-out';

          candleContainer.appendChild(img);
      }
  }
});