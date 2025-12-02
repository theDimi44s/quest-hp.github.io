// assets/js/minigames.js

// --- ГРА 1: ПАЗЛ (Без змін у цьому запиті) ---
export function startPuzzle(container, onComplete) {
    const imageUrl = 'assets/img/castle.jpg';

    const subEl = document.getElementById('page-sub');
    if(subEl) subEl.textContent = "Перетягни шматочки на свої місця";

    container.innerHTML = `
        <div class="game-container">
            <h2 class="game-title">Віднови Замок</h2>
            <div class="puzzle-area" id="puzzle-area">
                <div class="puzzle-board-guide" id="guide"></div>
            </div>
        </div>
    `;

    const area = document.getElementById('puzzle-area');
    const guide = document.getElementById('guide');
    
    const boardW = 320; const boardH = 180; const cols = 4; const rows = 3;
    const cellW = boardW / cols; const cellH = boardH / rows;
    const tabHeight = Math.floor(Math.min(cellW, cellH) * 0.22);
    const safePadding = Math.round(tabHeight * 1.5); 
    const pieceW = cellW + (safePadding * 2); const pieceH = cellH + (safePadding * 2);

    const pieces = [];
    let placedCount = 0;

    const areaRect = area.getBoundingClientRect();
    const isMobile = window.innerWidth <= 600;
    const guideScale = isMobile ? 0.9 : 1.0; 

    guide.style.width = `${boardW * guideScale}px`;
    guide.style.height = `${boardH * guideScale}px`;

    const guideRect = guide.getBoundingClientRect();
    const guideLeft = guideRect.left - areaRect.left;
    const guideTop = guideRect.top - areaRect.top;

    const shapes = []; 
    for(let r=0; r<rows; r++) { shapes[r] = []; for(let c=0; c<cols; c++) { shapes[r][c] = { top: 0, right: 0, bottom: 0, left: 0 }; } }
    for(let r=0; r<rows; r++) { for(let c=0; c<cols; c++) { if(c < cols - 1) { const type = Math.random() > 0.5 ? 1 : -1; shapes[r][c].right = type; shapes[r][c+1].left = -type; } if(r < rows - 1) { const type = Math.random() > 0.5 ? 1 : -1; shapes[r][c].bottom = type; shapes[r+1][c].top = -type; } } }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.style.width = `${pieceW}px`;
            piece.style.height = `${pieceH}px`;
            piece.style.backgroundImage = `url('${imageUrl}')`;
            piece.style.backgroundRepeat = 'no-repeat';
            piece.style.backgroundSize = `${boardW * guideScale}px ${boardH * guideScale}px`;
            const bgX = Math.round((c * cellW * guideScale) - safePadding);
            const bgY = Math.round((r * cellH * guideScale) - safePadding);
            piece.style.backgroundPosition = `${-bgX}px ${-bgY}px`;
            const shape = shapes[r][c];
            const pathString = getRobustPuzzlePath(cellW * guideScale, cellH * guideScale, tabHeight, safePadding, shape.top, shape.right, shape.bottom, shape.left);
            const pathCSS = `path('${pathString}')`;
            piece.style.webkitClipPath = pathCSS;
            piece.style.clipPath = pathCSS;
            const destInGuideX = (c * cellW * guideScale) - safePadding;
            const destInGuideY = (r * cellH * guideScale) - safePadding;
            const correctX = guideLeft + destInGuideX;
            const correctY = guideTop + destInGuideY;
            piece.dataset.destX = correctX;
            piece.dataset.destY = correctY;

            const pieceRealW = pieceW;
            const pieceRealH = pieceH;
            const maxX = areaRect.width - pieceRealW;
            const maxY = areaRect.height - pieceRealH;
            const guideBottom = guideTop + (boardH * guideScale);
            const startY = guideBottom + 10; 
            let randX, randY;
            if (isMobile) {
                randX = Math.random() * maxX;
                const availableH = maxY - startY;
                if (availableH > 30) {
                    randY = startY + Math.random() * availableH;
                } else {
                    randY = maxY - 5;
                }
            } else {
                randX = Math.random() * maxX;
                randY = Math.random() * maxY;
            }
            if(randX < 0) randX = 0; if(randY < 0) randY = 0; if(randX > maxX) randX = maxX; if(randY > maxY) randY = maxY;
            piece.style.left = `${randX}px`;
            piece.style.top = `${randY}px`;
            makeDraggable(piece, correctX, correctY, area);
            area.appendChild(piece);
            pieces.push(piece);
        }
    }

    function getRobustPuzzlePath(w, h, tab, padding, top, right, bottom, left) { const startX = padding; const startY = padding; const f = (val) => Number(val.toFixed(1)); let path = `M ${f(startX)} ${f(startY)}`; const neck = tab * 0.2; const head = tab * 1.0; if (top === 0) path += ` L ${f(startX + w)} ${f(startY)}`; else { const sign = -1 * top; const cx = startX + w / 2; const cy = startY; path += ` L ${f(cx - neck * 2)} ${f(cy)}`; path += ` C ${f(cx - neck * 2)} ${f(cy + sign * head)}, ${f(cx + neck * 2)} ${f(cy + sign * head)}, ${f(cx + neck * 2)} ${f(cy)}`; path += ` L ${f(startX + w)} ${f(startY)}`; } if (right === 0) path += ` L ${f(startX + w)} ${f(startY + h)}`; else { const sign = 1 * right; const cx = startX + w; const cy = startY + h / 2; path += ` L ${f(cx)} ${f(cy - neck * 2)}`; path += ` C ${f(cx + sign * head)} ${f(cy - neck * 2)}, ${f(cx + sign * head)} ${f(cy + neck * 2)}, ${f(cx)} ${f(cy + neck * 2)}`; path += ` L ${f(startX + w)} ${f(startY + h)}`; } if (bottom === 0) path += ` L ${f(startX)} ${f(startY + h)}`; else { const sign = 1 * bottom; const cx = startX + w / 2; const cy = startY + h; path += ` L ${f(cx + neck * 2)} ${f(cy)}`; path += ` C ${f(cx + neck * 2)} ${f(cy + sign * head)}, ${f(cx - neck * 2)} ${f(cy + sign * head)}, ${f(cx - neck * 2)} ${f(cy)}`; path += ` L ${f(startX)} ${f(startY + h)}`; } if (left === 0) path += ` L ${f(startX)} ${f(startY)}`; else { const sign = -1 * left; const cx = startX; const cy = startY + h / 2; path += ` L ${f(cx)} ${f(cy + neck * 2)}`; path += ` C ${f(cx + sign * head)} ${f(cy + neck * 2)}, ${f(cx + sign * head)} ${f(cy - neck * 2)}, ${f(cx)} ${f(cy - neck * 2)}`; path += ` L ${f(startX)} ${f(startY)}`; } path += " Z"; return path; }
    function makeDraggable(el, destX, destY, boundariesEl) { let isDragging = false; let startX, startY, initialLeft, initialTop; const startHandler = (e) => { if (el.classList.contains('snapped')) return; isDragging = true; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; startX = clientX; startY = clientY; initialLeft = parseFloat(el.style.left); initialTop = parseFloat(el.style.top); el.style.zIndex = 1000; e.preventDefault(); }; const moveHandler = (e) => { if (!isDragging) return; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; const dx = clientX - startX; const dy = clientY - startY; let newLeft = initialLeft + dx; let newTop = initialTop + dy; const maxL = boundariesEl.clientWidth - el.offsetWidth; const maxT = boundariesEl.clientHeight - el.offsetHeight; if(newLeft < 0) newLeft = 0; if(newTop < 0) newTop = 0; if(newLeft > maxL) newLeft = maxL; if(newTop > maxT) newTop = maxT; el.style.left = `${newLeft}px`; el.style.top = `${newTop}px`; e.preventDefault(); }; const endHandler = () => { if (!isDragging) return; isDragging = false; const currentLeft = parseFloat(el.style.left); const currentTop = parseFloat(el.style.top); if (Math.abs(currentLeft - destX) < 40 && Math.abs(currentTop - destY) < 40) { el.style.left = `${destX}px`; el.style.top = `${destY}px`; el.classList.add('snapped'); playSnapSound(); placedCount++; if (placedCount === pieces.length) { setTimeout(() => showModal("Замок відновлено!", onComplete), 500); } } else { el.style.zIndex = 20; } }; el.addEventListener('mousedown', startHandler); el.addEventListener('touchstart', startHandler, {passive: false}); window.addEventListener('mousemove', moveHandler); window.addEventListener('touchmove', moveHandler, {passive: false}); window.addEventListener('mouseup', endHandler); window.addEventListener('touchend', endHandler); }
    function playSnapSound() { try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = 600; o.type = 'triangle'; g.gain.setValueAtTime(0.05, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.1); } catch(e){} }
}


// --- ГРА 2: КУЛЯ (Без заголовка) ---
export function startOrb(container, winner, onComplete) {
    const subEl = document.getElementById('page-sub');
    if(subEl) subEl.textContent = ""; // Очистити текст

    // В HTML прибрано h2, тільки куля і кнопка
    container.innerHTML = `
        <div class="game-container">
            <div class="orb-container">
                <div class="glass-ball">
                    <div class="smoke-layer smoke-1"></div>
                    <div class="smoke-layer smoke-2"></div>
                    <div class="smoke-layer smoke-3"></div>
                    <div class="orb-glow-color" id="orb-color"></div>
                </div>
                <div class="orb-stand"></div>
            </div>
            <button id="shake-action-btn" class="shake-btn">Дізнатись долю</button>
            <button id="next-orb-btn" class="btn-primary" style="display:none; margin-top:20px;">Продовжити</button>
        </div>
    `;

    const colorLayer = document.getElementById('orb-color');
    const actionBtn = document.getElementById('shake-action-btn');
    const nextBtn = document.getElementById('next-orb-btn');

    const colorMap = { A: '#740001', B: '#1a472a', C: '#ecb939', D: '#0e1a40' };
    const targetColor = colorMap[winner] || '#ffffff';
    let activated = false;

    function activateOrb() {
        if (activated) return;
        activated = true;
        colorLayer.style.setProperty('--orb-color', targetColor);
        colorLayer.style.opacity = '0.9'; 
        actionBtn.style.display = 'none';
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(100, ctx.currentTime); o.frequency.linearRampToValueAtTime(400, ctx.currentTime + 3);
            g.gain.setValueAtTime(0.0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1.5); g.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 4);
            o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 4);
        } catch(e){}
        setTimeout(() => { nextBtn.style.display = 'inline-block'; nextBtn.onclick = onComplete; }, 4000);
    }

    actionBtn.onclick = () => {
        activateOrb();
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(response => {
                if (response == 'granted') window.addEventListener('devicemotion', handleMotion);
            }).catch(e => console.log(e));
        } else {
            window.addEventListener('devicemotion', handleMotion);
        }
    };

    function handleMotion(event) {
        if (activated) return;
        let total = 0;
        if (event.accelerationIncludingGravity) {
            const acc = event.accelerationIncludingGravity;
            total = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
        } 
        if (total > 20) activateOrb();
    }
}

// --- ГРА 3: ЗАМОК (Без заголовка) ---
export function startSpell(container, onComplete) {
    const subEl = document.getElementById('page-sub');
    if(subEl) subEl.textContent = "";

    // В HTML прибрано h2
    container.innerHTML = `
        <div class="game-container">
            <div class="spell-area">
                <svg class="spell-bg" viewBox="0 0 300 350">
                    <path d="M150,50 A50,50 0 1,1 150,150 A50,50 0 1,1 150,50 M150,150 L100,300 L200,300 Z" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="6" stroke-dasharray="8,8"/>
                </svg>
                <canvas id="spell-canvas" width="300" height="350"></canvas>
            </div>
            <p id="spell-msg" style="height:20px; color:#ffcc00; margin-top:10px; font-weight:bold;"></p>
        </div>
    `;
    const canvas = document.getElementById('spell-canvas'); const ctx = canvas.getContext('2d'); const msg = document.getElementById('spell-msg');
    let isDrawing = false; let points = [];
    ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#ffd700'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffaa00';
    function getPos(e) { const rect = canvas.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY; return { x: cx - rect.left, y: cy - rect.top }; }
    function start(e) { isDrawing = true; points = []; ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); points.push(p); e.preventDefault(); }
    function move(e) { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); points.push(p); e.preventDefault(); }
    function end() { if (!isDrawing) return; isDrawing = false; validateShape(); }
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, {passive: false}); canvas.addEventListener('touchmove', move, {passive: false}); canvas.addEventListener('touchend', end);
    function validateShape() { const checkpoints = [{x: 150, y: 50}, {x: 100, y: 100}, {x: 200, y: 100}, {x: 150, y: 150}, {x: 100, y: 300}, {x: 200, y: 300}]; let hits = 0; checkpoints.forEach(cp => { if(points.some(p => Math.hypot(p.x - cp.x, p.y - cp.y) < 45)) hits++; }); if (hits >= 5) { msg.textContent = "Закляття вірне!"; msg.style.color = "#44ff44"; setTimeout(() => showModal("Шлях відкрито!", onComplete), 500); } else { msg.textContent = "Спробуй ще раз!"; msg.style.color = "#ff4444"; setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); msg.textContent = ""; }, 1000); } }
}

function showModal(text, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-content">
            <h2 style="font-family: 'Lumos', serif; font-size: 32px; color: #c43b3b; margin-bottom: 20px; margin-top:0;">${text}</h2>
            <button id="modal-ok" class="btn-primary" style="font-size: 18px; padding: 12px 30px;">Продовжити</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('modal-ok').onclick = () => { document.body.removeChild(overlay); callback(); };
}