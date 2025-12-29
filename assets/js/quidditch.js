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
    const gameLayer = document.getElementById('game-layer');
    const ambientLayer = document.getElementById('ambient-layer');

    // Налаштування гри
    let state = {
        score: 0,
        misses: 0,
        level: 1,
        isPlaying: false,
        snitchTimer: null,
        trailInterval: null
    };

    const maxMisses = 5;
    
    // Час на реакцію (стає меншим з рівнем)
    const levels = {
        1: 2200, 
        2: 1600, 
        3: 1100   
    };

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
        el.style.transform = `translate(${x}px, ${y}px)`; // scale успадковується з CSS якщо не перезаписати, але тут ми рухаємо через translate

        setTimeout(() => {
            if(document.body.contains(el)) animatePlayer(el);
        }, duration);
    }

    // --- 2. ЕФЕКТИ (Шлейф та Клік) ---
    
    // Створення частинки шлейфу
    function createTrailDot(x, y) {
        const dot = document.createElement('div');
        dot.className = 'trail-dot';
        // Центруємо частинку відносно координат снитча (додаємо зміщення, бо снитч 24px)
        dot.style.left = (x + 8) + 'px'; 
        dot.style.top = (y + 8) + 'px';
        gameLayer.appendChild(dot);

        // Видаляємо після анімації (0.6s в CSS)
        setTimeout(() => { dot.remove(); }, 600);
    }

    // Запуск генератора шлейфу
    function startTrail(snitchEl) {
        if(state.trailInterval) clearInterval(state.trailInterval);
        
        state.trailInterval = setInterval(() => {
            if(!state.isPlaying || !snitchEl) return;
            // Беремо поточні координати снитча (вони змінюються плавно через CSS)
            const rect = snitchEl.getBoundingClientRect();
            createTrailDot(rect.left, rect.top);
        }, 40); // Кожні 40мс ставимо крапку
    }

    // Візуальний ефект спіймання
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

        // Перевірка на програш
        if (state.misses >= maxMisses) {
            gameOver();
            return;
        }

        // Рівні
        if (state.score >= 10) state.level = 3;
        else if (state.score >= 5) state.level = 2;
        else state.level = 1;

        const lifeTime = levels[state.level];

        // Знаходимо або створюємо снитч
        let snitch = document.getElementById('snitch');
        if (!snitch) {
            snitch = document.createElement('div');
            snitch.id = 'snitch';
            
            // Клік по снитчу
            snitch.onmousedown = snitch.ontouchstart = (e) => {
                e.preventDefault(); 
                if(!state.isPlaying) return;
                
                // Отримуємо координати кліку для ефекту
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                
                catchSnitch(snitch, clientX, clientY);
            };
            
            gameLayer.appendChild(snitch);
            // Запускаємо шлейф
            startTrail(snitch);
        }

        // Нова позиція (безпечні відступи)
        const padding = 50; 
        const maxX = window.innerWidth - padding * 2;
        const maxY = window.innerHeight - padding * 2;
        const x = padding + Math.random() * maxX;
        const y = padding + Math.random() * maxY;

        // Задаємо нові координати. CSS transition зробить рух плавним.
        snitch.style.left = `${x}px`;
        snitch.style.top = `${y}px`;

        // Скидаємо старий таймер "втечі"
        if (state.snitchTimer) clearTimeout(state.snitchTimer);

        // Таймер: якщо не спіймав за lifeTime
        state.snitchTimer = setTimeout(() => {
            if(state.isPlaying) {
                // Промах!
                state.misses++;
                updateUI();
                
                // Снитч летить далі (рекурсія)
                if (state.misses < maxMisses) {
                    spawnSnitch(); 
                } else {
                    gameOver();
                }
            }
        }, lifeTime);
    }

    function catchSnitch(el, clickX, clickY) {
        // Зупиняємо таймер втечі
        clearTimeout(state.snitchTimer);
        
        // ВІБРАЦІЯ (Проста, без дозволів, працює на Android завжди, на iOS при взаємодії)
        if(navigator.vibrate) navigator.vibrate(70);

        // Візуальний ефект
        createCatchEffect(clickX, clickY);

        state.score++;
        updateUI();
        
        // Миттєво переміщуємо снитч у нове місце (імітуємо, що він втік і з'явиться в іншому місці)
        // Або можна дати йому "зникнути" і з'явитися.
        // Для динаміки краще хай летить далі одразу.
        setTimeout(spawnSnitch, 100); 
    }

    // --- 4. УПРАВЛІННЯ ГРОЮ ---
    function startGame() {
        state = { score: 0, misses: 0, level: 1, isPlaying: true, snitchTimer: null, trailInterval: null };
        updateUI();
        
        modalOverlay.classList.remove('active');
        startModal.style.display = 'none';
        endModal.style.display = 'none';

        spawnSnitch();
    }

    function gameOver() {
        state.isPlaying = false;
        clearTimeout(state.snitchTimer);
        clearInterval(state.trailInterval);
        
        const snitch = document.getElementById('snitch');
        if (snitch) snitch.remove(); // Прибираємо снитч в кінці

        finalScoreText.textContent = `Твій результат: ${state.score} очок`;
        
        modalOverlay.classList.add('active');
        startModal.style.display = 'none';
        endModal.style.display = 'block';
    }

    function updateUI() {
        scoreVal.textContent = state.score;
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