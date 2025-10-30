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
    const LEVEL_ID = 3;
    const TIME_LIMIT = 60;
    const TELEPORT_COOLDOWN = 5000;
    
    let GRID_SIZE;
    let player = null;
    let timerInterval;
    let timeLeft = TIME_LIMIT;
    
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

    // ========== MAPA DEL NIVEL 3 ==========
    const mazeMap = [
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
        "WP                                                       W",
        "W  WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW  W",
        "W  W      W   W      W   W      W   W      W   W     AW  W",
        "W  W  W   WwwwW      W   W          W      W   W W  W W  W",
        "W  W      W   W      W          W   W      W   W      W  W",
        "W  WW     W   W      W   W      W   W      W   W   W  W  W",
        "W           W        W   WWWWWWWW      W        W     W  W",
        "W  WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWW WW  W",
        "W  W      W   W      W   W      W   W      W   W   W  W  W",
        "W  W  W   W   W      WWWWW      W   W      W          W  W",
        "W  W      W   W      W   W      W   W      W   W      W  W",
        "W  W    W W   W      W   W      W   W      W   W      W  W",
        "W           W        W        W        W        W   W W  W",
        "W  WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW  W",
        "W  W      W   W      W   W      W   W      W   W      W  W",
        "W  W   WW W   W      WwwwW      WwwwW      W   W      W  W",
        "W  W      W   W   C  W   W      W   W  W   W   W      W  W",
        "W  W      W   W WW   W   W      W   W      W   W      W  W",
        "W        BWWWWW      W        W        WWW      W        W",
        "WWWWWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW  W",
        "W  W      W   W      W   W      W   W      W   W      W  W",
        "W  W  E   W   W  W   W   W      W   W   C  W   W      W  W",
        "W  W      W   W      W   W      W   W      W   W      W  W",
        "W  W   WW W   W      W   W      W   W W    W   W      W  W",
        "W    W    WWWWW W             W        W        W        W",
        "W  WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWWWWWWWWWWWWW  W",
        "W  W      W   WW     W   W      W   W      W   W      W  W",
        "W  W  W   W   W      WWWWW      W   W      W   W      W  W",
        "W  W      W   W   WW W   W      W   W  W   W   W    W W  W",
        "W  W    W W   W      W   W      W   W      W   W      W  W",
        "W                        W    W        W        W        W",
        "WWWWWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW  W",
        "W  W          W      W   W      W   W      W   W      W  W",
        "W  W  A   W   W      W   W      W   W      W   W      W  W",
        "W  W      W   W      W              W W    W   W      W  W",
        "W  W  W   W   W      W   W      W   W      W   W      W  W",
        "W           W        W   W    W        W        W        W",
        "W  WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW  W",
        "W  W      W   W      W   W      W   W      W   W      W  W",
        "W  W      W   W      W   W      W   W      W   W      W  W",
        "W  W      W   W  W   W   W      W   W  W   W   W    B W  W",
        "W  W      W   W      W   W      W   W      W   W      W  W",
        "W    W               W        W              W        W  W",
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ];

    const MAZE_ROWS = mazeMap.length;
    const MAZE_COLS = mazeMap[0].length;
    
    // Detectar teleportadores automáticamente
    function buildTeleportGroups(map) {
        const groups = { 'A': [], 'B': [], 'C': [] };
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                const cell = map[r][c];
                if (groups[cell] !== undefined) {
                    groups[cell].push({ row: r, col: c });
                }
            }
        }
        Object.keys(groups).forEach(k => { 
            if (groups[k].length < 2) delete groups[k]; 
        });
        return groups;
    }
    
    const teleportGroups = buildTeleportGroups(mazeMap);

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
                        GameBase.drawWall(ctx, x, y, GRID_SIZE, '#001a00', '#00ff00');
                        break;
                    case 'E':
                        GameBase.drawExit(ctx, x, y, GRID_SIZE, currentTime);
                        break;
                    case 'A':
                    case 'B':
                    case 'C':
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
        if (mazeMap[pos.row][pos.col] === 'E') winGame();
    }
    
    function checkTeleport() {
        GameBase.checkTeleport(player, mazeMap, teleportGroups, cooldowns, TELEPORT_COOLDOWN, cooldownDisplay, cooldownTimer, GRID_SIZE);
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
        const progress = GameBase.saveProgress(LEVEL_ID);
        const hasCompletedAll = progress.completed.includes(1) && progress.completed.includes(2) && progress.completed.includes(3);
        
        GameBase.showMessage(messageOverlay, messageTitle, messageText, messageStats,
            hasCompletedAll ? "¡JUEGO COMPLETADO! 🏆" : "¡NIVEL COMPLETADO! ✓",
            hasCompletedAll ? "¡Has conquistado todos los niveles! Eres el último turista en escapar." : "Has escapado de la cripta maldita...",
            `Tiempo: ${timeUsed}s | FPS: ${gameState.currentFps}`
        );
        retryButton.textContent = "Volver al Menú";
    }

    function loseGame() {
        gameState.gameActive = false;
        clearInterval(timerInterval);
        GameBase.showMessage(messageOverlay, messageTitle, messageText, messageStats,
            "TIEMPO AGOTADO ✗",
            "La cripta te ha consumido para siempre.",
            "Los espíritus se han apoderado de ti..."
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
        GameBase.drawLighting(ctx, player, canvas, 0.95);
        player.restoreCamera(ctx);
        
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    // ========== INICIO ==========
    function startGame() {
        const start = GameBase.findPlayerStart(mazeMap);
        calculateSizes();
        player = new Player(0, 0, GRID_SIZE);
        player.setGridPosition(start.row, start.col);
        GameBase.adjustPlayerZoom(player, canvas);
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