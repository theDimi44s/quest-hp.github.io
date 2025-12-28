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
    audio: new Audio(), currentTrack: null, fadeInterval: null,
    stop() { if (this.fadeInterval) clearInterval(this.fadeInterval); this.audio.pause(); this.audio.currentTime = 0; },
    fadeTo(targetVol, duration, callback) {
        if (!this.audio) { if(callback) callback(); return; }
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        const steps = 20; const stepTime = duration / steps;
        this.fadeInterval = setInterval(() => {
            let newVol = this.audio.volume + (targetVol > this.audio.volume ? 0.05 : -0.05);
            if (newVol > 1) newVol = 1; if (newVol < 0) newVol = 0;
            if (Math.abs(this.audio.volume - newVol) > 0.01) this.audio.volume = newVol;
            else if (Math.abs(this.audio.volume - targetVol) < 0.05) this.audio.volume = targetVol;
            if (Math.abs(this.audio.volume - targetVol) < 0.05 || (targetVol === 0 && newVol <= 0.05)) {
                this.audio.volume = targetVol; clearInterval(this.fadeInterval); if (callback) callback();
            }
        }, stepTime);
    },
    playAuto(trackPath) {
        this.audio.src = trackPath; this.audio.loop = true; this.audio.volume = 0; 
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => { this.fadeTo(0.4, 2000); }).catch(e => {
                console.log("Autoplay blocked.");
                const unlock = () => { this.audio.play(); this.fadeTo(0.4, 1000); document.removeEventListener('click', unlock); document.removeEventListener('touchstart', unlock); };
                document.addEventListener('click', unlock); document.addEventListener('touchstart', unlock);
            });
        }
    },
    stopFadeOut(duration = 2000) { this.fadeTo(0, duration, () => { this.audio.pause(); }); }
};

const audioFiles = { A: 'assets/audio/gryffindor.mp3', B: 'assets/audio/slytherin.mp3', C: 'assets/audio/hufflepuff.mp3', D: 'assets/audio/ravenclaw.mp3', bgGame: 'assets/audio/answer-page.mp3' };
const houses = { A: 'Грифіндор', B: 'Слизерин', C: 'Гафелпаф', D: 'Рейвенклов' };
const houseBackgrounds = { A: 'https://images.unsplash.com/photo-1590422749830-49666c8f936e?auto=format&fit=crop&w=1400&q=80', B: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cd6?auto=format&fit=crop&w=1400&q=80', C: 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1400&q=80', D: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cd6?auto=format&fit=crop&w=1400&q=80' };
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
    musicManager.playAuto(audioFiles.bgGame);
    const resp = await fetch(`quests/${id}.json?v=${Math.random()}`);
    if(!resp.ok) throw new Error(`Error ${resp.status}`);
    questData = await resp.json();
    if(titleEl) titleEl.textContent = questData.title;
    if (questData.questions) { Object.values(questData.questions).forEach(q => { if (q.image) { const img = new Image(); img.src = q.image; } }); }
    startQuiz(); 
  } catch (e) {
    console.error(e);
    if(questEl) questEl.innerHTML = `<div style="padding:20px; color: #ff4444;">Помилка: ${e.message}</div>`;
  }
}

// === QUIZ ===
function startQuiz() {
    questEl.classList.remove('puzzle-active');
    keys = Object.keys(questData.questions || {});
    score = { A:0, B:0, C:0, D:0 }; 
    if(subEl) subEl.textContent = "Дай чесні відповіді";
    renderQuestion(0);
}

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
  const qText = document.createElement('div'); qText.className = 'q-text'; qText.textContent = q.text; card.appendChild(qText);
  const img = document.createElement('img'); img.className = 'q-image'; img.alt = q.imageAlt || q.text; img.src = q.image ? q.image : 'assets/img/library.png';
  img.onload = () => { img.classList.add('loaded'); }; if (img.complete) img.classList.add('loaded');
  card.appendChild(img);
  const opts = document.createElement('div'); opts.className = 'options';
  let shuffledOptions = [...q.options]; shuffleArray(shuffledOptions);
  shuffledOptions.forEach((opt) => {
    const b = document.createElement('button'); b.className = 'opt-btn'; b.textContent = opt.text; 
    const len = opt.text.length;
    if (len <= 30) b.classList.add('text-lg'); else if (len > 30 && len <= 70) b.classList.add('text-md'); else b.classList.add('text-sm');
    b.onclick = () => { if(score[opt.value] !== undefined) score[opt.value]++; setTimeout(() => renderQuestion(index + 1), 200); };
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

function startSpellTask(winner) { if(progressBar) progressBar.style.width = '40%'; startSpell(questEl, () => { startPuzzleTask(winner); }); }
function startPuzzleTask(winner) { if(progressBar) progressBar.style.width = '60%'; questEl.classList.add('puzzle-active'); startPuzzle(questEl, () => { questEl.classList.remove('puzzle-active'); showPermissionScreen(winner); }); }

// === КУЛЯ: ПРОГРІВ АУДІО ===
function startOrbTask(winner) { 
    if(progressBar) progressBar.style.width = '85%'; 
    startOrb(questEl, winner, 
        () => { renderResult(winner); }, 
        () => { 
            // 1. Зупиняємо фонову музику
            musicManager.stopFadeOut(2000); 
            // 2. ВАЖЛИВО: Розблокуємо аудіо капелюха прямо зараз
            primeAudio(winner);
        }
    ); 
}

function showPermissionScreen(winner) {
    questEl.classList.remove('puzzle-active'); if(subEl) subEl.textContent = "Налаштування магії"; questEl.innerHTML = '';
    const card = document.createElement('div'); card.className = 'q-card fade-in permission-card'; card.style.textAlign = 'center';
    const h2 = document.createElement('h2'); h2.textContent = "Зал Пророцтв"; h2.style.marginBottom = '20px'; h2.style.fontSize = '24px';
    const p = document.createElement('p'); p.style.fontWeight = '700'; p.style.fontSize = '16px';
    p.textContent = `Зал Пророцтв — одна з восьми відомих кімнат Відділу Таємниць. У вічному напівмороку мерехтять безліч скляних кульок...`; 
    const btn = document.createElement('button'); btn.className = 'btn-primary'; btn.textContent = "Увійти"; btn.style.marginTop = '20px';
    btn.onclick = () => { if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') { DeviceMotionEvent.requestPermission().then(r => startOrbTask(winner)).catch(e => startOrbTask(winner)); } else { startOrbTask(winner); } };
    card.appendChild(h2); card.appendChild(p); card.appendChild(btn); questEl.appendChild(card);
}

function renderResult(winner){
  if(progressBar) progressBar.style.width = '100%'; if(subEl) subEl.textContent = "Розподіл завершено";
  musicManager.stop(); playHouseAudio(winner);
  questEl.innerHTML = ''; const wrap = document.createElement('div'); wrap.className = 'result-wrap fade-in';
  const crestDiv = document.createElement('div'); crestDiv.className = 'crests-container';
  const leftCrest = document.createElement('img'); leftCrest.src = crests[winner]; leftCrest.className = 'crest-img crest-side';
  const mainCrest = document.createElement('img'); mainCrest.src = crests.main; mainCrest.className = 'crest-img crest-main';
  const rightCrest = document.createElement('img'); rightCrest.src = crests[winner]; rightCrest.className = 'crest-img crest-side';
  crestDiv.appendChild(leftCrest); crestDiv.appendChild(mainCrest); crestDiv.appendChild(rightCrest); wrap.appendChild(crestDiv);
  const textDiv = document.createElement('div'); textDiv.className = 'result-text-container';
  const title = document.createElement('h2'); title.textContent = `Вітаємо на факультеті — ${houses[winner]}!`;
  title.style.margin = '20px 0'; title.style.fontSize = '29px'; title.style.color = '#fff'; title.style.textShadow = '0 0 10px rgba(0,0,0,0.8)'; textDiv.appendChild(title);
  const actions = document.createElement('div'); actions.className = 'action-row';
  
  const playBtn = document.createElement('button'); playBtn.className = 'btn-result'; playBtn.textContent = 'Прослухати ще раз';
  playBtn.onclick = () => { playHouseAudio(winner); };
  actions.appendChild(playBtn); textDiv.appendChild(actions); wrap.appendChild(textDiv); questEl.appendChild(wrap);
  document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${houseBackgrounds[winner]}')`;
}

let houseAudio = new Audio();
// Короткий файл тиші (0.1сек)
const silentMp3 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAA=";

// Функція "прогріву" через тишу
function primeAudio(code) {
    const realSrc = audioFiles[code];
    if (!realSrc) return;
    
    // 1. Граємо тишу
    houseAudio.src = silentMp3;
    houseAudio.volume = 1.0; 
    
    houseAudio.play().then(() => {
        // 2. Якщо вдалося (браузер дав дозвіл) -> ставимо на паузу
        houseAudio.pause();
        // 3. Підміняємо на реальний трек (він буде готовий до запуску пізніше)
        houseAudio.src = realSrc;
        houseAudio.load();
    }).catch(e => {
        // Якщо не вийшло, все одно ставимо src, щоб кнопка "Прослухати ще раз" спрацювала
        houseAudio.src = realSrc;
    });
}

function playHouseAudio(code){
    // Просто граємо (аудіо вже має правильний src з primeAudio)
    houseAudio.play().catch(e => console.log("Voice blocked", e));
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