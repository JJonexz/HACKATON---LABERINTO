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

    // ========== MAPA DEL NIVEL 1 ==========
    const mazeMap = [
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
        "WP      W          W  T  W           W         W",
        "W   W   WWWWW   WWWW  W  W   WWWWW   W   WWWW  W",
        "W   L   W       W     W  W   W       W   W     W",
        "W   W   W   WWWWW  W  WWWW   W   WWWWW   W  WWWW",
        "W       W   W      W     W   W   W       W    V W",
        "WWW  W  W   W   W  W  W  W   W   W   WWWWW  W T W",
        "W    W      W   W  W  W  W   W   W        W  W  W",
        "W   WWWWW   W   W  WWWW  W   W   W   WWW  W  WW W",
        "W   W  V    W   W       W   W   W   W  W  W  W  L",
        "W   W   WWWWWWWWW   W   W   W   W   W  W  W  W WW",
        "W   L   W       W   W   W   W   W   W     W     W",
        "W   WWWWWWWWWWWWWWWWWWW  W  W   W   WWW  WWW  W W",
        "W   W       W      W  W      W  W   W       W    W",
        "W   WWW  W  W   W  W  WW  W  WWWW   W   W  W  W W",
        "W   W W  W  W   W  W   W  W       W  W  W  W  W W",
        "W   W W  W  W   WWWWW  W  W   WWWWW  W  W  W  W W",
        "W   W W  W  W   W   W  W  W   W      W  W  W  W W",
        "W   W W  W  W   W  WW  W  W   W   WWWW  W  W  W W",
        "W   W W  W  W   W   W  W  W   W   W     W  W  W W",
        "W   W W  W  W   WWWWW  W  W   W   W  W  W  W  W W",
        "W   W W  W  W   W   W     W   W   W  W  W  W  W W",
        "W   W W  W  W   W  WW  WWWW   W   W  W  W  W  W W",
        "W   W W  W  W   W   W  W      W   W  W     W  W W",
        "W   W    W      W   W     W      W      W      W W",
        "W   WWWW  WWWW  WWWW  WWWW  WWWW  WWWW  WWWW  W W",
        "W   W        W      W      W      W        W   W W",
        "W   W   WWWWWW   WWWW   WWWW   WWWW   WWW  W  W W",
        "W   W   W        W      W      W      W     W  W W",
        "W   W   W   WWWWW  WWWW  WWWW  WWWW  WWW  W W  W W",
        "W       W      W      W      W      W      W    W W",
        "W   WWWWW   WWWW   WWWW   WWWW   WWWW   WWWW  WW W",
        "W   W         W      W      W      W             W",
        "W   W   WWWWWWW  WWWW   WWWW   WWWW   WWWW  WW E W",
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ];

    const MAZE_ROWS = mazeMap.length;
    const MAZE_COLS = mazeMap[0].length;
    
    const teleportGroups = {
        'T': [{ row: 1, col: 17 }, { row: 6, col: 47 }],
        'V': [{ row: 5, col: 47 }, { row: 9, col: 7 }],
        'L': [{ row: 3, col: 4 }, { row: 9, col: 48 }, { row: 11, col: 4 }]
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