document.addEventListener('DOMContentLoaded', () => {

    // ========== CONFIGURACIÓN INICIAL ==========
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
    
    // Elementos de pausa
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseMenu = document.getElementById('pause-menu');
    const resumeButton = document.getElementById('resume-button');
    const menuButton = document.getElementById('menu-button');
    const pauseRestartButton = document.getElementById('pause-restart-button');
    const loseRestartButton = document.getElementById('lose-restart-button');
    
    // Configuración de la cuadrícula
    let GRID_SIZE; 

    let gameActive = true;
    let isPaused = false;
    let timerInterval;
    let timeLeft = 60;
    let animationId;
    
    // Delta time
    let lastTime = 0;
    
    // FPS counter
    let frameCount = 0;
    let lastFpsUpdate = 0;
    let currentFps = 60;
    
    let player = null;
    let playerStartRow = 0;
    let playerStartCol = 0;
    
    // Cooldown de teletransportes
    const teleportCooldown = 2000;
    const cooldowns = {};

    // ========== MAPA OPTIMIZADO 35x50 CON CARRILES AMPLIOS ==========
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
    
    // Coordenadas de teletransportadores ajustadas
    const teleportGroups = {
        'T': [
            { row: 1, col: 17 },
            { row: 6, col: 47 }
        ],
        'V': [
            { row: 5, col: 47 }, 
            { row: 9, col: 7 } 
        ],
        'L': [
            { row: 3, col: 4 },
            { row: 9, col: 49 },
            { row: 11, col: 4 }
        ]
    };

    // Gestión de inputs
    const keys = {};

    window.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        
        if (e.key === 'Escape') {
            if (isPaused) {
                resumeGame();
            } else {
                pauseGame();
            }
            return;
        }
        
        if (isPaused) return;
        
        keys[e.key] = true;
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // ========== FUNCIONES DE REDIMENSIONAMIENTO PARA PANTALLA COMPLETA ==========
    function calculateSizes() {
        const availableHeight = window.innerHeight - 70;
        const availableWidth = window.innerWidth;
        
        const maxGridWidth = availableWidth / MAZE_COLS;
        const maxGridHeight = availableHeight / MAZE_ROWS;
        
        GRID_SIZE = Math.floor(Math.min(maxGridWidth, maxGridHeight));
        
        canvas.width = MAZE_COLS * GRID_SIZE;
        canvas.height = MAZE_ROWS * GRID_SIZE;
    }
    
    function resizeGame() {
        const oldGridSize = GRID_SIZE; 
        calculateSizes(); 
        
        if (player && oldGridSize) {
            player.updateGridSize(GRID_SIZE);
        }
    }

    // ========== INICIALIZACIÓN ==========
    function initializeGame() {
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                if (mazeMap[r][c] === 'P') {
                    playerStartCol = c;
                    playerStartRow = r;
                    return;
                }
            }
        }
    }
    
    // ========== FUNCIONES DE COLISIÓN ==========
    function isWall(x, y) {
        const c = Math.floor(x / GRID_SIZE);
        const r = Math.floor(y / GRID_SIZE);

        if (r < 0 || r >= MAZE_ROWS || c < 0 || c >= MAZE_COLS) {
            return true;
        }
        return mazeMap[r][c] === 'W';
    }

    function canMoveTo(x, y, radius) {
        const checkPoints = [
            [x + radius, y],
            [x - radius, y],
            [x, y + radius],
            [x, y - radius],
            [x, y]
        ];

        for (const [px, py] of checkPoints) {
            if (isWall(px, py)) {
                return false;
            }
        }
        return true;
    }

    // ========== FUNCIONES DE DIBUJO OPTIMIZADAS ==========
    function clearCanvas() {
        ctx.fillStyle = '#000000'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
                        ctx.fillStyle = '#330000';
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        ctx.strokeStyle = '#ff1a1a';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
                        break;
                        
                    case 'E':
                        const exitPulse = Math.sin(currentTime * 0.003) * 0.3 + 0.7;
                        ctx.fillStyle = `rgba(0, 255, 0, ${exitPulse})`;
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        
                        ctx.font = `bold ${GRID_SIZE * 0.7}px Arial`;
                        ctx.fillStyle = '#000000';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('E', x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                        
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = '#00FF00';
                        ctx.strokeStyle = '#00FF00';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
                        ctx.shadowBlur = 0;
                        break;
                        
                    case 'T':
                    case 'V':
                    case 'L':
                        let fillColor, strokeColor, icon;
                        switch(cell) {
                            case 'T':
                                fillColor = 'rgba(0, 100, 255, 0.6)';
                                strokeColor = '#00FFFF';
                                icon = 'T';
                                break;
                            case 'V':
                                fillColor = 'rgba(0, 255, 100, 0.6)';
                                strokeColor = '#00FF00';
                                icon = 'V';
                                break;
                            case 'L':
                                fillColor = 'rgba(200, 0, 255, 0.6)';
                                strokeColor = '#FF00FF';
                                icon = 'L';
                                break;
                        }
                        
                        const cooldownKey = `${r},${c}`;
                        let isCoolingDown = cooldowns[cooldownKey] && cooldowns[cooldownKey] > currentTime;
                        
                        if (isCoolingDown) {
                            ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'; 
                            ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        } else {
                            ctx.fillStyle = fillColor;
                            ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                            
                            const pulse = Math.sin(currentTime * 0.005) * 0.5 + 0.5;
                            ctx.shadowBlur = 15 * pulse;
                            ctx.shadowColor = strokeColor;
                        }

                        ctx.strokeStyle = strokeColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 3.5, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                        
                        ctx.font = `bold ${GRID_SIZE * 0.55}px Arial`;
                        ctx.fillStyle = isCoolingDown ? '#888888' : strokeColor;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(icon, x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                        break;
                        
                    case 'P':
                    case ' ':
                        ctx.fillStyle = '#000000'; 
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        break;
                }
            }
        }
    }

    // ========== SISTEMA DE LUZ OPTIMIZADO ==========
    function drawLighting() {
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = canvas.width;
        lightCanvas.height = canvas.height;
        const lightCtx = lightCanvas.getContext('2d');
        
        lightCtx.fillStyle = 'rgba(0, 0, 0, 1)';
        lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
        
        lightCtx.globalCompositeOperation = 'destination-out';
        
        const adjustedLightRadius = player.lightRadius * 1.3;
        
        const gradient = lightCtx.createRadialGradient(
            player.x, player.y, 0,
            player.x, player.y, adjustedLightRadius
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.95)');
        gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.7)');
        gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        lightCtx.fillStyle = gradient;
        lightCtx.beginPath();
        lightCtx.arc(player.x, player.y, adjustedLightRadius, 0, Math.PI * 2);
        lightCtx.fill();
        
        ctx.globalAlpha = 0.90;
        ctx.drawImage(lightCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
    }
    
    // ========== LÓGICA DE JUEGO ==========
    function checkWinCondition() {
        const pos = player.getGridPosition();
        if (mazeMap[pos.row][pos.col] === 'E') {
            winGame();
        }
    }
    
    function checkTeleport() {
        const pos = player.getGridPosition();
        const cellType = mazeMap[pos.row][pos.col];
        const cooldownKey = `${pos.row},${pos.col}`;

        if (!teleportGroups[cellType]) return;

        const currentTime = Date.now();
        
        if (cooldowns[cooldownKey] && cooldowns[cooldownKey] > currentTime) {
            return;
        }

        const group = teleportGroups[cellType];
        if (group.length < 2) return;

        const currentTeleport = group.find(tp => tp.row === pos.row && tp.col === pos.col);
        
        if (currentTeleport) {
            const possibleTargets = group.filter(tp => tp.row !== pos.row || tp.col !== pos.col);

            if (possibleTargets.length > 0) {
                const targetTeleport = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                const targetCooldownKey = `${targetTeleport.row},${targetTeleport.col}`;

                cooldowns[cooldownKey] = currentTime + teleportCooldown;
                cooldowns[targetCooldownKey] = currentTime + teleportCooldown;

                player.setGridPosition(targetTeleport.row, targetTeleport.col);
                player.dx = 0;
                player.dy = 0;
            }
        }
    }

    // ========== FUNCIONES DE PAUSA ==========
    function pauseGame() {
        if (isPaused || !gameActive) return;
        isPaused = true;

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        pauseOverlay.classList.remove('hidden');
        pauseMenu.classList.remove('hidden');
        canvas.classList.add('paused');
    }

    function resumeGame() {
        if (!isPaused) return;
        isPaused = false;

        pauseOverlay.classList.add('hidden');
        pauseMenu.classList.add('hidden');
        canvas.classList.remove('paused');

        lastTime = 0;
        
        if (!animationId) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    // ========== MENSAJES ==========
    retryButton.addEventListener('click', () => {
        window.location.href = 'main.html';
    });

    const restartAction = () => {
        window.location.reload();
    };

    if (pauseRestartButton) {
        pauseRestartButton.addEventListener('click', restartAction);
    }
    if (loseRestartButton) {
        loseRestartButton.addEventListener('click', restartAction);
    }

    menuButton.addEventListener('click', () => {
        window.location.href = 'main.html';
    });

    resumeButton.addEventListener('click', () => {
        resumeGame();
    });

    function showMessage(title, text, stats = '') {
        messageTitle.textContent = title;
        messageText.textContent = text;
        messageStats.textContent = stats;
        messageOverlay.classList.remove('hidden');
    }

    function winGame() {
        gameActive = false;
        clearInterval(timerInterval);
        const timeUsed = 60 - timeLeft;
        
        // Guardar progreso - NIVEL 1
        let progress = JSON.parse(localStorage.getItem('gameProgress') || '{"completed":[]}');
        if (!Array.isArray(progress.completed)) {
            progress.completed = [];
        }
        
        if (!progress.completed.includes(1)) {
            progress.completed.push(1);
            progress.completed.sort((a, b) => a - b);
            localStorage.setItem('gameProgress', JSON.stringify(progress));
        }
        
        showMessage(
            "¡ESCAPASTE! ✓", 
            "Has encontrado la salida del laberinto...",
            `Tiempo usado: ${timeUsed} segundos | FPS promedio: ${currentFps}`
        );
        
        retryButton.textContent = "Volver al Menú";
    }

    function loseGame() {
        gameActive = false;
        clearInterval(timerInterval);
        showMessage(
            "TIEMPO AGOTADO ✗", 
            "El laberinto te ha consumido. No hay escapatoria.",
            "Intenta ser más rápido la próxima vez..."
        );
        
        retryButton.textContent = "Volver al Menú";
    }

    // ========== BUCLE PRINCIPAL ==========
    function gameLoop(timestamp) {
        if (!gameActive) return;
        
        if (isPaused) {
            animationId = requestAnimationFrame(gameLoop);
            return;
        }
        
        if (lastTime === 0) {
            lastTime = timestamp;
        }
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        frameCount++;
        if (timestamp - lastFpsUpdate > 1000) {
            currentFps = Math.round(frameCount * 1000 / (timestamp - lastFpsUpdate));
            fpsElement.textContent = currentFps;
            frameCount = 0;
            lastFpsUpdate = timestamp;
        }

        player.update(keys, canMoveTo, deltaTime);
        
        checkWinCondition();
        checkTeleport();

        clearCanvas();
        drawMaze();
        player.draw(ctx);
        drawLighting();
        
        animationId = requestAnimationFrame(gameLoop);
    }

    // ========== INICIO DEL JUEGO ==========
    function startGame() {
        initializeGame();
        calculateSizes();
        
        player = new Player(0, 0, GRID_SIZE);
        player.setGridPosition(playerStartRow, playerStartCol);
        
        window.addEventListener('resize', resizeGame);
        
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 1000);
        
        timerInterval = setInterval(() => {
            if (!gameActive || isPaused) {
                return;
            }
            timeLeft--;
            timerElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                loseGame();
            }
        }, 1000);
        
        lastTime = 0;
        lastFpsUpdate = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }

    startGame();

});