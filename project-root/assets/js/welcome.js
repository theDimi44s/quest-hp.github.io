// assets/js/welcome.js
document.addEventListener('DOMContentLoaded', () => {
  
  // --- НАЛАШТУВАННЯ АУДІО ---
  const bgMusic = new Audio('assets/audio/welcome-page.mp3');
  bgMusic.loop = true; 
  bgMusic.volume = 0; // Починаємо з тиші

  // Універсальна функція для плавного зміни гучності
  // audio: елемент аудіо
  // targetVol: цільова гучність (0.0 - 1.0)
  // duration: час у мілісекундах (наприклад, 3000 для 3 сек)
  // callback: функція, яку виконати після завершення (наприклад, перехід на іншу сторінку)
  function smoothVolume(audio, targetVol, duration, callback) {
      const steps = 50; // Кількість кроків для плавності
      const stepTime = duration / steps;
      const volStep = (targetVol - audio.volume) / steps;
      
      const interval = setInterval(() => {
          let newVol = audio.volume + volStep;
          
          // Обмеження, щоб не вийти за межі 0..1
          if (newVol > 1) newVol = 1;
          if (newVol < 0) newVol = 0;

          audio.volume = newVol;

          // Перевірка завершення (з невеликою похибкою)
          if (Math.abs(audio.volume - targetVol) < 0.01) {
              audio.volume = targetVol;
              clearInterval(interval);
              if (callback) callback();
          }
      }, stepTime);
  }

  // Функція розблокування (для першого запуску)
  const unlockAudio = () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);

      if (bgMusic.paused) {
          bgMusic.play().then(() => {
              // Плавно піднімаємо гучність до 50% за 3 секунди
              smoothVolume(bgMusic, 0.5, 3000);
          }).catch(e => console.log("Чекаємо взаємодії"));
      }
  };

  // Спроба автозапуску
  bgMusic.play().then(() => {
      smoothVolume(bgMusic, 0.5, 3000);
  }).catch(() => {
      // Якщо автоплей заборонено - чекаємо на дію
      document.addEventListener('click', unlockAudio);
      document.addEventListener('touchstart', unlockAudio);
      document.addEventListener('keydown', unlockAudio);
  });


  // --- ЛОГІКА КОНВЕРТА ---
  const envelope = document.getElementById('envelope');
  const btn = document.getElementById('btn-open');

  if(btn) {
    btn.addEventListener('click', async (ev) => {
      // Звук відкриття (ефект)
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

      // Анімація візуальна
      envelope.classList.add('open');

      // 1. Плавно гасимо музику до 0 за 0.8 секунди
      smoothVolume(bgMusic, 0, 800, () => {
          bgMusic.pause();
      });

      // 2. Переходимо на наступну сторінку з затримкою, 
      // щоб музика встигла майже затихнути
      setTimeout(() => {
        window.location.href = 'quest.html?id=001';
      }, 800); 
    });
  }

  // --- СВІЧКИ (Без змін) ---
  const candleContainer = document.getElementById('magic-candles-container');
  if (candleContainer) {
      const candleImages = ['c1.png', 'c2.png', 'c3.png', 'c4.png'];
      const totalCandles = 25; 
      for (let i = 0; i < totalCandles; i++) {
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