// assets/js/quest.js
import { startPuzzle, startOrb, startSpell } from './minigames.js';

const questEl = document.getElementById('quest');
const titleEl = document.getElementById('page-title');
const subEl = document.getElementById('page-sub');
const progressBar = document.querySelector('.progress > i');

let questData = null;
let keys = [];
let score = { A:0, B:0, C:0, D:0 };

const audioFiles = {
  A: 'assets/audio/gryffindor.mp3', B: 'assets/audio/slytherin.mp3',
  C: 'assets/audio/hufflepuff.mp3', D: 'assets/audio/ravenclaw.mp3'
};
const houses = { A: 'Грифіндор', B: 'Слизерин', C: 'Гафелпаф', D: 'Рейвенклов' };
const houseBackgrounds = {
  A: 'https://images.unsplash.com/photo-1590422749830-49666c8f936e?auto=format&fit=crop&w=1400&q=80',
  B: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cd6?auto=format&fit=crop&w=1400&q=80',
  C: 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1400&q=80',
  D: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cd6?auto=format&fit=crop&w=1400&q=80'
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// === ЗАВАНТАЖЕННЯ ДАНИХ ===
async function loadQuest(id){
  try {
    const resp = await fetch(`quests/${id}.json?v=${Math.random()}`);
    if(!resp.ok) throw new Error(`Не вдалося завантажити квест (${resp.status})`);
    
    questData = await resp.json();
    if(titleEl) titleEl.textContent = questData.title;
    
    // Старт гри
    startFirstTask(); 

  } catch (e) {
    console.error(e);
    if(questEl) questEl.innerHTML = `<div style="padding:20px; color: #ff4444;">Помилка: ${e.message}</div>`;
  }
}

// 1. ПАЗЛИ
function startFirstTask() {
    if(progressBar) progressBar.style.width = '10%';
    
    if (typeof startPuzzle !== 'function') {
        alert("Помилка: startPuzzle не знайдено");
        return;
    }

    startPuzzle(questEl, () => {
        startQuiz();
    });
}

// 2. ВІКТОРИНА
function startQuiz() {
    keys = Object.keys(questData.questions || {});
    score = { A:0, B:0, C:0, D:0 };
    if(subEl) subEl.textContent = "Дай чесні відповіді";
    renderQuestion(0);
}

function renderQuestion(index){
  if(index >= keys.length) { 
      showPermissionScreen(); 
      return; 
  }

  if(progressBar) progressBar.style.width = `${((index+1)/keys.length)*40 + 10}%`;

  const key = keys[index];
  const q = questData.questions[key];

  questEl.innerHTML = '';

  // 1. Картка Питання
  const card = document.createElement('div'); 
  card.className = 'q-card fade-in';
  
  const qText = document.createElement('div'); 
  qText.className = 'q-text';
  qText.textContent = q.text; 
  card.appendChild(qText);

  const opts = document.createElement('div'); 
  opts.className = 'options';
  
  let shuffledOptions = [...q.options]; 
  shuffleArray(shuffledOptions);

  shuffledOptions.forEach((opt) => {
    const b = document.createElement('button'); 
    b.className = 'opt-btn';
    b.textContent = opt.text;
    b.onclick = () => {
        if(score[opt.value] !== undefined) score[opt.value]++;
        setTimeout(() => renderQuestion(index + 1), 200);
    };
    opts.appendChild(b);
  });
  card.appendChild(opts);
  
  const counter = document.createElement('div');
  counter.style.marginTop = '15px'; 
  counter.style.fontSize = '14px'; 
  counter.style.opacity = '0.5';
  counter.textContent = `Питання ${index + 1} / ${keys.length}`;
  card.appendChild(counter);

  // 2. Кнопки навігації (ВНИЗУ)
  const navDiv = document.createElement('div');
  navDiv.className = 'nav-controls';

  const btnRestart = document.createElement('button');
  btnRestart.className = 'nav-btn';
  btnRestart.textContent = 'Почати спочатку';
  btnRestart.onclick = () => location.reload();
  
  const btnBackNav = document.createElement('button');
  btnBackNav.className = 'nav-btn';
  btnBackNav.textContent = 'Назад';
  btnBackNav.onclick = () => {
      if (index === 0) {
          window.location.href = 'index.html'; 
      } else {
          renderQuestion(index - 1);
      }
  };

  navDiv.appendChild(btnRestart);
  navDiv.appendChild(btnBackNav);

  questEl.appendChild(card);
  questEl.appendChild(navDiv);
}

// ЕКРАН ДОЗВОЛУ (для Кулі)
function showPermissionScreen() {
    if(subEl) subEl.textContent = "Налаштування магії";
    questEl.innerHTML = '';
    
    const card = document.createElement('div'); 
    card.className = 'q-card fade-in';
    card.style.textAlign = 'center';
    
    const h2 = document.createElement('h2'); 
    h2.textContent = "Кімната Пророцтв"; 
    h2.style.marginBottom = '20px';
    
    const p = document.createElement('p'); 
    p.textContent = "Нам потрібно відчути твою магію.";
    
    const btn = document.createElement('button'); 
    btn.className = 'btn-primary';
    btn.textContent = "Увійти";
    btn.style.marginTop = '20px';
    
    btn.onclick = () => {
        // Запитуємо дозвіл на акселерометр (iOS) або просто йдемо далі
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(response => startOrbTask())
                .catch(e => startOrbTask());
        } else {
            startOrbTask();
        }
    };
    
    card.appendChild(h2); 
    card.appendChild(p); 
    card.appendChild(btn);
    questEl.appendChild(card);
}

// 3. КУЛЯ
function startOrbTask() {
    if(progressBar) progressBar.style.width = '70%';
    
    let winner = 'A';
    const pct = { A: score.A, B: score.B, C: score.C, D: score.D };
    if(pct.B > pct[winner]) winner = 'B';
    if(pct.C > pct[winner]) winner = 'C';
    if(pct.D > pct[winner]) winner = 'D';

    startOrb(questEl, winner, () => {
        startSpellTask(winner);
    });
}

// 4. ЗАКЛЯТТЯ
function startSpellTask(winner) {
    if(progressBar) progressBar.style.width = '90%';
    startSpell(questEl, () => {
        renderResult(winner);
    });
}

// 5. РЕЗУЛЬТАТ
function renderResult(winner){
  if(progressBar) progressBar.style.width = '100%';
  if(subEl) subEl.textContent = "Розподіл завершено";
  
  questEl.innerHTML = '';
  const wrap = document.createElement('div'); 
  wrap.className = 'result-wrap fade-in';

  // ВАЖЛИВО: Прибрав блок .house-logo (літеру), як ти просив
  
  const title = document.createElement('h2');
  title.textContent = `Ти — ${houses[winner]}!`;
  title.style.margin = '20px 0'; 
  title.style.fontSize = '36px';
  title.style.color = '#fff';
  title.style.textShadow = '0 0 10px rgba(0,0,0,0.8)';
  title.style.fontFamily = "var(--hp-font)"; 

  const actions = document.createElement('div'); 
  actions.className = 'action-row';
  
  const playBtn = document.createElement('button'); 
  playBtn.className = 'btn-primary';
  playBtn.textContent = 'Гімн факультету';
  playBtn.onclick = () => playHouseAudio(winner);
  
  const restartBtn = document.createElement('button');
  restartBtn.className = 'btn-primary';
  restartBtn.textContent = 'Пройти знову';
  restartBtn.style.marginLeft = '10px';
  restartBtn.onclick = () => location.reload();

  actions.appendChild(playBtn);
  actions.appendChild(restartBtn);
  
  wrap.appendChild(title); 
  wrap.appendChild(actions);
  questEl.appendChild(wrap);

  document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${houseBackgrounds[winner]}')`;

  playHouseAudio(winner);
}

let houseAudio = new Audio();
function playHouseAudio(code){
  const src = audioFiles[code];
  if(!src) return;
  houseAudio.pause(); 
  houseAudio = new Audio(src); 
  houseAudio.volume = 0.8;
  houseAudio.play().catch(e=>{});
}

document.addEventListener('DOMContentLoaded', () => {
    loadQuest('001');
});