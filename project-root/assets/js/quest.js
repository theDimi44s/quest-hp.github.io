// assets/js/quest.js
import { startPuzzle, startOrb, startSpell } from './minigames.js';

const questEl = document.getElementById('quest');
const titleEl = document.getElementById('page-title'); 
const subEl = document.getElementById('page-sub');
const progressBar = document.querySelector('.progress > i');

let questData = null;
let keys = [];
let score = { A:0, B:0, C:0, D:0 };

// --- МЕНЕДЖЕР МУЗИКИ ---
const musicManager = {
    audio: new Audio(),
    currentTrack: null,
    fadeInterval: null,

    fadeTo(targetVol, duration, callback) {
        if (!this.audio) { if(callback) callback(); return; }
        if (this.fadeInterval) clearInterval(this.fadeInterval);

        const steps = 10; 
        const stepTime = duration / steps;
        
        this.fadeInterval = setInterval(() => {
            let newVol = this.audio.volume + (targetVol > this.audio.volume ? 0.1 : -0.1);
            if (newVol > 1) newVol = 1;
            if (newVol < 0) newVol = 0;
            this.audio.volume = newVol;

            if (Math.abs(this.audio.volume - targetVol) < 0.1 || (targetVol === 0 && newVol === 0)) {
                this.audio.volume = targetVol;
                clearInterval(this.fadeInterval);
                if (callback) callback();
            }
        }, stepTime);
    },
    
    playFadeIn(trackPath, loop = true, maxVolume = 0.5, fadeDuration = 3000) {
        if(this.currentTrack === trackPath && !this.audio.paused) return;

        this.audio.pause(); this.audio.currentTime = 0;
        this.audio.src = trackPath; this.audio.loop = loop;
        this.audio.volume = 0; this.currentTrack = trackPath;

        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => { this.fadeTo(maxVolume, fadeDuration); }).catch(e => {
                console.log("Autoplay blocked. Waiting for click.");
                document.addEventListener('click', () => {
                    if(this.audio.paused && this.audio.src.includes(trackPath)) {
                        this.audio.play(); this.fadeTo(maxVolume, 1000); 
                    }
                }, { once: true });
            });
        }
    },

    stopFadeOut(duration = 1000, onComplete) {
        this.fadeTo(0, duration);
        setTimeout(() => {
            if (this.fadeInterval) clearInterval(this.fadeInterval);
            this.audio.pause(); this.audio.currentTime = 0;
            if (onComplete) onComplete();
        }, duration + 50); 
    }
};

const audioFiles = {
  A: 'assets/audio/gryffindor.mp3', B: 'assets/audio/slytherin.mp3',
  C: 'assets/audio/hufflepuff.mp3', D: 'assets/audio/ravenclaw.mp3',
  bgGame: 'assets/audio/answer-page.mp3', bgSuccess: 'assets/audio/success.mp3'
};

const houses = { A: 'Грифіндор', B: 'Слизерин', C: 'Гафелпаф', D: 'Рейвенклов' };
const houseBackgrounds = {
  A: 'https://images.unsplash.com/photo-1590422749830-49666c8f936e?auto=format&fit=crop&w=1400&q=80',
  B: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cd6?auto=format&fit=crop&w=1400&q=80',
  C: 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1400&q=80',
  D: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cd6?auto=format&fit=crop&w=1400&q=80'
};
const crests = { main: 'assets/img/h-main.png', A: 'assets/img/h-gryf.png', B: 'assets/img/h-slyt.png', C: 'assets/img/h-haf.png', D: 'assets/img/h-rav.png' };

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// === ЗАВАНТАЖЕННЯ ===
async function loadQuest(id){
  try {
    setTimeout(() => { musicManager.playFadeIn(audioFiles.bgGame, true, 0.4, 3000); }, 1000);
    const resp = await fetch(`quests/${id}.json?v=${Math.random()}`);
    if(!resp.ok) throw new Error(`Error ${resp.status}`);
    questData = await resp.json();
    if(titleEl) titleEl.textContent = questData.title;
    startQuiz(); 
  } catch (e) {
    console.error(e);
    if(questEl) questEl.innerHTML = `<div style="padding:20px; color: #ff4444;">Помилка: ${e.message}</div>`;
  }
}

// === 1. ВІКТОРИНА ===
function startQuiz() {
    keys = Object.keys(questData.questions || {});
    score = { A:0, B:0, C:0, D:0 }; 
    if(subEl) subEl.textContent = "Дай чесні відповіді";
    renderQuestion(0);
}

// === ВІДОБРАЖЕННЯ ПИТАННЯ (ОЧИЩЕНО ВІД АНІМАЦІЇ) ===
function renderQuestion(index){
  if(index >= keys.length) { 
      let winner = 'A';
      const pct = { A: score.A, B: score.B, C: score.C, D: score.D };
      if(pct.B > pct[winner]) winner = 'B';
      if(pct.C > pct[winner]) winner = 'C';
      if(pct.D > pct[winner]) winner = 'D';
      startSpellTask(winner); 
      return; 
  }

  if(progressBar) progressBar.style.width = `${((index+1)/keys.length)*20 + 10}%`;
  const key = keys[index]; const q = questData.questions[key];
  questEl.innerHTML = '';
  
  const card = document.createElement('div'); card.className = 'q-card fade-in';
  
  // Текст питання
  const qText = document.createElement('div'); 
  qText.className = 'q-text'; 
  qText.textContent = q.text; 
  card.appendChild(qText);

  // КАРТИНКА (Твій код)
  const img = document.createElement('img');
  img.className = 'q-image';
  img.alt = q.imageAlt || q.text || 'question image';
  // Перевірка: якщо є картинка в JSON - беремо її, інакше заглушка
  img.src = q.image ? q.image : 'assets/img/library.png';
  
  // Стилі для картинки (можна перенести в CSS)
  img.style.width = '100%';
  img.style.height = '180px';
  img.style.objectFit = 'cover';
  img.style.borderRadius = '8px';
  img.style.marginBottom = '12px';
  card.appendChild(img);
  
// Варіанти відповідей
  const opts = document.createElement('div'); opts.className = 'options';
  let shuffledOptions = [...q.options]; shuffleArray(shuffledOptions);
  
  shuffledOptions.forEach((opt) => {
    const b = document.createElement('button'); 
    b.className = 'opt-btn'; 
    b.textContent = opt.text; 

    // === ДИНАМІЧНИЙ РОЗМІР ШРИФТУ ===
    const len = opt.text.length;
    if (len > 60) {
        b.classList.add('text-sm'); // Довгий текст -> малий шрифт
    } else if (len > 25) {
        b.classList.add('text-md'); // Середній текст -> середній шрифт
    }
    // Якщо менше 25 символів -> залишається стандартний (великий) шрифт
    // ================================

    b.onclick = () => { 
        if(score[opt.value] !== undefined) score[opt.value]++; 
        setTimeout(() => renderQuestion(index + 1), 200); 
    };
    opts.appendChild(b);
  });
  
  card.appendChild(opts);
  
  const counter = document.createElement('div'); counter.style.marginTop = '15px'; counter.style.fontSize = '14px'; counter.style.opacity = '0.5'; counter.style.fontWeight = '700'; counter.textContent = `Питання ${index + 1} / ${keys.length}`; card.appendChild(counter);
  const navDiv = document.createElement('div'); navDiv.className = 'nav-controls';
  const btnRestart = document.createElement('button'); btnRestart.className = 'nav-btn'; btnRestart.textContent = 'Почати спочатку'; btnRestart.onclick = () => location.reload();
  const btnBackNav = document.createElement('button'); btnBackNav.className = 'nav-btn'; btnBackNav.textContent = 'Назад'; btnBackNav.onclick = () => { if (index === 0) window.location.href = 'index.html'; else renderQuestion(index - 1); };
  navDiv.appendChild(btnRestart); navDiv.appendChild(btnBackNav);
  questEl.appendChild(card); questEl.appendChild(navDiv);
}

// === 2. ЗАМОК ===
function startSpellTask(winner) {
    if(progressBar) progressBar.style.width = '40%'; 
    startSpell(questEl, () => { startPuzzleTask(winner); });
}

// === 3. ПАЗЛ ===
function startPuzzleTask(winner) {
    if(progressBar) progressBar.style.width = '60%'; 
    if (typeof startPuzzle !== 'function') { alert("Err: startPuzzle"); return; }
    startPuzzle(questEl, () => { showPermissionScreen(winner); });
}

// === 4. КУЛЯ ===
function startOrbTask(winner) {
    if(progressBar) progressBar.style.width = '85%';
    startOrb(questEl, winner, () => {
        musicManager.stopFadeOut(1000, () => { renderResult(winner); });
    });
}

// === ЕКРАН ДОЗВОЛУ ===
function showPermissionScreen(winner) {
    if(subEl) subEl.textContent = "Налаштування магії";
    questEl.innerHTML = '';
    const card = document.createElement('div'); card.className = 'q-card fade-in'; card.style.textAlign = 'center';
    const h2 = document.createElement('h2'); h2.textContent = "Зал Пророцтв"; h2.style.marginBottom = '20px'; h2.style.fontSize = '24px';
    const p = document.createElement('p'); p.style.fontWeight = '700'; p.style.fontSize = '16px';
    p.textContent = `Зал Пророцтв — одна з восьми відомих кімнат Відділу Таємниць. У вічному напівмороку мерехтять безліч скляних кульок...`; 
    const btn = document.createElement('button'); btn.className = 'btn-primary'; btn.textContent = "Увійти"; btn.style.marginTop = '20px';
    
    btn.onclick = () => {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(r => startOrbTask(winner)).catch(e => startOrbTask(winner));
        } else { startOrbTask(winner); }
    };
    card.appendChild(h2); card.appendChild(p); card.appendChild(btn); questEl.appendChild(card);
}

// === 5. РЕЗУЛЬТАТ ===
function renderResult(winner){
  if(progressBar) progressBar.style.width = '100%';
  if(subEl) subEl.textContent = "Розподіл завершено";
  
  const successAudio = new Audio(audioFiles.bgSuccess);
  successAudio.volume = 0.7; successAudio.play().catch(e=>{});

  setTimeout(() => {
      let vol = successAudio.volume; successAudio.volume = 0.3; 
      playHouseAudio(winner, () => { successAudio.volume = vol; });
  }, 2500);

  questEl.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'result-wrap fade-in';

  const crestDiv = document.createElement('div'); crestDiv.className = 'crests-container';
  const leftCrest = document.createElement('img'); leftCrest.src = crests[winner]; leftCrest.className = 'crest-img crest-side';
  const mainCrest = document.createElement('img'); mainCrest.src = crests.main; mainCrest.className = 'crest-img crest-main';
  const rightCrest = document.createElement('img'); rightCrest.src = crests[winner]; rightCrest.className = 'crest-img crest-side';

  crestDiv.appendChild(leftCrest); crestDiv.appendChild(mainCrest); crestDiv.appendChild(rightCrest);
  wrap.appendChild(crestDiv);

  const textDiv = document.createElement('div'); textDiv.className = 'result-text-container';
  const title = document.createElement('h2'); title.textContent = `Вітаємо на факультеті — ${houses[winner]}!`;
  title.style.margin = '20px 0'; title.style.fontSize = '29px'; title.style.color = '#fff'; title.style.textShadow = '0 0 10px rgba(0,0,0,0.8)';
  textDiv.appendChild(title);

  const actions = document.createElement('div'); actions.className = 'action-row';
  const playBtn = document.createElement('button'); playBtn.className = 'btn-primary'; playBtn.textContent = 'Прослухати ще раз';
  playBtn.onclick = () => { successAudio.volume = 0.2; playHouseAudio(winner, () => { successAudio.volume = 0.7; }); };
 
  // Перехід на головну замість перезавантаження сторінки
  // const restartBtn = document.createElement('button'); restartBtn.className = 'btn-primary'; restartBtn.textContent = 'Пройти знову'; restartBtn.style.marginLeft = '10px'; restartBtn.onclick = () => location.reload();
  // actions.appendChild(restartBtn);
  actions.appendChild(playBtn); 
  textDiv.appendChild(actions); wrap.appendChild(textDiv); questEl.appendChild(wrap);
  document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${houseBackgrounds[winner]}')`;
}

let houseAudio = new Audio();
function playHouseAudio(code, onEndCallback){
  const src = audioFiles[code]; if(!src) return;
  houseAudio.pause(); houseAudio = new Audio(src); houseAudio.volume = 1.0; houseAudio.play().catch(e=>{});
  houseAudio.onended = () => { if(onEndCallback) onEndCallback(); };
}

document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById('page-bg');
    if(bg) { const randomNum = Math.random() > 0.5 ? '1' : '2'; bg.style.backgroundImage = `url('assets/img/castle-bg${randomNum}.jpg')`; }
    const candleContainer = document.getElementById('magic-candles-container');
    if (candleContainer) {
        const candleImages = ['c1.png', 'c2.png', 'c3.png', 'c4.png'];
        for (let i = 0; i < 70; i++) {
            const img = document.createElement('img');
            const randomImg = candleImages[Math.floor(Math.random() * candleImages.length)];
            img.src = `assets/img/${randomImg}`; img.classList.add('magic-candle'); 
            const size = 2 + Math.random() * 5; img.style.width = `${size}px`; img.style.height = 'auto';
            img.style.left = `${Math.random() * 100}%`; img.style.top = `${Math.random() * 100}%`;
            if (size < 70) { img.style.opacity = '0.3'; img.style.filter = 'blur(3px)'; img.style.zIndex = '0'; } 
            else { img.style.opacity = '0.9'; img.style.filter = 'blur(0px)'; img.style.zIndex = '2'; }
            const duration = 3 + Math.random() * 10; const delay = -(Math.random() * 10);
            img.style.animationName = 'floatAnimation'; img.style.animationDuration = `${duration}s`;
            img.style.animationDelay = `${delay}s`; img.style.animationIterationCount = 'infinite';
            img.style.animationTimingFunction = 'ease-in-out';
            candleContainer.appendChild(img);
        }
    }
    loadQuest('001');
});