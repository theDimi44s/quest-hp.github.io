// assets/js/quidditch.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Елементи UI
    const modalOverlay = document.getElementById('modal-overlay');
    const startModal = document.getElementById('start-modal');
    const endModal = document.getElementById('end-modal');
    const btnStart = document.getElementById('btn-start-game');
    const btnRestart = document.getElementById('btn-restart');
    const btnNext = document.getElementById('btn-next-level');
    
    const scoreVal = document.getElementById('score-val');
    const missVal = document.getElementById('miss-val');
    const finalScoreText = document.getElementById('final-score-text');
    const endTitle = endModal.querySelector('.game-title'); // Для зміни заголовка (Перемога/Поразка)
    
    const gameLayer = document.getElementById('game-layer');
    const ambientLayer = document.getElementById('ambient-layer');

    // Налаштування гри
    let state = {
        score: 0,
        misses: 0,
        isPlaying: false,
        snitchTimer: null,
        trailInterval: null
    };

    const maxMisses = 5;
    const targetScore = 150; // Ціль для перемоги
    const pointsPerCatch = 10; // Очків за один снитч

    // --- 1. АТМОСФЕРА (Гравці) ---
    function initAmbientLayer() {
        const colors = ['#740001', '#1a472a', '#0e1a40', '#ecb939']; 
        for(let i=0; i<10; i++) {
            const dot = document.createElement('div');
            dot.className = 'flying-player';
            const color = colors[Math.floor(Math.random() * colors.length)];
            dot.style.setProperty('--team-color', color);
            const scale = 0.5 + Math.random() * 0.8;
            dot.style.transform = `scale(${scale})`;
            ambientLayer.appendChild(dot);
            animatePlayer(dot);
        }
    }

    function animatePlayer(el) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const duration = 3000 + Math.random() * 4000;
        
        el.style.transition = `transform ${duration}ms linear`;
        el.style.transform = `translate(${x}px, ${y}px)`; 

        setTimeout(() => {
            if(document.body.contains(el)) animatePlayer(el);
        }, duration);
    }

    // --- 2. ЕФЕКТИ ---
    function createTrailDot(x, y) {
        const dot = document.createElement('div');
        dot.className = 'trail-dot';
        dot.style.left = (x + 8) + 'px'; 
        dot.style.top = (y + 8) + 'px';
        gameLayer.appendChild(dot);
        setTimeout(() => { dot.remove(); }, 600);
    }

    function startTrail(snitchEl) {
        if(state.trailInterval) clearInterval(state.trailInterval);
        state.trailInterval = setInterval(() => {
            if(!state.isPlaying || !snitchEl) return;
            const rect = snitchEl.getBoundingClientRect();
            createTrailDot(rect.left, rect.top);
        }, 40);
    }

    function createCatchEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'catch-effect';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        gameLayer.appendChild(effect);
        setTimeout(() => effect.remove(), 500);
    }

    // --- 3. ЛОГІКА СНИТЧА ---
    function spawnSnitch() {
        if (!state.isPlaying) return;

        // 1. ПЕРЕВІРКА НА ПЕРЕМОГУ
        if (state.score >= targetScore) {
            gameWin();
            return;
        }

        // 2. ПЕРЕВІРКА НА ПОРАЗКУ
        if (state.misses >= maxMisses) {
            gameOver();
            return;
        }

        // Розрахунок швидкості (чим більше очок, тим швидше)
        // Початкова швидкість 2000мс, кінцева (на 150 очках) десь 800мс
        const progress = state.score / targetScore; 
        const lifeTime = 2000 - (progress * 1200); 

        // Створення або пошук снитча
        let snitch = document.getElementById('snitch');
        if (!snitch) {
            snitch = document.createElement('div');
            snitch.id = 'snitch';
            
            snitch.onmousedown = snitch.ontouchstart = (e) => {
                e.preventDefault(); 
                if(!state.isPlaying) return;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                catchSnitch(snitch, clientX, clientY);
            };
            
            gameLayer.appendChild(snitch);
            startTrail(snitch);
        }

        // Позиція
        const padding = 50; 
        const maxX = window.innerWidth - padding * 2;
        const maxY = window.innerHeight - padding * 2;
        const x = padding + Math.random() * maxX;
        const y = padding + Math.random() * maxY;

        snitch.style.left = `${x}px`;
        snitch.style.top = `${y}px`;

        // Таймер втечі
        if (state.snitchTimer) clearTimeout(state.snitchTimer);

        state.snitchTimer = setTimeout(() => {
            if(state.isPlaying) {
                state.misses++;
                updateUI();
                
                // Промахнувся - спробуй ще (або кінець гри)
                if (state.misses < maxMisses) {
                    spawnSnitch(); 
                } else {
                    gameOver();
                }
            }
        }, lifeTime);
    }

    function catchSnitch(el, clickX, clickY) {
        clearTimeout(state.snitchTimer);
        
        if(navigator.vibrate) navigator.vibrate(70);
        createCatchEffect(clickX, clickY);

        state.score += pointsPerCatch; // +10 очок
        updateUI();
        
        // Миттєвий переліт
        setTimeout(spawnSnitch, 100); 
    }

    // --- 4. УПРАВЛІННЯ ГРОЮ ---
    function startGame() {
        state = { score: 0, misses: 0, isPlaying: true, snitchTimer: null, trailInterval: null };
        updateUI();
        
        modalOverlay.classList.remove('active');
        startModal.style.display = 'none';
        endModal.style.display = 'none';

        spawnSnitch();
    }

    function gameOver() {
        finishGame("Матч завершено!", `Твій результат: ${state.score} очок`);
    }

    function gameWin() {
        // Вітання при досягненні 150 очок
        finishGame("Перемога!", "Гравцю вдалось успішно піймати снитч!");
    }

    function finishGame(title, message) {
        state.isPlaying = false;
        clearTimeout(state.snitchTimer);
        clearInterval(state.trailInterval);
        
        const snitch = document.getElementById('snitch');
        if (snitch) snitch.remove();

        endTitle.textContent = title;
        finalScoreText.textContent = message;
        
        modalOverlay.classList.add('active');
        startModal.style.display = 'none';
        endModal.style.display = 'block';
    }

    function updateUI() {
        // Показуємо прогрес, наприклад "10 / 150"
        scoreVal.textContent = `${state.score} / ${targetScore}`;
        missVal.textContent = state.misses;
        
        if(state.misses >= 3) missVal.style.color = '#ff4444';
        else missVal.style.color = '#fff';
    }

    // Кнопки
    btnStart.onclick = startGame;
    btnRestart.onclick = startGame;
    btnNext.onclick = () => {
        window.location.href = 'quest.html?id=001&from=quidditch'; 
    };

    initAmbientLayer();
});