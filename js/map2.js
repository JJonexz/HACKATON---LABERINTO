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
    
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseMenu = document.getElementById('pause-menu');
    const resumeButton = document.getElementById('resume-button');
    const menuButton = document.getElementById('menu-button');
    const pauseRestartButton = document.getElementById('pause-restart-button');
    const loseRestartButton = document.getElementById('lose-restart-button');
    
    let GRID_SIZE; 

    let gameActive = true;
    let isPaused = false;
    let timerInterval;
    let timeLeft = 60; // Tiempo correcto para nivel 2
    let animationId;
    
    let lastTime = 0;
    
    let frameCount = 0;
    let lastFpsUpdate = 0;
    let currentFps = 60;
    
    let player = null;
    let playerStartRow = 0;
    let playerStartCol = 0;
    
    const teleportCooldown = 5000; // 5 segundos
    const cooldowns = {};
    let activeCooldown = false;
    const cooldownDisplay = document.getElementById('teleport-cooldown');
    const cooldownTimer = document.getElementById('cooldown-timer');

    // Coleccionable de rueda
    const collectibleIndicator = document.getElementById('collectible-indicator');
    const collectibleCheck = document.getElementById('collectible-check');
    let collectibleCollected = false;
    const collectiblePosition = { row: 17, col: 8 }; // Posición oculta en el mapa (pasillo estrecho)
    let collectiblePulse = 0;
    
    // Posición de la salida (E)
    const exitPosition = { row: 37, col: 52 };
    let exitIndicatorPulse = 0;

    // ========== MAPA NIVEL 2: TÚNELES ESTRECHOS (40x55) ==========
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
        "W   W   W   W                   W   W   W   W   W   W",
        "W   W   W   W   WWWWWWWWWWWWW   W   W   W   W   W   W",
        "W   W       W   W   X       W   W       W   W       W",
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
        "W   W   L           W       W   W               X   W",
        "W   WWWWWWWWWWWWW   WWWWW   W   WWWWWWWWWWWWWWWWW   W",
        "W               W       W       W               W  YE",
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ];

    const MAZE_ROWS = mazeMap.length;
    const MAZE_COLS = mazeMap[0].length;
    
    // Teletransportadores para nivel 2
    const teleportGroups = {
        'T': [
            { row: 9, col: 24 },
            { row: 29, col: 24 }
        ],
        'X': [
            { row: 13, col: 20 },
            { row: 35, col: 50 }
        ],
        'Y': [
            { row: 29, col: 28 },
            { row: 37, col: 51 }
        ],
        'L': [
            { row: 5, col: 8 },
            { row: 19, col: 36 },
            { row: 35, col: 8 }
        ]
    };

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

    // ========== FUNCIONES DE REDIMENSIONAMIENTO ==========
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
                        ctx.fillStyle = '#1a0033';
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        ctx.strokeStyle = '#6600cc';
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
                    case 'X':
                    case 'Y':
                        let fillColor, strokeColor, icon;
                        switch(cell) {
                            case 'T':
                                fillColor = 'rgba(255, 100, 0, 0.6)';
                                strokeColor = '#FF6600';
                                icon = 'T';
                                break;
                            case 'X':
                                fillColor = 'rgba(255, 0, 255, 0.6)';
                                strokeColor = '#FF00FF';
                                icon = 'X';
                                break;
                            case 'Y':
                                fillColor = 'rgba(255, 255, 0, 0.6)';
                                strokeColor = '#FFFF00';
                                icon = 'Y';
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
                        
                    case 'R':
                    case 'P':
                    case ' ':
                        ctx.fillStyle = '#000000'; 
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        break;
                }
            }
        }
    }

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
        
        ctx.globalAlpha = 0.92;
        ctx.drawImage(lightCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
    }
    
    function checkWinCondition() {
        const pos = player.getGridPosition();
        if (mazeMap[pos.row][pos.col] === 'E') {
            // Solo ganar si tiene el coleccionable
            if (collectibleCollected) {
                winGame();
            } else {
                // Mostrar mensaje temporal de que necesita el coleccionable
                showTemporaryMessage("¡Necesitas el coleccionable 🎡 para salir!");
            }
        }
    }
    
    function showTemporaryMessage(text) {
        // Crear elemento de mensaje temporal
        let tempMsg = document.getElementById('temp-message');
        if (!tempMsg) {
            tempMsg = document.createElement('div');
            tempMsg.id = 'temp-message';
            tempMsg.style.position = 'fixed';
            tempMsg.style.top = '50%';
            tempMsg.style.left = '50%';
            tempMsg.style.transform = 'translate(-50%, -50%)';
            tempMsg.style.background = 'rgba(255, 0, 0, 0.9)';
            tempMsg.style.color = '#fff';
            tempMsg.style.padding = '20px 40px';
            tempMsg.style.borderRadius = '10px';
            tempMsg.style.fontSize = '1.5em';
            tempMsg.style.zIndex = '1000';
            tempMsg.style.border = '3px solid #ff0000';
            tempMsg.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.8)';
            tempMsg.style.fontFamily = 'Courier New, monospace';
            tempMsg.style.textAlign = 'center';
            document.body.appendChild(tempMsg);
        }
        
        tempMsg.textContent = text;
        tempMsg.style.display = 'block';
        
        // Ocultar después de 2 segundos
        setTimeout(() => {
            tempMsg.style.display = 'none';
        }, 2000);
    }
    
    function drawCollectible() {
        if (collectibleCollected) return;
        
        const x = collectiblePosition.col * GRID_SIZE;
        const y = collectiblePosition.row * GRID_SIZE;
        
        collectiblePulse += 0.05;
        const pulse = Math.sin(collectiblePulse) * 0.3 + 0.7;
        const glow = Math.sin(collectiblePulse * 2) * 10 + 15;
        
        // Fondo brillante
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Efecto de brillo
        ctx.shadowBlur = glow;
        ctx.shadowColor = '#FFD700';
        
        // Dibujar rueda (emoji)
        ctx.font = `${GRID_SIZE * 0.7}px Arial`;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎡', x + GRID_SIZE / 2, y + GRID_SIZE / 2);
        
        ctx.shadowBlur = 0;
    }
    
    function checkCollectible() {
        if (collectibleCollected) return;
        
        const pos = player.getGridPosition();
        if (pos.row === collectiblePosition.row && pos.col === collectiblePosition.col) {
            collectibleCollected = true;
            collectibleIndicator.classList.remove('collectible-uncollected');
            collectibleIndicator.classList.add('collectible-collected');
            collectibleCheck.textContent = '✓';
            
            // Guardar en localStorage
            localStorage.setItem('map2_collectible', 'true');
        }
    }
    
    function drawExitIndicator() {
        if (!collectibleCollected) return;
        
        exitIndicatorPulse += 0.08;
        const pulse = Math.sin(exitIndicatorPulse) * 0.4 + 0.6;
        
        // Calcular dirección hacia la salida
        const exitX = (exitPosition.col + 0.5) * GRID_SIZE;
        const exitY = (exitPosition.row + 0.5) * GRID_SIZE;
        
        const dx = exitX - player.x;
        const dy = exitY - player.y;
        const angle = Math.atan2(dy, dx);
        
        // Dibujar luz violeta direccional cerca del jugador
        const distance = 80; // Distancia del indicador respecto al jugador
        const indicatorX = player.x + Math.cos(angle) * distance;
        const indicatorY = player.y + Math.sin(angle) * distance;
        
        // Efecto de brillo
        const gradient = ctx.createRadialGradient(
            indicatorX, indicatorY, 0,
            indicatorX, indicatorY, 30 * pulse
        );
        gradient.addColorStop(0, `rgba(138, 43, 226, ${pulse})`);
        gradient.addColorStop(0.5, `rgba(138, 43, 226, ${pulse * 0.5})`);
        gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 30 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar círculo central
        ctx.fillStyle = `rgba(186, 85, 211, ${pulse})`;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar borde brillante
        ctx.strokeStyle = `rgba(238, 130, 238, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#8A2BE2';
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Dibujar flecha apuntando hacia la salida
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
    
    function checkTeleport() {
        const pos = player.getGridPosition();
        const cellType = mazeMap[pos.row][pos.col];
        const cooldownKey = `${pos.row},${pos.col}`;

        // Si no es un tipo de teletransportador válido, salimos
        if (!teleportGroups[cellType]) {
            if (cooldownDisplay.style.display === 'block') {
                const currentTime = Date.now();
                const remainingCooldown = Math.ceil((cooldowns[Object.keys(cooldowns)[0]] - currentTime) / 1000);
                if (remainingCooldown <= 0) {
                    cooldownDisplay.style.display = 'none';
                    activeCooldown = false;
                } else {
                    cooldownTimer.textContent = remainingCooldown;
                }
            }
            return;
        }

        const currentTime = Date.now();
        
        // Verificamos el cooldown solo del teleportador actual
        if (cooldowns[cooldownKey] && cooldowns[cooldownKey] > currentTime) {
            const remainingCooldown = Math.ceil((cooldowns[cooldownKey] - currentTime) / 1000);
            cooldownTimer.textContent = remainingCooldown;
            cooldownDisplay.style.display = 'block';
            return;
        }

        const group = teleportGroups[cellType];
        if (group.length < 2) return;

        // Encontramos el teleportador actual
        const currentTeleport = group.find(tp => tp.row === pos.row && tp.col === pos.col);
        
        if (currentTeleport) {
            // Filtramos los posibles destinos (excluyendo el actual)
            const possibleTargets = group.filter(tp => tp.row !== pos.row || tp.col !== pos.col);

            if (possibleTargets.length > 0) {
                // Seleccionamos un destino aleatorio
                const targetTeleport = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                
                // Aplicamos cooldown a TODOS los teleportadores del grupo
                group.forEach(tp => {
                    const key = `${tp.row},${tp.col}`;
                    cooldowns[key] = currentTime + teleportCooldown;
                });
                activeCooldown = true;
                cooldownDisplay.style.display = 'block';
                cooldownTimer.textContent = Math.ceil(teleportCooldown / 1000);

                // Teleportamos al jugador centrado en la celda de destino
                const centerX = (targetTeleport.col + 0.5) * GRID_SIZE;
                const centerY = (targetTeleport.row + 0.5) * GRID_SIZE;
                player.x = centerX;
                player.y = centerY;
                player.dx = 0;
                player.dy = 0;
            }
        }
    }

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

    resumeButton.addEventListener('click', () => {
        resumeGame();
    });

    menuButton.addEventListener('click', () => {
        window.location.href = 'main.html';
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
        const timeUsed = 90 - timeLeft;
        
        // Guardar progreso - NIVEL 2
        let progress = JSON.parse(localStorage.getItem('gameProgress') || '{"completed":[]}');
        if (!Array.isArray(progress.completed)) {
            progress.completed = [];
        }
        
        if (!progress.completed.includes(2)) {
            progress.completed.push(2);
            progress.completed.sort((a, b) => a - b);
            localStorage.setItem('gameProgress', JSON.stringify(progress));
        }
        
        showMessage(
            "¡NIVEL COMPLETADO! ✓", 
            "Has escapado de los túneles...",
            `Tiempo: ${timeUsed}s | FPS: ${currentFps}`
        );
        
        retryButton.textContent = "Volver al Menú";
    }

    function loseGame() {
        gameActive = false;
        clearInterval(timerInterval);
        showMessage(
            "TIEMPO AGOTADO ✗", 
            "Los túneles te han atrapado.",
            "Intenta ser más rápido..."
        );
        
        retryButton.textContent = "Volver al Menú";
    }

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
        checkCollectible();
        checkTeleport();

        clearCanvas();
    // Aplicar cámara centrada en el jugador y con zoom
    player.applyCamera(ctx, canvas.width, canvas.height);
    drawMaze();
    drawCollectible();
    player.draw(ctx);
    drawExitIndicator(); // Dibujar indicador violeta si tiene el coleccionable
    drawLighting();
    player.restoreCamera(ctx);

    animationId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
        initializeGame();
        calculateSizes();
        
        player = new Player(0, 0, GRID_SIZE);
        player.setGridPosition(playerStartRow, playerStartCol);
        
        // NO cargar el estado del coleccionable al iniciar
        // El coleccionable siempre aparece al comenzar el nivel
        // Solo se guarda en localStorage cuando se recoge para el menú principal
        
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