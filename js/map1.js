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
    let timeLeft = TIME_LIMIT;
    
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
    let lastTeleportCell = null;
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
    
    // Verificar posiciones de teleportadores en el mapa
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

    function drawMaze() {
        const currentTime = Date.now();
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                const cell = mazeMap[r][c];
                const x = c * GRID_SIZE;
                const y = r * GRID_SIZE;

                switch (cell) {
                    case 'W':
                        GameBase.drawWall(ctx, x, y, GRID_SIZE, '#330000', '#ff1a1a');
                        break;
                    case 'E':
                        GameBase.drawExit(ctx, x, y, GRID_SIZE, currentTime);
                        break;
                    case 'T':
                    case 'V':
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

    function checkWinCondition() {
        const pos = player.getGridPosition();
        if (pos.row >= 0 && pos.row < MAZE_ROWS && pos.col >= 0 && pos.col < MAZE_COLS) {
            if (mazeMap[pos.row][pos.col] === 'E') winGame();
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
            console.warn(`[MAP1] Grupo ${cellType} tiene menos de 2 teleporters`);
            return;
        }

        // Encontrar teleporter actual en el grupo
        const currentTeleport = group.find(tp => tp.row === pos.row && tp.col === pos.col);
        
        if (!currentTeleport) {
            console.warn(`[MAP1] No se encontró teleporter actual en grupo ${cellType}`);
            return;
        }

        // Obtener teleporters de destino (todos menos el actual)
        const possibleTargets = group.filter(tp => tp.row !== pos.row || tp.col !== pos.col);

        if (possibleTargets.length === 0) {
            console.warn(`[MAP1] No hay destinos disponibles para ${cellType}`);
            return;
        }

        // Elegir destino aleatorio
        const targetTeleport = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        
        console.log(`[MAP1] Teleportando ${cellType}: (${pos.row},${pos.col}) -> (${targetTeleport.row},${targetTeleport.col})`);
        
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
        
        console.log(`[MAP1] Nueva posición del jugador: (${player.x}, ${player.y})`);
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
        player.update(keys, canMoveTo, deltaTime);
        checkWinCondition();
        checkTeleport();

        GameBase.clearCanvas(ctx, canvas);
        player.applyCamera(ctx, canvas.width, canvas.height);
        drawMaze();
        player.draw(ctx);
        GameBase.drawLighting(ctx, player, canvas, 0.90);
        player.restoreCamera(ctx);
        
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    // ========== INICIO ==========
    function startGame() {
        const start = GameBase.findPlayerStart(mazeMap);
        console.log('[MAP1] Posición inicial:', start);
        
        calculateSizes();
        player = new Player(0, 0, GRID_SIZE);
        player.setGridPosition(start.row, start.col);
        /*
        // Ajustar zoom para ver TODO el mapa con margen
        const availableWidth = window.innerWidth;
        const availableHeight = window.innerHeight - 70;
        const mapPixelWidth = canvas.width;
        const mapPixelHeight = canvas.height;
        
        console.log('[MAP1] Available space:', availableWidth, 'x', availableHeight);
        console.log('[MAP1] Map size:', mapPixelWidth, 'x', mapPixelHeight);
        
        if (mapPixelWidth > 0 && mapPixelHeight > 0) {
            // Calcular zoom para que quepa todo el mapa con 10% de margen
            const zoomX = (availableWidth * 0.9) / mapPixelWidth;
            const zoomY = (availableHeight * 0.9) / mapPixelHeight;
            const fitZoom = Math.min(zoomX, zoomY);
            
            // Asegurar un zoom mínimo razonable
            const minZoom = 0.5;
            const maxZoom = 3.0;
            
            player.cameraZoom = Math.max(minZoom, Math.min(maxZoom, fitZoom));
            console.log('[MAP1] Zoom ajustado a:', player.cameraZoom);
        }
        */
        
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