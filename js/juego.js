document.addEventListener('DOMContentLoaded', () => {

    // --- Configuración Inicial ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const timerElement = document.getElementById('timer');
    const messageOverlay = document.getElementById('message-overlay');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const retryButton = document.getElementById('retry-button');
    
    // ========== ELEMENTOS DE PAUSA ==========
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseMenu = document.getElementById('pause-menu');
    const resumeButton = document.getElementById('resume-button');
    const menuButton = document.getElementById('menu-button');
    
    // Configuración de la cuadrícula (ahora dinámicas)
    let GRID_SIZE; 
    let VISIBILITY_RADIUS;

    let gameActive = true;
    let isPaused = false;  // ========== ESTADO DE PAUSA ==========
    let timerInterval;
    let timeLeft = 60;
    let animationId;  // ========== ID DE ANIMACIÓN ==========
    
    let player = null;
    let playerStartRow = 0;
    let playerStartCol = 0;
    
    // --- Configuración de Teletransportes con Cooldown ---
    const teleportCooldown = 2000;
    const cooldowns = {};

    // --- Mapa del Laberinto ---
    const mazeMap = [
        "WWWWWWWWWWWWWWWWWWWWWWWWWW",
        "WP  W     W T W   W      W",
        "W W WWWWW WWWWW W WWWWWW W",
        "W L W   W     W W W      W",
        "W WWW W WWWWW WWW W WWWWWW",
        "W   W W W   W W   W    W V", 
        "WWW W W W W W W WWWWWW W T",
        "W   W   W W W W      W W W",
        "W WWWWWWW W WWW WWWW W W W",
        "W W V   W W   W W    W W L",
        "W W WWWWW WWW W W WW W W W",
        "W L W   W W W   W  W   W W",
        "W WWWWWWWW WWWWWW WWW WWW W",
        "W W     W   W   W W W E W",
        "WWWWWWWWWWWWWWWWWWWWWWWWWW"
    ];

    const MAZE_ROWS = mazeMap.length;
    const MAZE_COLS = mazeMap[0].length;
    
    const teleportGroups = {
        'T': [
            { row: 1, col: 12 },
            { row: 6, col: 25 }
        ],
        'V': [
            { row: 5, col: 25 }, 
            { row: 9, col: 4 } 
        ],
        'L': [
            { row: 3, col: 2 },
            { row: 9, col: 25 },
            { row: 11, col: 2 }
        ]
    };

    // --- Gestión de Inputs ---
    const keys = {};

    window.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        
        // ========== DETECTAR ESC PARA PAUSAR ==========
        if (e.key === 'Escape') {
            if (isPaused) {
                resumeGame();
            } else {
                pauseGame();
            }
            return;
        }
        
        // No registrar teclas de movimiento si está pausado
        if (isPaused) return;
        
        keys[e.key] = true;
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // --- Funciones de Redimensionamiento ---
    function calculateSizes() {
        const availableHeight = window.innerHeight - 60;
        
        const maxGridWidth = window.innerWidth / MAZE_COLS;
        const maxGridHeight = availableHeight / MAZE_ROWS;
        
        GRID_SIZE = Math.floor(Math.min(maxGridWidth, maxGridHeight)) - 2; 
        
        if (GRID_SIZE < 15) GRID_SIZE = 15; 

        canvas.width = MAZE_COLS * GRID_SIZE;
        canvas.height = MAZE_ROWS * GRID_SIZE;

        VISIBILITY_RADIUS = GRID_SIZE * 3.5;
    }
    
    function resizeGame() {
        const oldGridSize = GRID_SIZE; 
        calculateSizes(); 
        
        if (player && oldGridSize) {
            player.updateGridSize(GRID_SIZE);
        }
    }

    // --- Inicialización ---
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
    
    // --- Funciones de Colisión ---
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

    // --- Dibujo ---
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
                        ctx.fillStyle = '#00FF00'; 
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        ctx.font = `${GRID_SIZE * 0.8}px Arial`;
                        ctx.fillStyle = '#000000';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('E', x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                        break;
                    case 'T':
                    case 'V':
                    case 'L':
                        let fillColor, strokeColor, icon;
                        switch(cell) {
                            case 'T':
                                fillColor = 'rgba(0, 0, 200, 0.5)';
                                strokeColor = '#00FFFF';
                                icon = 'T';
                                break;
                            case 'V':
                                fillColor = 'rgba(0, 200, 0, 0.5)';
                                strokeColor = '#00FF00';
                                icon = 'V';
                                break;
                            case 'L':
                                fillColor = 'rgba(128, 0, 128, 0.5)';
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
                        }

                        ctx.strokeStyle = strokeColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 3, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        ctx.font = `${GRID_SIZE * 0.6}px Arial`;
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

    function drawFogOfWar() {
        ctx.save();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'destination-out';
        
        const gradient = ctx.createRadialGradient(
            player.x, player.y, 0, 
            player.x, player.y, player.visibilityRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); 
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.visibilityRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over'; 
        
        ctx.restore(); 
    }
    
    // --- Lógica de Juego ---
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
                
                console.log(`Teletransportado de [${pos.row}, ${pos.col}] a [${targetTeleport.row}, ${targetTeleport.col}] (Tipo: ${cellType})`);
            }
        }
    }

    // ========== FUNCIONES DE PAUSA ==========
    function pauseGame() {
        if (isPaused || !gameActive) return;
        isPaused = true;
        console.log("🔴 Juego Pausado");

        // Detener el loop del juego
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        // Mostrar menú de pausa
        pauseOverlay.classList.remove('hidden');
        pauseMenu.classList.remove('hidden');

        // Aplicar desenfoque al canvas
        canvas.classList.add('paused');
    }

    function resumeGame() {
        if (!isPaused) return;
        isPaused = false;
        console.log("▶️ Juego Reanudado");

        // Ocultar menú de pausa
        pauseOverlay.classList.add('hidden');
        pauseMenu.classList.add('hidden');

        // Quitar desenfoque
        canvas.classList.remove('paused');

        // Reanudar el loop del juego
        gameLoop();
    }

    // --- Mensajes ---
    retryButton.addEventListener('click', () => {
        window.location.reload();
    });

    resumeButton.addEventListener('click', () => {
        resumeGame();
    });

    menuButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    function showMessage(title, text) {
        messageTitle.textContent = title;
        messageText.textContent = text;
        messageOverlay.classList.remove('hidden');
    }

    function winGame() {
        gameActive = false;
        clearInterval(timerInterval);
        showMessage("¡ESCAPASTE!", "Has encontrado la salida... por ahora.");
    }

    function loseGame() {
        gameActive = false;
        clearInterval(timerInterval);
        showMessage("TIEMPO AGOTADO", "El laberinto te ha consumido. No hay escapatoria.");
    }

    // --- Bucle Principal ---
    function gameLoop() {
        if (!gameActive || isPaused) return;  // ========== NO EJECUTAR SI ESTÁ PAUSADO ==========

        // Actualizar jugador
        player.update(keys, canMoveTo);
        
        // Verificar condiciones
        checkWinCondition();
        checkTeleport();

        clearCanvas(); 

        drawMaze(); 
        drawFogOfWar();
        
        player.drawAura(ctx);
        player.draw(ctx);
        
        animationId = requestAnimationFrame(gameLoop);
    }

    // --- Inicio del Juego ---
    function startGame() {
        initializeGame();
        calculateSizes();
        
        player = new Player(0, 0, GRID_SIZE);
        player.setGridPosition(playerStartRow, playerStartCol);
        
        window.addEventListener('resize', resizeGame);
        
        timerInterval = setInterval(() => {
            if (!gameActive || isPaused) {  // ========== NO CONTAR TIEMPO SI ESTÁ PAUSADO ==========
                return;
            }
            timeLeft--;
            timerElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                loseGame();
            }
        }, 1000);
        
        gameLoop();
    }

    startGame();

});