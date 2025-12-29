// assets/js/minigames.js

function addCheatButton(container, onComplete) {
    const cheatBtn = document.createElement('div');
    cheatBtn.style.cssText = 'position:fixed;top:0;left:0;width:20px;height:20px;z-index:99999;cursor:pointer;';
    cheatBtn.onclick = (e) => {
        e.stopPropagation(); 
        console.log("DEV: Рівень пропущено");
        if (onComplete) onComplete();
    };
    container.appendChild(cheatBtn);
}

// 1. ПАЗЛ
export function startPuzzle(container, onComplete) {
    container.innerHTML = '';
    addCheatButton(container, onComplete);

    const h1 = document.createElement('h1'); h1.className = 'game-title'; h1.textContent = 'Віднови Замок';
    const p = document.createElement('p'); p.className = 'game-instruction'; p.textContent = 'Збери пазл';
    const puzzleOptions = ['assets/img/hippo.png', 'assets/img/library.png'];
    const imageSrc = puzzleOptions[Math.floor(Math.random() * puzzleOptions.length)];
    const refContainer = document.createElement('div'); refContainer.className = 'reference-container';
    const refImg = document.createElement('img'); refImg.src = imageSrc; refImg.className = 'reference-img';
    refContainer.appendChild(refImg);
    const board = document.createElement('div'); board.className = 'puzzle-board';
    const guide = document.createElement('div'); guide.className = 'puzzle-guide';
    board.appendChild(guide);
    container.appendChild(h1); container.appendChild(p); container.appendChild(refContainer); container.appendChild(board);

    const rows = 3; const cols = 4; const pieceSize = 80; 
    guide.style.width = `${cols * pieceSize}px`; guide.style.height = `${rows * pieceSize}px`;
    let placedCount = 0; const totalPieces = rows * cols; const placedPositions = []; 

    const initGame = () => {
        setTimeout(() => {
            const boardRect = board.getBoundingClientRect();
            const vw = window.innerWidth; const vh = window.innerHeight;
            const minScreenX = 10; const maxScreenX = vw - pieceSize - 10;
            const minScreenY = 60; const maxScreenY = vh - pieceSize - 140; 

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const piece = document.createElement('div'); piece.classList.add('puzzle-piece');
                    piece.style.backgroundImage = `url(${imageSrc})`;
                    piece.style.backgroundSize = `${cols * pieceSize}px ${rows * pieceSize}px`; 
                    piece.style.backgroundPosition = `-${c * pieceSize}px -${r * pieceSize}px`;
                    piece.dataset.targetX = c * pieceSize; piece.dataset.targetY = r * pieceSize;
                    const randomAngle = Math.random() * 20 - 10; piece.style.transform = `rotate(${randomAngle}deg)`;

                    let attempts = 0; let validPosition = false; let randScreenX, randScreenY;
                    while (!validPosition && attempts < 100) {
                        attempts++;
                        randScreenX = minScreenX + Math.random() * (maxScreenX - minScreenX);
                        randScreenY = minScreenY + Math.random() * (maxScreenY - minScreenY);
                        const guideRect = guide.getBoundingClientRect();
                        const isInsideGuide = (randScreenX < guideRect.right && randScreenX + pieceSize > guideRect.left && randScreenY < guideRect.bottom && randScreenY + pieceSize > guideRect.top);
                        let overlaps = false;
                        for (let pos of placedPositions) {
                            if (Math.hypot(pos.x - randScreenX, pos.y - randScreenY) < pieceSize * 0.6) { overlaps = true; break; }
                        }
                        if (!isInsideGuide && !overlaps) { validPosition = true; placedPositions.push({x: randScreenX, y: randScreenY}); }
                    }
                    if (!validPosition) {
                        randScreenX = minScreenX + Math.random() * (maxScreenX - minScreenX);
                        randScreenY = minScreenY + Math.random() * (vh / 3);
                    }
                    piece.style.left = `${randScreenX - boardRect.left}px`; piece.style.top = `${randScreenY - boardRect.top}px`;
                    makeDraggable(piece, guide, refContainer, onComplete, totalPieces);
                    board.appendChild(piece);
                }
            }
        }, 100);
    };

    if (refImg.complete) initGame(); else refImg.onload = initGame;

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
            if (!isDragging) return; e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const boardRect = board.getBoundingClientRect();
            const vw = window.innerWidth; const vh = window.innerHeight;
            let newLeft = initialLeft + (clientX - startX);
            let newTop = initialTop + (clientY - startY);
            const globalX = boardRect.left + newLeft; const globalY = boardRect.top + newTop;
            if (globalX < 5) newLeft = 5 - boardRect.left;
            if (globalX + 80 > vw - 5) newLeft = (vw - 5 - 80) - boardRect.left;
            if (globalY < 5) newTop = 5 - boardRect.top;
            if (globalY + 80 > vh - 20) newTop = (vh - 20 - 80) - boardRect.top;
            el.style.left = `${newLeft}px`; el.style.top = `${newTop}px`;
            const pieceRect = el.getBoundingClientRect(); const refRect = refEl.getBoundingClientRect();
            el.style.opacity = !(pieceRect.right < refRect.left || pieceRect.left > refRect.right || pieceRect.bottom < refRect.top || pieceRect.top > refRect.bottom) ? '0.4' : '1';
        };
        const end = () => {
            if (!isDragging) return; isDragging = false; el.style.zIndex = 100; el.style.opacity = '1';
            if (!el.classList.contains('snapped')) el.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;
            const elRect = el.getBoundingClientRect(); const guideRect = guideEl.getBoundingClientRect();
            const targetGlobalX = guideRect.left + parseFloat(el.dataset.targetX); 
            const targetGlobalY = guideRect.top + parseFloat(el.dataset.targetY);
            if (Math.hypot(elRect.left - targetGlobalX, elRect.top - targetGlobalY) < 30) {
                el.style.left = el.dataset.targetX + 'px'; el.style.top = el.dataset.targetY + 'px';
                el.style.transform = 'rotate(0deg)'; guideEl.appendChild(el); el.classList.add('snapped');
                placedCount++;
                if (placedCount === maxPieces) { 
                    const msg = document.createElement('div');
                    msg.className = 'puzzle-success-msg'; msg.textContent = 'Пазл відновлено!';
                    container.appendChild(msg);
                    setTimeout(() => { if (callback) callback(); }, 4000); 
                }
            }
        };
        el.addEventListener('mousedown', start); document.addEventListener('mousemove', move); document.addEventListener('mouseup', end);
        el.addEventListener('touchstart', start, {passive: false}); document.addEventListener('touchmove', move, {passive: false}); document.addEventListener('touchend', end);
    }
}

// 2. КУЛЯ (Оновлено: додано картинку підставки Prophecy.png)
export function startOrb(container, winner, onComplete, onSuccess) {
    container.innerHTML = `
        <h2 class="game-title">Зал Пророцтв</h2>
        <p class="game-instruction" id="orb-instruction">Потруси телефон, щоб розвіяти дим!</p>
        
        <div class="orb-wrapper">
            <img src="assets/img/Prophecy.png" class="orb-stand-img" alt="Prophecy Stand">
            
            <div class="glass-ball" id="magic-ball">
                <div class="orb-glow-color" id="orb-color"></div>
            </div>
        </div>

        <div id="manual-shake-hint" style="margin-top:10px; min-height: 40px; opacity:0; transition:opacity 1s; color: #aaa; font-size:14px; text-align: center;">
           Магія не спрацьовує? <br><button class="btn-primary" id="manual-btn" style="margin-top:10px; font-size:16px;">Натиснути на кулю</button>
        </div>
    `;

    addCheatButton(container, () => { triggerSuccess(); });

    // ... (решта коду функції залишається без змін: const colorLayer = ... і далі)
    const colorLayer = document.getElementById('orb-color');
    const instruction = document.getElementById('orb-instruction');
    const ball = document.getElementById('magic-ball');
    const hintDiv = document.getElementById('manual-shake-hint');
    const manualBtn = document.getElementById('manual-btn');

    const colors = { A: '#740001', B: '#1a472a', C: '#ecb939', D: '#0e1a40' };
    colorLayer.style.setProperty('--smoke-color', colors[winner] || '#fff');

    let shakeThreshold = 15; let lastX = null, lastY = null, lastZ = null; let isCompleted = false;

    function triggerSuccess() {
        if(isCompleted) return; isCompleted = true;
        if(navigator.vibrate) navigator.vibrate(200);
        
        if(manualBtn) manualBtn.style.display = 'none';
        hintDiv.textContent = ''; 
        hintDiv.style.opacity = '0';
        
        colorLayer.style.opacity = '1'; 
        instruction.textContent = "Доля визначена...";
        
        if(onSuccess) onSuccess();

        setTimeout(() => {
            hintDiv.innerHTML = '<span style="color: #ffd700; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px rgba(0,0,0,0.8);">Мені здається, ми обрали тобі факультет!</span>';
            hintDiv.style.display = 'block'; hintDiv.style.opacity = '1';
        }, 1500); 

        cleanup(); 
        setTimeout(() => { if(onComplete) onComplete(); }, 6000);
    }

    function handleMotion(event) {
        if(isCompleted) return;
        const acc = event.accelerationIncludingGravity; if (!acc) return;
        if (lastX !== null) {
            if ((Math.abs(acc.x-lastX) + Math.abs(acc.y-lastY) + Math.abs(acc.z-lastZ)) > shakeThreshold) triggerSuccess();
        }
        lastX = acc.x; lastY = acc.y; lastZ = acc.z;
    }

    manualBtn.onclick = () => triggerSuccess();
    ball.onclick = () => triggerSuccess();
    window.addEventListener('devicemotion', handleMotion, true);

    setTimeout(() => {
        if(!isCompleted) { hintDiv.style.opacity = '1'; instruction.textContent = "Потруси сильніше або натисни кнопку!"; }
    }, 4000);

    function cleanup() { window.removeEventListener('devicemotion', handleMotion, true); }
}

// 3. ЗАКЛЯТТЯ (Без змін)
export function startSpell(container, onComplete) {
    container.innerHTML = `
        <h2 class="game-title">Відкрий Двері</h2>
        <p class="game-instruction">Обведи контур магічного замку</p>
        <div class="spell-area"><canvas id="spell-canvas" width="300" height="350"></canvas></div>
        <div id="spell-msg" style="height:20px; margin-top:10px; color: #ffd700; font-weight: bold; text-align:center;"></div>
    `;
    
    addCheatButton(container, onComplete);

    const canvas = document.getElementById('spell-canvas'); const ctx = canvas.getContext('2d');
    let isDrawing = false; let checkpoints = []; let passedCheckpoints = new Set(); 

    function drawKeyholePath(context) {
        const cx = 150; const cy = 130; const radius = 50;
        context.beginPath(); context.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 2.25);
        context.lineTo(200, 280); context.lineTo(100, 280);
        const startX = cx + radius * Math.cos(Math.PI * 0.75); const startY = cy + radius * Math.sin(Math.PI * 0.75);
        context.lineTo(startX, startY);
    }
    function generateCheckpoints() {
        const cx = 150, cy = 130, r = 50;
        for(let a = 0.75 * Math.PI; a <= 2.25 * Math.PI; a += 0.2) checkpoints.push({x: cx + r * Math.cos(a), y: cy + r * Math.sin(a)});
        checkpoints.push({x: 185, y: 165}); checkpoints.push({x: 200, y: 280}); checkpoints.push({x: 150, y: 280}); checkpoints.push({x: 100, y: 280}); checkpoints.push({x: 115, y: 165});
    }
    function drawGuide() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 10;
        ctx.setLineDash([15, 10]); ctx.lineJoin = 'round'; drawKeyholePath(ctx); ctx.stroke(); ctx.restore();
    }
    generateCheckpoints(); drawGuide();
    ctx.lineWidth = 8; ctx.strokeStyle = '#ffd700'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowBlur = 10; ctx.shadowColor = '#ffd700';

    function getPos(e) {
        const rect = canvas.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }
    function checkProximity(x, y) {
        checkpoints.forEach((pt, index) => { if (Math.hypot(pt.x - x, pt.y - y) < 20) passedCheckpoints.add(index); });
    }
    const start = (e) => { isDrawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); checkProximity(p.x, p.y); };
    const move = (e) => { if(!isDrawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); checkProximity(p.x, p.y); };
    const end = () => { 
        if (!isDrawing) return; isDrawing = false; 
        if ((passedCheckpoints.size / checkpoints.length) > 0.8) {
            document.getElementById('spell-msg').textContent = "Двері відчиняються..."; 
            document.getElementById('spell-msg').style.color = "#44ff44";
            setTimeout(onComplete, 1500);
        } else {
            document.getElementById('spell-msg').textContent = "Закляття не вийшло. Спробуй ще!"; 
            document.getElementById('spell-msg').style.color = "#ff4444";
            setTimeout(() => { passedCheckpoints.clear(); document.getElementById('spell-msg').textContent = ""; drawGuide(); }, 1500);
        }
    };
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, {passive: false}); canvas.addEventListener('touchmove', move, {passive: false}); canvas.addEventListener('touchend', end);
}