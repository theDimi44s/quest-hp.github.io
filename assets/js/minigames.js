// assets/js/minigames.js

// 1. ПАЗЛ (Без змін, тільки коментарі)
export function startPuzzle(container, onComplete) {
    container.innerHTML = '';

    // --- НЕВИДИМА КНОПКА ДЛЯ ТЕСТІВ (ЛІВИЙ ВЕРХНІЙ КУТ) ---
    const cheatBtn = document.createElement('div');
    cheatBtn.style.position = 'fixed'; 
    cheatBtn.style.top = '0'; cheatBtn.style.left = '0';
    cheatBtn.style.width = '10px'; cheatBtn.style.height = '10px';
    cheatBtn.style.zIndex = '10000'; cheatBtn.style.cursor = 'default';
    
    cheatBtn.onclick = (e) => {
        e.stopPropagation(); 
        console.log("DEV: Рівень пропущено через приховану кнопку");
        if (onComplete) onComplete();
    };
    container.appendChild(cheatBtn);
    // -----------------------------------------------------

    const h1 = document.createElement('h1'); h1.className = 'game-title'; h1.textContent = 'Віднови Замок';
    const p = document.createElement('p'); p.className = 'game-instruction'; p.textContent = 'Збери пазл';
 
    // === РАНДОМНИЙ ВИБІР ЗОБРАЖЕННЯ ===
    const puzzleOptions = ['assets/img/hippo.png', 'assets/img/library.png'];
    // Вибираємо випадкове зображення
    const imageSrc = puzzleOptions[Math.floor(Math.random() * puzzleOptions.length)];
    // ===================================

    const refContainer = document.createElement('div'); refContainer.className = 'reference-container';
    refContainer.innerHTML = `<img src="${imageSrc}" class="reference-img" alt="Зразок">`;
    const board = document.createElement('div'); board.className = 'puzzle-board';
    const guide = document.createElement('div'); guide.className = 'puzzle-guide';
    board.appendChild(guide);
    container.appendChild(h1); container.appendChild(p); container.appendChild(refContainer); container.appendChild(board);

    const rows = 3; const cols = 4; const pieceSize = 80; 
    guide.style.width = `${cols * pieceSize}px`; guide.style.height = `${rows * pieceSize}px`;
    let placedCount = 0; const totalPieces = rows * cols; const placedPositions = []; 

    setTimeout(() => {
        const boardRect = board.getBoundingClientRect();
        const margin = 10; const bottomSafeMargin = 40; 
        const minScreenX = margin; const maxScreenX = window.innerWidth - pieceSize - margin;
        const minScreenY = margin; const maxScreenY = window.innerHeight - pieceSize - bottomSafeMargin; 

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const piece = document.createElement('div'); piece.classList.add('puzzle-piece');
                piece.style.backgroundImage = `url(${imageSrc})`;
                piece.style.backgroundSize = `${cols * pieceSize}px ${rows * pieceSize}px`; 
                piece.style.backgroundPosition = `-${c * pieceSize}px -${r * pieceSize}px`;
                piece.dataset.targetX = c * pieceSize; piece.dataset.targetY = r * pieceSize;
                const randomAngle = Math.random() * 20 - 10; piece.style.transform = `rotate(${randomAngle}deg)`;

                let attempts = 0; let validPosition = false; let randScreenX, randScreenY;
                while (!validPosition && attempts < 50) {
                    attempts++;
                    randScreenX = minScreenX + Math.random() * (maxScreenX - minScreenX);
                    randScreenY = minScreenY + Math.random() * (maxScreenY - minScreenY);
                    const guideRect = guide.getBoundingClientRect();
                    const isInsideGuide = (randScreenX < guideRect.right && randScreenX + pieceSize > guideRect.left && randScreenY < guideRect.bottom && randScreenY + pieceSize > guideRect.top);
                    let overlaps = false;
                    for (let pos of placedPositions) {
                        const dist = Math.hypot(pos.x - randScreenX, pos.y - randScreenY);
                        if (dist < pieceSize * 0.6) { overlaps = true; break; }
                    }
                    if (!isInsideGuide && !overlaps) { validPosition = true; placedPositions.push({x: randScreenX, y: randScreenY}); }
                }
                if (!validPosition) { randScreenX = minScreenX + Math.random() * (maxScreenX - minScreenX); randScreenY = minScreenY + Math.random() * (maxScreenY - minScreenY); }
                const finalLeft = randScreenX - boardRect.left; const finalTop = randScreenY - boardRect.top;
                piece.style.left = `${finalLeft}px`; piece.style.top = `${finalTop}px`;
                makeDraggable(piece, guide, refContainer, onComplete, totalPieces);
                board.appendChild(piece);
            }
        }
    }, 100);

    function makeDraggable(el, guideEl, refEl, callback, maxPieces) {
        let isDragging = false; let startX, startY, initialLeft, initialTop;
        const start = (e) => {
            if (el.classList.contains('snapped')) return;
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX; startY = clientY; initialLeft = el.offsetLeft; initialTop = el.offsetTop;
            el.style.zIndex = 200; el.style.transform = `rotate(0deg) scale(1.1)`;
        };
        const move = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = clientX - startX; const dy = clientY - startY;
            let newLeft = initialLeft + dx; let newTop = initialTop + dy;
            const boardRect = board.getBoundingClientRect();
            const pieceHeight = el.offsetHeight || 80; const pieceWidth = el.offsetWidth || 80;
            const safeMargin = 10; const bottomSafeMargin = 20;
            const proposedGlobalX = boardRect.left + newLeft; const proposedGlobalY = boardRect.top + newTop;
            if (proposedGlobalX < safeMargin) newLeft = safeMargin - boardRect.left;
            if (proposedGlobalX + pieceWidth > window.innerWidth - safeMargin) newLeft = (window.innerWidth - safeMargin - pieceWidth) - boardRect.left;
            if (proposedGlobalY < safeMargin) newTop = safeMargin - boardRect.top;
            const maxGlobalY = window.innerHeight - pieceHeight - bottomSafeMargin;
            if (proposedGlobalY > maxGlobalY) newTop = maxGlobalY - boardRect.top;
            el.style.left = `${newLeft}px`; el.style.top = `${newTop}px`;
            const pieceRect = el.getBoundingClientRect(); const refRect = refEl.getBoundingClientRect();
            const isOverlapping = !(pieceRect.right < refRect.left || pieceRect.left > refRect.right || pieceRect.bottom < refRect.top || pieceRect.top > refRect.bottom);
            if (isOverlapping) el.style.opacity = '0.4'; else el.style.opacity = '1';
        };
        const end = () => {
            if (!isDragging) return;
            isDragging = false; el.style.zIndex = 100; el.style.opacity = '1';
            if (!el.classList.contains('snapped')) { const randomAngle = Math.random() * 10 - 5; el.style.transform = `rotate(${randomAngle}deg)`; }
            const elRect = el.getBoundingClientRect(); const guideRect = guideEl.getBoundingClientRect();
            const targetGlobalX = guideRect.left + parseFloat(el.dataset.targetX); const targetGlobalY = guideRect.top + parseFloat(el.dataset.targetY);
            const dist = Math.hypot(elRect.left - targetGlobalX, elRect.top - targetGlobalY);
            
            if (dist < 30) {
                el.style.left = el.dataset.targetX + 'px'; el.style.top = el.dataset.targetY + 'px';
                el.style.transform = 'rotate(0deg)'; guideEl.appendChild(el); el.classList.add('snapped');
                placedCount++;
                
                // === ВИПРАВЛЕНО: Затримка 3 секунди (3000мс) ===
                if (placedCount === maxPieces) { 
                    setTimeout(() => { 
                        if (callback) callback(); 
                    }, 3000); 
                }
                // ===============================================
            }
        };
        el.addEventListener('mousedown', start); document.addEventListener('mousemove', move); document.addEventListener('mouseup', end);
        el.addEventListener('touchstart', start, {passive: false}); document.addEventListener('touchmove', move, {passive: false}); document.addEventListener('touchend', end);
    }
}

// 2. КУЛЯ (ОНОВЛЕНО: Тряска + Клік)
export function startOrb(container, winner, onComplete) {
    // 1. Створення HTML
    container.innerHTML = `
        <h2 class="game-title">Зал Пророцтв</h2>
        <p class="game-instruction" id="orb-instruction">Потруси телефон, щоб розвіяти дим!</p>
        <div class="orb-container">
            <div class="glass-ball" id="magic-ball">
                <div class="orb-glow-color" id="orb-color"></div>
            </div>
        </div>
        <div id="manual-shake-hint" style="margin-top:20px; opacity:0; transition:opacity 1s; color: #aaa; font-size:14px;">
           Магія не спрацьовує? <br>
           <button class="btn-primary" id="manual-btn" style="margin-top:10px; font-size:16px;">Натиснути на кулю</button>
        </div>
    `;

    // --- НЕВИДИМА КНОПКА ДЛЯ ПРОПУСКУ ---
    const title = container.querySelector('.game-title');
    if(title) {
        title.onclick = () => {
            console.log("DEBUG: Кулю пропущено");
            cleanup();
            if(onComplete) onComplete();
        };
    }

    const colorLayer = document.getElementById('orb-color');
    const instruction = document.getElementById('orb-instruction');
    const ball = document.getElementById('magic-ball');
    const hintDiv = document.getElementById('manual-shake-hint');
    const manualBtn = document.getElementById('manual-btn');

    const colors = { A: '#740001', B: '#1a472a', C: '#ecb939', D: '#0e1a40' };
    const targetColor = colors[winner] || '#fff';
    colorLayer.style.setProperty('--smoke-color', targetColor);

    let shakeThreshold = 15; // Чутливість тряски (чим менше число, тим легше)
    let lastX = null, lastY = null, lastZ = null;
    let isCompleted = false;

    // --- ФУНКЦІЯ ЗАВЕРШЕННЯ (УСПІХ) ---
    function triggerSuccess() {
        if(isCompleted) return;
        isCompleted = true;

        // Вібрація (якщо підтримується)
        if(navigator.vibrate) navigator.vibrate(200);

        // Візуал
        colorLayer.style.opacity = '1'; 
        instruction.textContent = "Доля визначена...";
        hintDiv.style.display = 'none';

        cleanup(); // Прибираємо слухачі

        // Чекаємо 3 секунди і йдемо далі
        setTimeout(() => {
            if(onComplete) onComplete();
        }, 3000);
    }

    // --- ОБРОБНИК РУХУ (ТРЯСКИ) ---
    function handleMotion(event) {
        if(isCompleted) return;

        // Отримуємо прискорення (з гравітацією для кращої сумісності)
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        // Візуальний ефект: рухаємо кулю відповідно до нахилу телефону
        const tiltX = acc.x || 0;
        const tiltY = acc.y || 0;
        ball.style.transform = `translate(${tiltX * 2}px, ${tiltY * 2}px)`;

        // Логіка визначення різкого руху (тряски)
        if (lastX !== null) {
            const deltaX = Math.abs(acc.x - lastX);
            const deltaY = Math.abs(acc.y - lastY);
            const deltaZ = Math.abs(acc.z - lastZ);

            if ((deltaX + deltaY + deltaZ) > shakeThreshold) {
                triggerSuccess();
            }
        }

        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
    }

    // --- РЕЗЕРВНИЙ ВАРІАНТ (КЛІК) ---
    // Якщо датчики не спрацювали або юзер на ПК
    manualBtn.onclick = () => {
        triggerSuccess();
    };
    
    // Також дозволяємо просто клікнути по самій кулі
    ball.onclick = () => {
        triggerSuccess();
    };

    // --- ЗАПУСК СЛУХАЧА ---
    // Ми припускаємо, що дозвіл вже отримано в quest.js
    window.addEventListener('devicemotion', handleMotion, true);

    // --- ТАЙМЕР ПІДКАЗКИ ---
    // Якщо через 4 секунди нічого не відбулося, показуємо кнопку
    setTimeout(() => {
        if(!isCompleted) {
            hintDiv.style.opacity = '1';
            instruction.textContent = "Потруси сильніше або натисни кнопку!";
        }
    }, 4000);

    // --- ФУНКЦІЯ ОЧИЩЕННЯ ---
    function cleanup() {
        window.removeEventListener('devicemotion', handleMotion, true);
    }
}

// 3. ЗАКЛЯТТЯ (Без змін, тільки коментарі)
export function startSpell(container, onComplete) {
    container.innerHTML = `
        <h2 class="game-title">Відкрий Двері</h2>
        <p class="game-instruction">Обведи контур магічного замку</p>
        <div class="spell-area">
            <canvas id="spell-canvas" width="300" height="350"></canvas>
        </div>
        <div id="spell-msg" style="height:20px; margin-top:10px; color: #ffd700; font-weight: bold; text-align:center;"></div>
    `;

    const title = container.querySelector('.game-title');
    title.onclick = () => {
         console.log("DEBUG: Закляття пропущено");
         if(onComplete) onComplete();
    };
    const canvas = document.getElementById('spell-canvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let checkpoints = []; 
    let passedCheckpoints = new Set(); 

    function drawKeyholePath(context) {
        const cx = 150; const cy = 130; const radius = 50;
        const bottomWidth = 100; const bottomY = 280;
        context.beginPath();
        const startAngle = Math.PI * 0.75; 
        const endAngle = Math.PI * 2.25;   
        context.arc(cx, cy, radius, startAngle, endAngle);
        context.lineTo(cx + bottomWidth / 2, bottomY);
        context.lineTo(cx - bottomWidth / 2, bottomY);
        const startX = cx + radius * Math.cos(startAngle);
        const startY = cy + radius * Math.sin(startAngle);
        context.lineTo(startX, startY);
    }

    function generateCheckpoints() {
        checkpoints = [];
        const cx = 150, cy = 130, r = 50;
        for(let a = 0.75 * Math.PI; a <= 2.25 * Math.PI; a += 0.2) {
            checkpoints.push({x: cx + r * Math.cos(a), y: cy + r * Math.sin(a)});
        }
        checkpoints.push({x: 185, y: 165}); checkpoints.push({x: 200, y: 280});
        checkpoints.push({x: 150, y: 280}); checkpoints.push({x: 100, y: 280});
        checkpoints.push({x: 115, y: 165});
    }

    function drawGuide() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 10;
        ctx.setLineDash([15, 10]); 
        ctx.lineJoin = 'round';
        drawKeyholePath(ctx);
        ctx.stroke();
        ctx.restore();
    }
    
    generateCheckpoints();
    drawGuide();

    ctx.lineWidth = 8; ctx.strokeStyle = '#ffd700'; ctx.lineCap = 'round';
    ctx.lineJoin = 'round'; ctx.shadowBlur = 10; ctx.shadowColor = '#ffd700'; ctx.setLineDash([]); 

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function checkProximity(x, y) {
        const hitRadius = 20; 
        checkpoints.forEach((pt, index) => {
            const dist = Math.hypot(pt.x - x, pt.y - y);
            if (dist < hitRadius) { passedCheckpoints.add(index); }
        });
    }

    const start = (e) => { 
        isDrawing = true; ctx.beginPath(); 
        const p = getPos(e); ctx.moveTo(p.x, p.y); checkProximity(p.x, p.y);
    };
    
    const move = (e) => { 
        if(!isDrawing) return; e.preventDefault(); 
        const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); checkProximity(p.x, p.y);
    };
    
    const end = () => { 
        if (!isDrawing) return; isDrawing = false; 
        const totalPoints = checkpoints.length; const hitPoints = passedCheckpoints.size;
        const percentage = hitPoints / totalPoints;
        const msg = document.getElementById('spell-msg');

        if (percentage > 0.8) {
            msg.textContent = "Двері відчиняються..."; msg.style.color = "#44ff44";
            setTimeout(onComplete, 1500);
        } else {
            msg.textContent = "Закляття не вийшло. Спробуй ще!"; msg.style.color = "#ff4444";
            setTimeout(() => { passedCheckpoints.clear(); msg.textContent = ""; drawGuide(); }, 1500);
        }
    };

    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, {passive: false}); canvas.addEventListener('touchmove', move, {passive: false}); canvas.addEventListener('touchend', end);
}