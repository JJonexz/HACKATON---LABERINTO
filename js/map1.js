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

    // ========== CONFIGURACIÓN DEL NIVEL ==========
    const LEVEL_ID = 1;
    const TIME_LIMIT = 60;
    const TELEPORT_COOLDOWN = 5000;
    
    let GRID_SIZE;
    let player = null;
    let timerInterval;
    let floorPattern = null;
    let timeLeft = TIME_LIMIT;
    let multiplayerManager = null;
    
    // Estado del juego
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
    let lastTeleportCell = {};
    let teleportCooldownActive = false;

    // ========== MAPA DEL NIVEL 1 ==========
    const mazeMap = [
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
        "WP     W          W  T  W           W         W",
        "W  W   WWWWW   WWWW  W  W   WWWWW   W   WWWW  W",
        "W  L   W       W     W  W   W       W   W     W",
        "W  W   W   WWWWW  W  WWWW   W   WWWWW   W  WWWW",
        "W      W   W      W    W   W   W       W    V W",
        "WW  W W   W   W  W  W  W   W   W   WWWWW  W T W",
        "W   W     W   W  W  W  W   W   W        W  W  W",
        "W  WWWWW   W   W  WWWW  W   W   W  WWW  W  WW W",
        "W  W  V    W   W      W   W   W   W  W  W  W LW",
        "W  W   WWWWWWWW   W   W   W   W   W  W  W  W WW",
        "W  L          W   W   W   W   W   W     W     W",
        "W  WWWWWWWWWWWWWWWWWW  W  W   W   WWW  WWW  W W",
        "W  W      W     W  W      W  W   W       W    W",
        "W  WW  W  W   W  W  WW  W  WWWW   W   W  W  W W",
        "W  W W  W     W  W   W  W       W  W  W  W  W W",
        "W  W W  W  W   WWWW  W  W   WWWWW  W  W  W  W W",
        "W  W W  W  W   W   W    W   W      W  W  W  W W",
        "W  W W  W  W   W  WW    W   W   WWWW  W  W  W W",
        "W  W W  W  W   W     W  W   W   W     W  W  W W",
        "W  W W  W  W   WWWW  W  W   W   W  W  W  W  W W",
        "W  W W  W  W   W        W   W   W  W  W  W  W W",
        "W  W W  W  W   W  WW  WWW   W   W  W  W  W  W W",
        "W  W   W  W   W   W  W      W   W  W     W  W W",
        "W      W      W   W     W     W      W      W W",
        "W  WWWW  WWWW  WWWW  WWW  WWWW  WWWW  WWWW  W W",
        "W  W        W      W      W      W        W   W",
        "W  W   WWWWWW   WWWW   WWWW   WWWW   WWW  W   W",
        "W  W   W        W      W      W      W     W  W",
        "W  W   W   WWWWW  WWWW  WWWW  WWWW  WWW  W W  W",
        "W      W      W      W      W      W      W   W",
        "W  WWWWW   WWWW   WWWW   WWWW   WWWW   WWWW  WW",
        "W  W         W      W      W      W           W",
        "W  W   WWWWWWW  WWWW   WWWW   WWWW   WWWW  W EW",
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ];

    const MAZE_ROWS = mazeMap.length;
    const MAZE_COLS = mazeMap[0].length;
    
    // Verificar posiciones de teleportadores
    console.log('[MAP1] Verificando teleportadores...');
    const teleportGroups = {
        'T': [],
        'V': [],
        'L': []
    };
    
    for (let r = 0; r < MAZE_ROWS; r++) {
        for (let c = 0; c < MAZE_COLS; c++) {
            const cell = mazeMap[r][c];
            if (teleportGroups[cell] !== undefined) {
                teleportGroups[cell].push({ row: r, col: c });
                console.log(`[MAP1] Encontrado ${cell} en (${r}, ${c})`);
            }
        }
    }

    console.log('[MAP1] Grupos de teleport:', teleportGroups);

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
        console.log('[MAP1] GRID_SIZE calculado:', GRID_SIZE);
        console.log('[MAP1] Canvas size:', canvas.width, 'x', canvas.height);
    }
    
    function resizeGame() {
        const oldGridSize = GRID_SIZE;
        calculateSizes();
        if (player && oldGridSize) player.updateGridSize(GRID_SIZE);
    }

    function canMoveTo(x, y, radius) {
        return GameBase.canMoveTo(x, y, radius, mazeMap, GRID_SIZE);
    }

    // Función para crear el patrón del suelo
    function createFloorPattern() {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = GRID_SIZE;
        patternCanvas.height = GRID_SIZE;
        const patternCtx = patternCanvas.getContext('2d');

        // Base de tierra con pasto
        patternCtx.fillStyle = '#d2dc8cff';
        patternCtx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

        // Tierra visible
        patternCtx.fillStyle = 'rgba(139, 115, 85, 0.4)';
        for(let i = 0; i < 6; i++) {
            patternCtx.fillRect(
                Math.random() * GRID_SIZE,
                Math.random() * GRID_SIZE,
                GRID_SIZE * 0.3,
                GRID_SIZE * 0.3
            );
        }

        return ctx.createPattern(patternCanvas, 'repeat');
    }

    // Función para dibujar arbustos
    function drawHedge(ctx, x, y, size, row, col) {
        const seed = row * 1000 + col;
        
        // Base verde oscuro
        ctx.fillStyle = '#2F4F2F';
        ctx.fillRect(x, y, size, size);
        
        // Hojas superiores más claras
        ctx.fillStyle = '#3d5a1f';
        for (let i = 0; i < 12; i++) {
            const angle = (seed + i) * 0.5;
            const offsetX = Math.cos(angle) * size * 0.3;
            const offsetY = Math.sin(angle) * size * 0.3;
            const leafSize = size * 0.2;
            
            ctx.beginPath();
            ctx.arc(
                x + size/2 + offsetX,
                y + size/2 + offsetY,
                leafSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Ramas secas
        if (seed % 3 === 0) {
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + size * 0.2, y + size * 0.8);
            ctx.lineTo(x + size * 0.4, y + size * 0.6);
            ctx.stroke();
        }
    }

    function drawMaze() {
        if (!floorPattern) {
            floorPattern = createFloorPattern();
        }

        const currentTime = Date.now();
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                const cell = mazeMap[r][c];
                const x = c * GRID_SIZE;
                const y = r * GRID_SIZE;

                if (cell === 'W') {
                    drawHedge(ctx, x, y, GRID_SIZE, r, c);
                } else if (cell === 'E') {
                    GameBase.drawExit(ctx, x, y, GRID_SIZE, currentTime);
                } else if (cell === 'T' || cell === 'V' || cell === 'L') {
                    GameBase.drawTeleporter(ctx, x, y, GRID_SIZE, cell, `${r},${c}`, cooldowns, currentTime);
                } else {
                    ctx.fillStyle = floorPattern;
                    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                }
            }
        }
    }

    function checkWinCondition(playerObj) {
        const pos = playerObj.getGridPosition();
        if (pos.row >= 0 && pos.row < MAZE_ROWS && pos.col >= 0 && pos.col < MAZE_COLS) {
            if (mazeMap[pos.row][pos.col] === 'E') winGame();
        }
    }
    
    function checkTeleport(playerObj, playerIndex) {
        const pos = playerObj.getGridPosition();
        
        if (pos.row < 0 || pos.row >= MAZE_ROWS || pos.col < 0 || pos.col >= MAZE_COLS) {
            return;
        }
        
        const cellType = mazeMap[pos.row][pos.col];
        const cellKey = `${pos.row},${pos.col}`;
        const currentTime = Date.now();

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

        if (!teleportGroups[cellType] || teleportGroups[cellType].length === 0) {
            const keyName = 'p' + (playerObj.playerNumber || (playerIndex + 1));
            lastTeleportCell[keyName] = null;
            return;
        }

        const keyName = 'p' + (playerObj.playerNumber || (playerIndex + 1));

        if (lastTeleportCell[keyName] === cellKey) {
            return;
        }

        if (cooldowns[cellKey] && cooldowns[cellKey] > currentTime) {
            return;
        }

        const group = teleportGroups[cellType];
        if (group.length < 2) {
            console.warn(`[MAP1] Grupo ${cellType} tiene menos de 2 teleporters`);
            return;
        }

        const currentTeleport = group.find(tp => tp.row === pos.row && tp.col === pos.col);
        
        if (!currentTeleport) {
            console.warn(`[MAP1] No se encontró teleporter actual en grupo ${cellType}`);
            return;
        }

        const possibleTargets = group.filter(tp => tp.row !== pos.row || tp.col !== pos.col);

        if (possibleTargets.length === 0) {
            console.warn(`[MAP1] No hay destinos disponibles para ${cellType}`);
            return;
        }

        const targetTeleport = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        
        console.log(`[MAP1] Teleportando ${cellType}: (${pos.row},${pos.col}) -> (${targetTeleport.row},${targetTeleport.col})`);
        
        group.forEach(tp => {
            const key = `${tp.row},${tp.col}`;
            cooldowns[key] = currentTime + TELEPORT_COOLDOWN;
        });
        
        teleportCooldownActive = true;
        
        if (cooldownDisplay && cooldownTimer) {
            cooldownDisplay.style.display = 'block';
            cooldownTimer.textContent = Math.ceil(TELEPORT_COOLDOWN / 1000);
        }

        playerObj.setGridPosition(targetTeleport.row, targetTeleport.col);
        lastTeleportCell[keyName] = `${targetTeleport.row},${targetTeleport.col}`;
        
        console.log(`[MAP1] Nueva posición del jugador ${keyName}: (${playerObj.x}, ${playerObj.y})`);
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
            "¡ESCAPASTE! ✓",
            "Has encontrado la salida del laberinto...",
            `Tiempo usado: ${timeUsed}s | FPS: ${gameState.currentFps}`
        );
        retryButton.textContent = "Volver al Menú";
    }

    function loseGame() {
        gameState.gameActive = false;
        clearInterval(timerInterval);
        GameBase.showMessage(messageOverlay, messageTitle, messageText, messageStats,
            "TIEMPO AGOTADO ✗",
            "El laberinto te ha consumido. No hay escapatoria.",
            "Intenta ser más rápido la próxima vez..."
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
        multiplayerManager.update(keys, canMoveTo, deltaTime);

        multiplayerManager.players.forEach((p, idx) => {
            checkWinCondition(p);
            checkTeleport(p, idx);
        });

        GameBase.clearCanvas(ctx, canvas);
        multiplayerManager.draw(ctx, canvas.width, canvas.height);
        
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    // ========== INICIO ==========
    function startGame() {
        const start = GameBase.findPlayerStart(mazeMap);
        console.log('[MAP1] Posición inicial:', start);
        
        calculateSizes();
        multiplayerManager = new MultiplayerManager(GRID_SIZE);
        multiplayerManager.drawGameWorld = function(ctx) {
            drawMaze();
        };

        const startPos = [];
        startPos.push(start);

        const adjacentPositions = [
            { row: start.row + 1, col: start.col },
            { row: start.row - 1, col: start.col },
            { row: start.row, col: start.col + 1 },
            { row: start.row, col: start.col - 1 }
        ];

        for (const pos of adjacentPositions) {
            if (pos.row >= 0 && pos.row < MAZE_ROWS && 
                pos.col >= 0 && pos.col < MAZE_COLS && 
                mazeMap[pos.row][pos.col] !== 'W') {
                startPos.push(pos);
                break;
            }
        }

        if (startPos.length === 1) {
            startPos.push(start);
        }

        multiplayerManager.setPlayersPosition(startPos);
        player = multiplayerManager.players[0];
        
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