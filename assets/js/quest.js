// assets/js/quest.js
import { startPuzzle, startOrb, startSpell } from './minigames.js';

const questEl = document.getElementById('quest');
const titleEl = document.getElementById('page-title');
const subEl = document.getElementById('page-sub');
const btnBack = document.getElementById('btn-back');
const btnRestart = document.getElementById('btn-restart');
const progressBar = document.querySelector('.progress > i');

let questData = null;
let keys = [];
let historyStack = []; // Історія індексів питань
let score = { A:0, B:0, C:0, D:0 };

const audioFiles = {
  A: 'assets/audio/gryffindor.mp3',
  B: 'assets/audio/slytherin.mp3',
  C: 'assets/audio/hufflepuff.mp3',
  D: 'assets/audio/ravenclaw.mp3'
};

const houseBackgrounds = {
  A: 'https://images.unsplash.com/photo-1590422749830-49666c8f936e?auto=format&fit=crop&w=1400&q=80',
  B: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cd6?auto=format&fit=crop&w=1400&q=80',
  C: 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1400&q=80',
  D: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cd6?auto=format&fit=crop&w=1400&q=80'
};

const houses = { A: 'Грифіндор', B: 'Слизерин', C: 'Гафелпаф', D: 'Рейвенклов' };

// Функція перемішування (для відповідей)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function qsParam(name='id') {
  return new URL(location.href).searchParams.get(name);
}

async function loadQuest(id){
  try {
    const resp = await fetch(`quests/${id}.json`, {cache: 'no-store'});
    if(!resp.ok) throw new Error(`Помилка: ${resp.status}`);
    
    questData = await resp.json();

    if(Array.isArray(questData.questions)) {
      const obj = {};
      questData.questions.forEach((q,i)=> obj['q'+i] = q);
      questData.questions = obj;
    }

    keys = Object.keys(questData.questions || {});
    resetState();
    
    if(titleEl) titleEl.textContent = questData.title || 'Квест';
    if(subEl) subEl.textContent = questData.subtitle || ' ';

    let startIndex = keys.indexOf(questData.start ?? keys[0]);
    if(startIndex < 0) startIndex = 0;
    
    renderQuestion(startIndex);

  } catch (e) {
    console.error(e);
    if(questEl) questEl.innerHTML = `<div style="padding:20px; text-align:center;">Помилка завантаження.</div>`;
  }
}

function resetState(){
  historyStack = [];
  score = { A:0, B:0, C:0, D:0 };
  window.historyValues = []; // Глобальний масив відповідей
  if(btnBack) btnBack.disabled = true;
  if(btnRestart) btnRestart.style.display = 'none';
  if(progressBar) progressBar.style.width = '0%';
}

function renderQuestion(index){
  if(!questEl || !questData) return;
  
  // Якщо питання закінчились — ігри
  if(index < 0 || index >= keys.length) { 
      startMiniGames(); 
      return; 
  }

  // Логіка історії: додаємо поточний індекс в стек
  historyStack.push(index);
  
  // Кнопка "Назад" активна, якщо ми пройшли більше 1 кроку
  if(btnBack) btnBack.disabled = historyStack.length <= 1;

  const key = keys[index];
  const q = questData.questions[key];

  questEl.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'q-card fade-in';

  const qText = document.createElement('div');
  qText.className = 'q-text';
  qText.textContent = q.text || '(питання)';
  card.appendChild(qText);

  const opts = document.createElement('div');
  opts.className = 'options';
  
  let shuffledOptions = [...(q.options || [])];
  shuffleArray(shuffledOptions);

  shuffledOptions.forEach((opt) => {
    const b = document.createElement('button');
    b.className = 'opt-btn';
    b.textContent = opt.text;
    b.onclick = () => handleChoice(opt.value);
    opts.appendChild(b);
  });
  card.appendChild(opts);

  const prog = document.createElement('div');
  prog.className = 'progress-row';
  prog.innerHTML = `
    <div style="font-size:14px; font-weight: bold; color:rgba(0,0,0,0.5)">Питання ${index+1} з ${keys.length}</div>
    <div class="progress"><i style="width:${Math.round(((index)/keys.length)*100)}%"></i></div>`;
  card.appendChild(prog);

  questEl.appendChild(card);
}

function handleChoice(value){
  if(!window.historyValues) window.historyValues = [];
  window.historyValues.push(value);
  
  if(value && score[value] !== undefined) score[value]++;

  const currentCard = questEl.querySelector('.q-card');
  if(currentCard){
    currentCard.classList.remove('fade-in');
    currentCard.classList.add('fade-out');
  }

  setTimeout(() => {
     // Наступне питання = кількість вже даних відповідей
     const nextIndex = window.historyValues.length;
     renderQuestion(nextIndex);
  }, 200);
}

// === ВИПРАВЛЕНА ЛОГІКА КНОПКИ НАЗАД ===
if(btnBack){
    btnBack.addEventListener('click', () => {
        if(historyStack.length <= 1) return; 

        // 1. Видаляємо поточне питання зі стеку (ми йдемо з нього)
        historyStack.pop(); 
        
        // 2. Отримуємо індекс попереднього питання
        const prevIndex = historyStack.pop(); 
        // (Ми його теж видаляємо, бо renderQuestion додасть його знову)

        // 3. Видаляємо останню відповідь
        const lastVal = window.historyValues.pop();
        if(lastVal && score[lastVal] > 0) score[lastVal]--;

        // 4. Рендеримо попереднє питання
        renderQuestion(prevIndex);
    });
}

function startMiniGames() {
    if(btnBack) btnBack.style.display = 'none';
    if(subEl) subEl.textContent = "Випробування магії";
    if(progressBar) progressBar.style.width = '100%';

    startPuzzle(questEl, () => {
        startOrb(questEl, () => {
            startSpell(questEl, () => {
                renderResult();
            });
        });
    });
}

function renderResult(){
  if(btnBack) btnBack.style.display = 'none'; 
  if(subEl) subEl.textContent = "Розподіл завершено";

  const total = Object.values(score).reduce((s,v)=> s+v, 0) || 1;
  const pct = {
    A: Math.round((score.A / total)*100),
    B: Math.round((score.B / total)*100),
    C: Math.round((score.C / total)*100),
    D: Math.round((score.D / total)*100)
  };

  let winner = 'A';
  if(pct.B > pct[winner]) winner = 'B';
  if(pct.C > pct[winner]) winner = 'C';
  if(pct.D > pct[winner]) winner = 'D';
  
  questEl.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'result-wrap fade-in';

  const logo = document.createElement('div');
  logo.className = 'house-logo';
  if(winner === 'A') { logo.classList.add('house-grif'); logo.textContent = 'G'; }
  if(winner === 'B') { logo.classList.add('house-sly'); logo.textContent = 'S'; }
  if(winner === 'C') { logo.classList.add('house-huf'); logo.textContent = 'H'; }
  if(winner === 'D') { logo.classList.add('house-rav'); logo.textContent = 'R'; }

  const title = document.createElement('h2');
  title.textContent = `Ти — ${houses[winner]}!`;
  title.style.margin = '10px 0';
  title.style.color = '#fff';

  const actions = document.createElement('div');
  actions.className = 'action-row';
  
  const playBtn = document.createElement('button');
  playBtn.className = 'btn-primary';
  playBtn.textContent = 'Прослухати ще раз';
  playBtn.onclick = () => playHouseAudio(winner);
  
  actions.appendChild(playBtn);
  wrap.appendChild(logo);
  wrap.appendChild(title);
  wrap.appendChild(actions);

  const houseBg = document.createElement('div');
  houseBg.style.width = '100%';
  houseBg.style.height = '180px';
  houseBg.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${houseBackgrounds[winner]}')`;
  houseBg.style.backgroundSize = 'cover';
  houseBg.style.backgroundPosition = 'center';
  houseBg.style.borderRadius = '10px';
  houseBg.style.marginTop = '15px';
  
  wrap.appendChild(houseBg);
  questEl.appendChild(wrap);

  if(btnRestart) {
      btnRestart.style.display = 'inline-block';
      btnRestart.onclick = () => {
          location.reload(); 
      };
  }
  
  playHouseAudio(winner);
}

let houseAudio = new Audio();
function playHouseAudio(code){
  const src = audioFiles[code];
  if(!src) return;
  houseAudio.pause();
  houseAudio = new Audio(src);
  houseAudio.volume = 0.8;
  houseAudio.play().catch(e => console.log("Audio autoplay block:", e));
}

document.addEventListener('DOMContentLoaded', () => {
    const id = qsParam('id') || '001';
    loadQuest(id);
});