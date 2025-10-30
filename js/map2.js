document.addEventListener('DOMContentLoaded', () => {

    // ========== ELEMENTOS DOM ==========
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const timerElement = document.getElementById('timer');
    const fpsElement = document.getElementById('fps');
    const messageOverlay = document.getElementById('message-overlay');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const messageStats = document.getElementById('message-stats');
    const retryButton = document.getElementById('retry-button');
    const loadingOverlay = document.getElementById('loading-overlay');
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseMenu = document.getElementById('pause-menu');
    const resumeButton = document.getElementById('resume-button');
    const menuButton = document.getElementById('menu-button');
    const pauseRestartButton = document.getElementById('pause-restart-button');
    const loseRestartButton = document.getElementById('lose-restart-button');
    const cooldownDisplay = document.getElementById('teleport-cooldown');
    const cooldownTimer = document.getElementById('cooldown-timer');
    const collectibleIndicator = document.getElementById('collectible-indicator');
    const collectibleCheck = document.getElementById('collectible-check');

    // ========== CONFIGURACIÓN DEL NIVEL ==========
    const LEVEL_ID = 2;
    const TIME_LIMIT = 60;
    const TELEPORT_COOLDOWN = 5000;
    
    let GRID_SIZE;
    let player = null;
    let timerInterval;
    let timeLeft = TIME_LIMIT;
    let collectibleCollected = false;
    let collectiblePulse = 0;
    let exitIndicatorPulse = 0;
    
    const gameState = {
        gameActive: true,
        isPaused: false,
        animationId: null,
        lastTime: 0,
        frameCount: 0,
        lastFpsUpdate: 0,
        currentFps: 60
    };

    const keys = {};
    const cooldowns = {};
    let lastTeleportCell = null;
    let teleportCooldownActive = false;
    const collectiblePosition = { row: 17, col: 8 };
    const exitPosition = { row: 37, col: 51 };

    // ========== MAPA DEL NIVEL 2 ==========
    const mazeMap = [
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
        "WP                  W                               W",
        "WWWWWW  WWWWWWWWW   W   WWWWWWWWW   WWWWWWWW   WWW  W",
        "W       W       W   W   W       W   W       W   W   W",
        "W   WWWWW   W   W   W   W   W   W   W   W   W   W   W",
        "W   W   L   W   W   W   W   W   W   W   W   W   W   W",
        "W   W   WWWWW   W   W   W   W   W   W   W   W   W   W",
        "W   W   W   W   W       W   W       W   W       W   W",
        "W   W   W   W   WWWWWWWWW   WWWWWWWWW   WWWWWWWWW   W",
        "W   W   W   W           T           W           W   W",
        "W   W   W   WWWWWWWWWWWWWWWWWWWWW   W   WWWWW   W   W",
        "W   W   W   W               Y   W   W   W   W   W   W",
        "W   W   W   W   WWWWWWWWWWWWW   W   W   W   W   W   W",
        "W   W       W   W           W   W       W   W       W",
        "W   WWWWWWWWW   W   WWWWW   W   WWWWWWWWW   WWWWWWWWW",
        "W           W   W       W   W               W       W",
        "WWWWWWWWW   W   WWWWW   W   WWWWWWWWWWWWW   W   W   W",
        "W       R   W       W   W               W   W   W   W",
        "W   W   W   WWWWW   W   WWWWWWWWWWWWW   W   W   W   W",
        "W   W   W       W   W           W   L   W   W   W   W",
        "W   W   WWWWW   W   WWWWWWWW    W   WWWWW   W   W   W",
        "W   W       W   W           W   W   W       W   W   W",
        "W   WWWWW   W   WWWWWWWWW   W   W   W   WWWWW   W   W",
        "W       W   W           W   W       W   W       W   W",
        "WWWWW   W   WWWWWWWWW   W   WWWWWWWWW   W   WWWWW   W",
        "W       W           W   W           W   W       W   W",
        "W   WWWWWWWWWWWWW   W   WWWWWWWWW   W   WWWWW   W   W",
        "W               W   W           W   W       W   W   W",
        "WWWWWWWWWWWWW   W   WWWWWWWWW   W   WWWWW   W   W   W",
        "W           W   W       T   Y   W       W   W   W   W",
        "W   WWWWW   W   WWWWWWWWWWWWW   WWWWW   W   W   W   W",
        "W   W   W   W               W       W   W       W   W",
        "W   W   W   WWWWWWWWWWWWW   WWWWW   W   WWWWWWWWW   W",
        "W   W   W               W       W   W               W",
        "W   W   WWWWWWWWWWWWW   WWWWW   W   WWWWWWWWWWWWWWWWW",
        "W   W   L           W       W   W                   W",
        "W   WWWWWWWWWWWWW   WWWWW   W   WWWWWWWWWWWWWWWWW   W",
        "W               W       W       W               W  EW",
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ];

    const MAZE_ROWS = mazeMap.length;
    const MAZE_COLS = mazeMap[0].length;
    
    const teleportGroups = {
        'T': [{ row: 9, col: 24 }, { row: 29, col: 24 }],
        'X': [{ row: 13, col: 20 }, { row: 33, col: 52 }],
        'Y': [{ row: 11, col: 28 }, { row: 29, col: 28 }],
        'L': [{ row: 5, col: 8 }, { row: 19, col: 36 }, { row: 35, col: 8 }]
    };

    // ========== INPUTS ==========
    window.addEventListener('keydown', (e) => {
        if (!gameState.gameActive) return;
        if (e.key === 'Escape') {
            gameState.isPaused ? resumeGame() : pauseGame();
            return;
        }
        if (gameState.isPaused) return;
        keys[e.key] = true;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => { keys[e.key] = false; });

    // ========== FUNCIONES ==========
    function calculateSizes() {
        GRID_SIZE = GameBase.calculateSizes(canvas, MAZE_ROWS, MAZE_COLS);
    }
    
    function resizeGame() {
        const oldGridSize = GRID_SIZE;
        calculateSizes();
        if (player && oldGridSize) player.updateGridSize(GRID_SIZE);
    }

    function canMoveTo(x, y, radius) {
        return GameBase.canMoveTo(x, y, radius, mazeMap, GRID_SIZE);
    }

    function drawMaze() {
        const currentTime = Date.now();
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                const cell = mazeMap[r][c];
                const x = c * GRID_SIZE;
                const y = r * GRID_SIZE;

                switch (cell) {
                    case 'W':
                        GameBase.drawWall(ctx, x, y, GRID_SIZE, '#1a0033', '#6600cc');
                        break;
                    case 'E':
                        GameBase.drawExit(ctx, x, y, GRID_SIZE, currentTime);
                        break;
                    case 'T':
                    case 'X':
                    case 'Y':
                    case 'L':
                        GameBase.drawTeleporter(ctx, x, y, GRID_SIZE, cell, `${r},${c}`, cooldowns, currentTime);
                        break;
                    default:
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        break;
                }
            }
        }
    }

    function drawCollectible() {
        if (collectibleCollected) return;
        const x = collectiblePosition.col * GRID_SIZE;
        const y = collectiblePosition.row * GRID_SIZE;
        collectiblePulse += 0.05;
        const pulse = Math.sin(collectiblePulse) * 0.3 + 0.7;
        const glow = Math.sin(collectiblePulse * 2) * 10 + 15;
        
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = glow;
        ctx.shadowColor = '#FFD700';
        ctx.font = `${GRID_SIZE * 0.7}px Arial`;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎡', x + GRID_SIZE / 2, y + GRID_SIZE / 2);
        ctx.shadowBlur = 0;
    }

    function drawExitIndicator() {
        if (!collectibleCollected) return;
        exitIndicatorPulse += 0.08;
        const pulse = Math.sin(exitIndicatorPulse) * 0.4 + 0.6;
        const exitX = (exitPosition.col + 0.5) * GRID_SIZE;
        const exitY = (exitPosition.row + 0.5) * GRID_SIZE;
        const dx = exitX - player.x;
        const dy = exitY - player.y;
        const angle = Math.atan2(dy, dx);
        const distance = 80;
        const indicatorX = player.x + Math.cos(angle) * distance;
        const indicatorY = player.y + Math.sin(angle) * distance;
        
        const gradient = ctx.createRadialGradient(indicatorX, indicatorY, 0, indicatorX, indicatorY, 30 * pulse);
        gradient.addColorStop(0, `rgba(138, 43, 226, ${pulse})`);
        gradient.addColorStop(0.5, `rgba(138, 43, 226, ${pulse * 0.5})`);
        gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 30 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(186, 85, 211, ${pulse})`;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(238, 130, 238, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#8A2BE2';
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.save();
        ctx.translate(indicatorX, indicatorY);
        ctx.rotate(angle);
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -6);
        ctx.lineTo(-4, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function checkCollectible() {
        if (collectibleCollected) return;
        const pos = player.getGridPosition();
        if (pos.row === collectiblePosition.row && pos.col === collectiblePosition.col) {
            collectibleCollected = true;
            collectibleIndicator.classList.remove('collectible-uncollected');
            collectibleIndicator.classList.add('collectible-collected');
            collectibleCheck.textContent = '✓';
            localStorage.setItem('map2_collectible', 'true');
        }
    }

    function showTemporaryMessage(text) {
        let tempMsg = document.getElementById('temp-message');
        if (!tempMsg) {
            tempMsg = document.createElement('div');
            tempMsg.id = 'temp-message';
            tempMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,0,0,0.9);color:#fff;padding:20px 40px;border-radius:10px;font-size:1.5em;z-index:1000;border:3px solid #ff0000;box-shadow:0 0 30px rgba(255,0,0,0.8);font-family:Courier New,monospace;text-align:center';
            document.body.appendChild(tempMsg);
        }
        tempMsg.textContent = text;
        tempMsg.style.display = 'block';
        setTimeout(() => tempMsg.style.display = 'none', 2000);
    }

    function checkWinCondition() {
        const pos = player.getGridPosition();
        if (mazeMap[pos.row][pos.col] === 'E') {
            if (collectibleCollected) {
                winGame();
            } else {
                showTemporaryMessage("¡Necesitas el coleccionable 🎡 para salir!");
            }
        }
    }
    
    function checkTeleport() {
        const pos = player.getGridPosition();
        
        // Validar posición
        if (pos.row < 0 || pos.row >= MAZE_ROWS || pos.col < 0 || pos.col >= MAZE_COLS) {
            return;
        }
        
        const cellType = mazeMap[pos.row][pos.col];
        const cellKey = `${pos.row},${pos.col}`;
        const currentTime = Date.now();

        // Actualizar display de cooldown
        if (teleportCooldownActive) {
            let stillCoolingDown = false;
            let minRemaining = Infinity;
            
            for (const key in cooldowns) {
                if (cooldowns[key] > currentTime) {
                    stillCoolingDown = true;
                    const remaining = cooldowns[key] - currentTime;
                    if (remaining < minRemaining) {
                        minRemaining = remaining;
                    }
                }
            }
            
            if (stillCoolingDown && cooldownDisplay && cooldownTimer) {
                const remainingSeconds = Math.ceil(minRemaining / 1000);
                cooldownTimer.textContent = remainingSeconds;
                cooldownDisplay.style.display = 'block';
            } else {
                if (cooldownDisplay) cooldownDisplay.style.display = 'none';
                teleportCooldownActive = false;
            }
        }

        // Si no estamos en un teleporter, limpiar el registro
        if (!teleportGroups[cellType] || teleportGroups[cellType].length === 0) {
            lastTeleportCell = null;
            return;
        }

        // Si ya estamos sobre este teleporter, no hacer nada (evita loop)
        if (lastTeleportCell === cellKey) {
            return;
        }

        // Verificar si hay cooldown activo para este teleporter
        if (cooldowns[cellKey] && cooldowns[cellKey] > currentTime) {
            return;
        }

        const group = teleportGroups[cellType];
        if (group.length < 2) {
            console.warn(`[MAP2] Grupo ${cellType} tiene menos de 2 teleporters`);
            return;
        }

        // Encontrar teleporter actual en el grupo
        const currentTeleport = group.find(tp => tp.row === pos.row && tp.col === pos.col);
        
        if (!currentTeleport) {
            console.warn(`[MAP2] No se encontró teleporter actual en grupo ${cellType}`);
            return;
        }

        // Obtener teleporters de destino (todos menos el actual)
        const possibleTargets = group.filter(tp => tp.row !== pos.row || tp.col !== pos.col);

        if (possibleTargets.length === 0) {
            console.warn(`[MAP2] No hay destinos disponibles para ${cellType}`);
            return;
        }

        // Elegir destino aleatorio
        const targetTeleport = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        
        console.log(`[MAP2] Teleportando ${cellType}: (${pos.row},${pos.col}) -> (${targetTeleport.row},${targetTeleport.col})`);
        
        // Aplicar cooldown a TODO el grupo
        group.forEach(tp => {
            const key = `${tp.row},${tp.col}`;
            cooldowns[key] = currentTime + TELEPORT_COOLDOWN;
        });
        
        teleportCooldownActive = true;
        
        // Mostrar cooldown
        if (cooldownDisplay && cooldownTimer) {
            cooldownDisplay.style.display = 'block';
            cooldownTimer.textContent = Math.ceil(TELEPORT_COOLDOWN / 1000);
        }

        // Teletransportar al centro de la celda destino
        player.setGridPosition(targetTeleport.row, targetTeleport.col);
        
        // Marcar este teleporter como el último usado
        lastTeleportCell = `${targetTeleport.row},${targetTeleport.col}`;
        
        console.log(`[MAP2] Nueva posición del jugador: (${player.x}, ${player.y})`);
    }

    function pauseGame() {
        GameBase.pauseGame(gameState, canvas, pauseOverlay, pauseMenu);
    }

    function resumeGame() {
        GameBase.resumeGame(gameState, canvas, pauseOverlay, pauseMenu, gameLoop);
    }

    function winGame() {
        gameState.gameActive = false;
        clearInterval(timerInterval);
        const timeUsed = TIME_LIMIT - timeLeft;
        GameBase.saveProgress(LEVEL_ID);
        GameBase.showMessage(messageOverlay, messageTitle, messageText, messageStats,
            "¡NIVEL COMPLETADO! ✓",
            "Has escapado de los túneles...",
            `Tiempo: ${timeUsed}s | FPS: ${gameState.currentFps}`
        );
        retryButton.textContent = "Volver al Menú";
    }

    function loseGame() {
        gameState.gameActive = false;
        clearInterval(timerInterval);
        GameBase.showMessage(messageOverlay, messageTitle, messageText, messageStats,
            "TIEMPO AGOTADO ✗",
            "Los túneles te han atrapado.",
            "Intenta ser más rápido..."
        );
        retryButton.textContent = "Volver al Menú";
    }

    // ========== EVENT LISTENERS ==========
    retryButton.addEventListener('click', () => window.location.href = 'main.html');
    if (pauseRestartButton) pauseRestartButton.addEventListener('click', () => window.location.reload());
    if (loseRestartButton) loseRestartButton.addEventListener('click', () => window.location.reload());
    if (resumeButton) resumeButton.addEventListener('click', resumeGame);
    if (menuButton) menuButton.addEventListener('click', () => window.location.href = 'main.html');

    // ========== BUCLE PRINCIPAL ==========
    function gameLoop(timestamp) {
        if (!gameState.gameActive) return;
        if (gameState.isPaused) {
            gameState.animationId = requestAnimationFrame(gameLoop);
            return;
        }
        
        if (gameState.lastTime === 0) gameState.lastTime = timestamp;
        const deltaTime = timestamp - gameState.lastTime;
        gameState.lastTime = timestamp;

        GameBase.updateFPS(gameState, timestamp, fpsElement);
        player.update(keys, canMoveTo, deltaTime);
        checkWinCondition();
        checkCollectible();
        checkTeleport();

        GameBase.clearCanvas(ctx, canvas);
        player.applyCamera(ctx, canvas.width, canvas.height);
        drawMaze();
        drawCollectible();
        player.draw(ctx);
        drawExitIndicator();
        GameBase.drawLighting(ctx, player, canvas, 0.92);
        player.restoreCamera(ctx);

        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    // ========== INICIO ==========
    function startGame() {
        const start = GameBase.findPlayerStart(mazeMap);
        calculateSizes();
        player = new Player(0, 0, GRID_SIZE);
        player.setGridPosition(start.row, start.col);
        window.addEventListener('resize', resizeGame);
        
        setTimeout(() => loadingOverlay.classList.add('hidden'), 1000);
        
        timerInterval = setInterval(() => {
            if (!gameState.gameActive || gameState.isPaused) return;
            timeLeft--;
            timerElement.textContent = timeLeft;
            if (timeLeft <= 0) loseGame();
        }, 1000);
        
        gameState.lastTime = 0;
        gameState.lastFpsUpdate = performance.now();
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    startGame();
});