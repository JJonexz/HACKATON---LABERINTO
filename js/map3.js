document.addEventListener('DOMContentLoaded', () => {

    // ========== INYECCIÓN DE ESTILO PARA COLECCIONABLE PARCIAL ==========
    // Se añade un estilo para el estado 'parcial' (un jugador ha recogido)
    const partialStyle = `
        .collectible-partial {
            opacity: 1;
            filter: grayscale(0);
            animation: collectPulse 1s ease; /* Usar la misma animación de pulso */
        }
        .collectible-partial #collectible-check {
            color: #ff4444; /* Mantener la X en rojo */
            text-shadow: 0 0 10px #ff4444; /* Añadir un brillo rojo */
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = partialStyle;
    document.head.appendChild(styleSheet);
    // ===================================================================

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
    // Elementos del coleccionable
    const collectibleIndicator = document.getElementById('collectible-indicator');
    const collectibleCheck = document.getElementById('collectible-check');

    // ========== CONFIGURACIÓN DEL NIVEL ==========
    const LEVEL_ID = 3;
    const TIME_LIMIT = 60; // Aumentado para dar tiempo a buscar el coleccionable
    const TELEPORT_COOLDOWN = 5000;
    
    let GRID_SIZE;
    let player = null;
    let timerInterval;
    let floorPattern = null; // Patrón del suelo
    let timeLeft = TIME_LIMIT;
    let multiplayerManager = null;
    
    // Estado de coleccionables
    let collectibles = null;
    const collectiblePosition = { row: 19, col: 8 }; // Posición del motor (movido a un pasillo abierto)
    const exitPosition = { row: 22, col: 4 }; // Posición de la salida 'E'
    
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
    // lastTeleportCell ahora almacena la última celda usada por jugador (clave: 'p1','p2')
    let lastTeleportCell = {};
    let teleportCooldownActive = false;

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
        "W        BWWWWW      W        W        WWW      W        W", // Posición (19, 8) está aquí
        "WWWWWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW   WWWWWWWW  W",
        "W  W      W   W      W   W      W   W      W   W      W  W",
        "W  W  E   W   W  W   W   W      W   W   C  W   W      W  W", // Salida en 22, 4
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

    // Función para crear el patrón del suelo
    function createFloorPattern() {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = GRID_SIZE;
        patternCanvas.height = GRID_SIZE;
        const patternCtx = patternCanvas.getContext('2d');

        // Dibujar el patrón base de cemento
        patternCtx.fillStyle = '#808080';
        patternCtx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

        // Agregar textura de cemento estática
        patternCtx.fillStyle = 'rgba(128, 128, 128, 0.4)';
        for(let i = 0; i < 6; i++) {
            const rectSize = Math.random() * 4 + 2;
            patternCtx.fillRect(
                Math.random() * GRID_SIZE,
                Math.random() * GRID_SIZE,
                rectSize,
                rectSize
            );
        }

        // Agregar líneas de grietas estáticas
        patternCtx.strokeStyle = 'rgba(90, 90, 90, 0.3)';
        patternCtx.beginPath();
        patternCtx.moveTo(Math.random() * GRID_SIZE, 0);
        patternCtx.lineTo(Math.random() * GRID_SIZE, GRID_SIZE);
        patternCtx.stroke();

        return ctx.createPattern(patternCanvas, 'repeat');
    }

    function drawMaze() {
        // Crear el patrón del suelo si aún no existe
        if (!floorPattern) {
            floorPattern = createFloorPattern();
        }

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
                        ctx.fillStyle = floorPattern;
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        break;
                }
            }
        }
    }

    /**
     * Dibuja el coleccionable (motor) en el lienzo.
     */
    function drawCollectible() {
        // Si ambos jugadores han recogido el motor, no lo dibujamos
        if (collectibles.p1.collected && collectibles.p2.collected) return;

        const x = collectiblePosition.col * GRID_SIZE;
        const y = collectiblePosition.row * GRID_SIZE;

        // Actualizamos el pulso para los jugadores que no han recogido el motor
        if (!collectibles.p1.collected) collectibles.p1.pulse += 0.05;
        if (!collectibles.p2.collected) collectibles.p2.pulse += 0.05;

        // Usamos el pulso del primer jugador que no haya recogido el motor
        const activePulse = !collectibles.p1.collected ? collectibles.p1.pulse : collectibles.p2.pulse;
        const pulse = Math.sin(activePulse) * 0.3 + 0.7;
        const glow = Math.sin(activePulse * 2) * 10 + 15;
        
        // Color plateado para el motor
        ctx.fillStyle = `rgba(192, 192, 192, ${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = glow;
        ctx.shadowColor = '#C0C0C0';
        ctx.font = `${GRID_SIZE * 0.7}px Arial`;
        ctx.fillStyle = `rgba(220, 220, 220, ${pulse})`; // Un poco más brillante
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚙️', x + GRID_SIZE / 2, y + GRID_SIZE / 2); // Emoji de motor
        ctx.shadowBlur = 0;
    }

    /**
     * Dibuja un indicador que guía al jugador hacia la salida una vez que ha recogido el motor.
     */
    function drawExitIndicator() {
        // Dibuja el indicador para cada jugador que haya recogido el motor
        if (!multiplayerManager || !multiplayerManager.players || !collectibles) return;
        
        const exitX = (exitPosition.col + 0.5) * GRID_SIZE;
        const exitY = (exitPosition.row + 0.5) * GRID_SIZE;

        // Determinar qué jugador está siendo dibujado
        let player, activePlayerIndex;
        
        // Si solo hay un jugador, siempre usar el jugador 1
        if (multiplayerManager.players.length === 1) {
            player = multiplayerManager.players[0];
            activePlayerIndex = 0;
        } else {
            // En pantalla dividida, determinar qué vista se está dibujando
            const transform = ctx.getTransform();
            const viewportCenterX = transform.e;
            activePlayerIndex = viewportCenterX >= canvas.width / 2 ? 1 : 0;
            player = multiplayerManager.players[activePlayerIndex];
        }
        
        const playerId = `p${activePlayerIndex + 1}`;

        if (!collectibles[playerId] || !collectibles[playerId].collected) return;

        // Actualiza el pulso individual
        collectibles[playerId].indicatorPulse += 0.08;
        const pulse = Math.sin(collectibles[playerId].indicatorPulse) * 0.4 + 0.6;

        const dx = exitX - player.x;
        const dy = exitY - player.y;
        const angle = Math.atan2(dy, dx);
        const distance = 8000; // Distancia desde el jugador
        const indicatorX = player.x + Math.cos(angle) * distance;
        const indicatorY = player.y + Math.sin(angle) * distance;
        
        // Color específico por jugador
        const playerColor = activePlayerIndex === 0 ? 
            { r: 0, g: 150, b: 255 } :  // Azul para jugador 1
            { r: 255, g: 0, b: 0 };     // Rojo para jugador 2
            
        const gradient = ctx.createRadialGradient(indicatorX, indicatorY, 0, indicatorX, indicatorY, 30 * pulse);
        gradient.addColorStop(0, `rgba(${playerColor.r}, ${playerColor.g}, ${playerColor.b}, ${pulse})`);
        gradient.addColorStop(0.5, `rgba(${playerColor.r}, ${playerColor.g}, ${playerColor.b}, ${pulse * 0.5})`);
        gradient.addColorStop(1, `rgba(${playerColor.r}, ${playerColor.g}, ${playerColor.b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 30 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(${playerColor.r}, ${playerColor.g}, ${playerColor.b}, ${pulse})`;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(${playerColor.r}, ${playerColor.g}, ${playerColor.b}, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgb(${playerColor.r}, ${playerColor.g}, ${playerColor.b})`;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Dibujar la flecha
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

    /**
     * Muestra un mensaje temporal en el centro de la pantalla.
     * @param {string} text - El texto a mostrar.
     */
    function showTemporaryMessage(text) {
        let tempMsg = document.getElementById('temp-message');
        if (!tempMsg) {
            tempMsg = document.createElement('div');
            tempMsg.id = 'temp-message';
            // Estilos para la cripta (verde)
            tempMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,100,0,0.9);color:#fff;padding:20px 40px;border-radius:10px;font-size:1.5em;z-index:1000;border:3px solid #00ff00;box-shadow:0 0 30px rgba(0,255,0,0.8);font-family:Courier New,monospace;text-align:center';
            document.body.appendChild(tempMsg);
        }
        tempMsg.textContent = text;
        tempMsg.style.display = 'block';
        setTimeout(() => tempMsg.style.display = 'none', 2000);
    }

    /**
     * Actualiza la UI del coleccionable en el header basado en el estado de ambos jugadores.
     */
    function updateCollectibleUI() {
        if (!collectibleIndicator || !collectibleCheck || !collectibles) return;

        const p1Collected = collectibles.p1.collected;
        const p2Collected = collectibles.p2.collected;

        // Limpiar clases de estado
        collectibleIndicator.classList.remove('collectible-uncollected', 'collectible-collected', 'collectible-partial');

        if (p1Collected && p2Collected) {
            // Estado 3: Ambos jugadores han recogido el coleccionable
            collectibleIndicator.classList.add('collectible-collected');
            collectibleCheck.textContent = '✓';
            localStorage.setItem('map3_collectible', 'true'); // Guardar progreso
        } else if (p1Collected || p2Collected) {
            // Estado 2: Solo un jugador ha recogido el coleccionable
            collectibleIndicator.classList.add('collectible-partial'); // Nueva clase para 'iluminado'
            collectibleCheck.textContent = '✗'; // Sigue mostrando la X
        } else {
            // Estado 1: Ningún jugador ha recogido el coleccionable
            collectibleIndicator.classList.add('collectible-uncollected');
            collectibleCheck.textContent = '✗';
        }
    }

    /**
     * Comprueba si el jugador ha recogido el motor.
     * @param {Player} playerObj - La instancia del jugador.
     * @param {number} playerIndex - El índice del jugador (0 o 1).
     */
    function checkCollectible(playerObj, playerIndex) {
        if (!collectibles) return;
        
        const playerId = `p${playerIndex + 1}`;
        if (!collectibles[playerId] || collectibles[playerId].collected) return;
        
        const pos = playerObj.getGridPosition();
        if (pos.row === collectiblePosition.row && pos.col === collectiblePosition.col) {
            collectibles[playerId].collected = true;
            
            // Actualizar la UI para reflejar el estado (parcial o completo)
            updateCollectibleUI();
            
            showTemporaryMessage(`¡Jugador ${playerIndex + 1} ha encontrado el motor! Dirígete a la salida.`);
        }
    }

    /**
     * Comprueba si el jugador ha llegado a la salida y tiene el motor.
     * @param {Player} playerObj - La instancia del jugador.
     * @param {number} playerIndex - El índice del jugador (0 o 1).
     */
    function checkWinCondition(playerObj, playerIndex) {
        if (!collectibles) return;
        
        const playerId = `p${playerIndex + 1}`;
        const pos = playerObj.getGridPosition();
        if (mazeMap[pos.row][pos.col] === 'E') {
            // Se comprueba si AMBOS jugadores han recogido el motor para ganar
            if (collectibles.p1.collected && collectibles.p2.collected) {
                winGame();
            } else {
                // Si este jugador lo tiene pero el otro no
                if (collectibles[playerId].collected) {
                    showTemporaryMessage(`¡Jugador ${playerIndex + 1}, espera a tu compañero!`);
                } else {
                    // Si este jugador no lo tiene
                    showTemporaryMessage(`¡Jugador ${playerIndex + 1} necesita el motor ⚙️ para salir!`);
                }
            }
        }
    }
    
    /**
     * Comprueba si el jugador está en un teletransportador y lo mueve.
     * @param {Player} playerObj - La instancia del jugador.
     * @param {number} playerIndex - El índice del jugador (0 o 1).
     */
    function checkTeleport(playerObj, playerIndex) {
        const pos = playerObj.getGridPosition();
        
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

        // Si no estamos en un teleporter, limpiar el registro para este jugador
        if (!teleportGroups[cellType] || teleportGroups[cellType].length === 0) {
            const keyName = 'p' + (playerObj.playerNumber || (playerIndex + 1));
            lastTeleportCell[keyName] = null;
            return;
        }

        const keyName = 'p' + (playerObj.playerNumber || (playerIndex + 1));

        // Si ya estamos sobre este teleporter, no hacer nada (evita loop)
        if (lastTeleportCell[keyName] === cellKey) {
            return;
        }

        // Verificar si hay cooldown activo para este teleporter
        if (cooldowns[cellKey] && cooldowns[cellKey] > currentTime) {
            return;
        }

        const group = teleportGroups[cellType];
        if (group.length < 2) {
            console.warn(`[MAP3] Grupo ${cellType} tiene menos de 2 teleporters`);
            return;
        }

        // Encontrar teleporter actual en el grupo
        const currentTeleport = group.find(tp => tp.row === pos.row && tp.col === pos.col);
        
        if (!currentTeleport) {
            console.warn(`[MAP3] No se encontró teleporter actual en grupo ${cellType}`);
            return;
        }

        // Obtener teleporters de destino (todos menos el actual)
        const possibleTargets = group.filter(tp => tp.row !== pos.row || tp.col !== pos.col);

        if (possibleTargets.length === 0) {
            console.warn(`[MAP3] No hay destinos disponibles para ${cellType}`);
            return;
        }

        // Elegir destino aleatorio
        const targetTeleport = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        
        console.log(`[MAP3] Teleportando ${cellType}: (${pos.row},${pos.col}) -> (${targetTeleport.row},${targetTeleport.col})`);
        
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
        playerObj.setGridPosition(targetTeleport.row, targetTeleport.col);
        
        // Marcar este teleporter como el último usado para este jugador
        lastTeleportCell[keyName] = `${targetTeleport.row},${targetTeleport.col}`;
        
        console.log(`[MAP3] Nueva posición del jugador ${keyName}: (${playerObj.x}, ${playerObj.y})`);
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
        multiplayerManager.update(keys, canMoveTo, deltaTime);

        // Comprobar condiciones y teleports para cada jugador
        multiplayerManager.players.forEach((p, idx) => {
            checkCollectible(p, idx); // Comprobar si recoge el motor
            checkWinCondition(p, idx); // Comprobar si llega a la salida CON el motor
            checkTeleport(p, idx);
        });

        GameBase.clearCanvas(ctx, canvas);
        multiplayerManager.draw(ctx, canvas.width, canvas.height);
        
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    // ========== INICIO ==========
    function startGame() {
        const start = GameBase.findPlayerStart(mazeMap);
        calculateSizes();
        
        // Inicializar el estado de los coleccionables
        collectibles = {
            p1: { collected: false, pulse: 0, indicatorPulse: 0 },
            p2: { collected: false, pulse: 0, indicatorPulse: 0 }
        };

        // Establecer el estado inicial de la UI
        updateCollectibleUI();
        
        multiplayerManager = new MultiplayerManager(GRID_SIZE);
        multiplayerManager.drawGameWorld = function(ctx) {
            const currentTransform = ctx.getTransform(); // Guardar transformación
            drawMaze();
            drawCollectible(); // Dibujar el motor
            drawExitIndicator(); // Dibujar el indicador a la salida (si aplica)
            ctx.setTransform(currentTransform); // Restaurar transformación
        };

        // Buscar segunda posición inicial cerca de la primera
        const startPos = [];
        startPos.push(start); // Posición del jugador 1

        // Buscar una posición válida adyacente para el jugador 2
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

        // Si no se encontró posición adyacente, usar la misma que el jugador 1
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