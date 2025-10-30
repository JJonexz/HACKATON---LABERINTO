document.addEventListener('DOMContentLoaded', () => {

    // ========== CONFIGURACIÓN INICIAL ==========
    const canvas = document.getElementById('selectorCanvas');
    const ctx = canvas.getContext('2d');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const startButton = document.getElementById('start-button');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    let GRID_SIZE = 40;
    let gameActive = false;
    let animationId;
    let player = null;
    
    // NUEVA VARIABLE: Rastrea la puerta en la que está el jugador
    let currentDoorProximity = null; 

    // ========== SISTEMA DE NIVELES Y PROGRESO ==========
    // Niveles disponibles (añade más objetos aquí cuando quieras nuevos mapas)
    const levels = [
        { file: 'map1.html', id: 1, name: 'NIVEL 1' },
        { file: 'map2.html', id: 2, name: 'NIVEL 2' },
        { file: 'map3.html', id: 3, name: 'NIVEL 3' }
    ];
    let progress = JSON.parse(localStorage.getItem('gameProgress') || '{"completed":[]}');

    // Pool de niveles disponibles (siempre todos disponibles)
    let availableLevels = [];

    function buildAvailableLevels() {
        // TODOS los niveles están siempre disponibles para selección aleatoria
        // No hay bloqueo por progreso - todos accesibles desde el inicio
        availableLevels = levels.slice();
        console.log('[MAIN] Niveles disponibles:', availableLevels.map(p => p.file));
    }

    // Actualizar el contador de niveles completados
    function updateProgress() {
        // Asegurar que progress.completed es un array válido
        if (!Array.isArray(progress.completed)) {
            progress.completed = [];
            localStorage.setItem('gameProgress', JSON.stringify(progress));
        }

        const levelsCompletedElement = document.getElementById('levels-completed');
        if (levelsCompletedElement) {
            levelsCompletedElement.textContent = progress.completed.length;
        }
        
        // Mostrar mensaje de victoria total solo si TODOS los niveles están completados
        if (progress.completed.length === 3 && progress.completed.includes(1) && progress.completed.includes(2) && progress.completed.includes(3)) {
            // Solo mostrar si no existe ya
            if (!document.getElementById('victory-message')) {
                const victoryMessage = document.createElement('div');
                victoryMessage.id = 'victory-message';
                victoryMessage.style.position = 'fixed';
                victoryMessage.style.top = '100px';
                victoryMessage.style.left = '50%';
                victoryMessage.style.transform = 'translateX(-50%)';
                victoryMessage.style.background = 'rgba(0, 40, 0, 0.95)';
                victoryMessage.style.color = '#00ff00';
                victoryMessage.style.padding = '20px 30px';
                victoryMessage.style.borderRadius = '10px';
                victoryMessage.style.border = '3px solid #00ff00';
                victoryMessage.style.zIndex = '1000';
                victoryMessage.style.textAlign = 'center';
                victoryMessage.style.fontSize = '1.3em';
                victoryMessage.style.boxShadow = '0 0 30px #00ff00';
                victoryMessage.style.animation = 'pulse 2s ease-in-out infinite';
                victoryMessage.innerHTML = '🏆 ¡FELICITACIONES! 🏆<br><span style="font-size: 0.8em;">Has completado todos los niveles.<br>¡Eres el último turista en escapar!</span>';
                document.body.appendChild(victoryMessage);
            }
        }
    }

    // ========== MAPA DE SELECCIÓN (sala con 3 puertas) ==========
    // Un único casete/puerta ('D') donde aparecerá un mapa aleatorio no repetido.
    const selectorMap = [
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
        "W         W       W           W",
        "W         W       W           W",
        "W         W       W           W",
        "W         W   D   W           W",
        "W         W       W           W",
        "W         W       W           W",
        "W         W       W           W",
        "W         WWW   WWW           W",
        "W                             W",
        "W                             W",
        "W                             W",
        "W             P               W",
        "W                             W",
        "W                             W",
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ];
    
    const MAP_ROWS = selectorMap.length;
    const MAP_COLS = selectorMap[0].length;
    
    // Posición de la única puerta/cápsula
    const doors = {
        'D': { row: 4, col: 15 }
    };
    
    let playerStartRow = 12;
    let playerStartCol = 14;
    
    // Gestión de inputs
    const keys = {};
    
    window.addEventListener('keydown', (e) => {
        if (!gameActive) return;
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
        
        const maxGridWidth = availableWidth / MAP_COLS;
        const maxGridHeight = availableHeight / MAP_ROWS;
        
        GRID_SIZE = Math.floor(Math.min(maxGridWidth, maxGridHeight));
        
        canvas.width = MAP_COLS * GRID_SIZE;
        canvas.height = MAP_ROWS * GRID_SIZE;
    }
    
    function resizeGame() {
        const oldGridSize = GRID_SIZE;
        calculateSizes();
        
        if (player && oldGridSize) {
            player.updateGridSize(GRID_SIZE);
        }
    }

    // ========== FUNCIONES DE COLISIÓN ==========
    function isWall(x, y) {
        const c = Math.floor(x / GRID_SIZE);
        const r = Math.floor(y / GRID_SIZE);

        if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) {
            return true;
        }
        
        const cell = selectorMap[r][c];
        return cell === 'W';
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

    // ========== FUNCIONES DE DIBUJO ==========
    function clearCanvas() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawMap() {
        const currentTime = Date.now();
        
        for (let r = 0; r < MAP_ROWS; r++) {
            for (let c = 0; c < MAP_COLS; c++) {
                const cell = selectorMap[r][c];
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
                        
                    case 'D':
                        const pulse = Math.sin(currentTime * 0.003) * 0.3 + 0.7;

                        // SIEMPRE mostrar como disponible (azul)
                        const doorColor = `rgba(0, 120, 255, ${pulse})`;

                        ctx.fillStyle = doorColor;
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

                        ctx.shadowBlur = 20 * pulse;
                        ctx.shadowColor = doorColor;
                        ctx.strokeStyle = doorColor;
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
                        ctx.shadowBlur = 0;

                        // Texto: siempre mostrar como disponible
                        ctx.font = `bold ${GRID_SIZE * 0.45}px Arial`;
                        ctx.fillStyle = '#FFFFFF';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('▶', x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                        break;
                        
                    default:
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        break;
                }
            }
        }
        
        // Dibujar nombres de niveles encima de las puertas
        ctx.font = `bold ${GRID_SIZE * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Texto encima de la puerta única - SIEMPRE mostrar "Viajar"
        const singleDoor = Object.values(doors)[0];
        if (singleDoor) {
            const x = singleDoor.col * GRID_SIZE + GRID_SIZE / 2 - Math.round(GRID_SIZE * 1);
            const y = (singleDoor.row - 1) * GRID_SIZE + GRID_SIZE / 2;
            ctx.fillStyle = '#FFFF00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFFF00';
            ctx.fillText('Viajar', x, y);
            ctx.shadowBlur = 0;
        }
    }

    // ========== SISTEMA DE LUZ ==========
    function drawLighting() {
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = canvas.width;
        lightCanvas.height = canvas.height;
        const lightCtx = lightCanvas.getContext('2d');
        
        lightCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
        
        lightCtx.globalCompositeOperation = 'destination-out';
        
        const adjustedLightRadius = player.lightRadius * 1.5;
        
        const gradient = lightCtx.createRadialGradient(
            player.x, player.y, 0,
            player.x, player.y, adjustedLightRadius
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.95)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        lightCtx.fillStyle = gradient;
        lightCtx.beginPath();
        lightCtx.arc(player.x, player.y, adjustedLightRadius, 0, Math.PI * 2);
        lightCtx.fill();
        
        ctx.globalAlpha = 0.85;
        ctx.drawImage(lightCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
    }
    
    // ========== LÓGICA DE SELECCIÓN DE NIVEL ==========

    function selectRandomLevel() {
        // Siempre reconstruir la lista de niveles disponibles
        buildAvailableLevels();

        if (!availableLevels || availableLevels.length === 0) {
            const msg = document.createElement('div');
            msg.style.position = 'fixed';
            msg.style.top = '50%';
            msg.style.left = '50%';
            msg.style.transform = 'translate(-50%, -50%)';
            msg.style.background = 'rgba(0,0,0,0.9)';
            msg.style.color = '#fff';
            msg.style.padding = '20px';
            msg.style.borderRadius = '8px';
            msg.style.zIndex = '1000';
            msg.textContent = 'No hay mapas disponibles.';
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 2000);
            return;
        }

        // Elegir un nivel aleatorio de TODOS los disponibles
        const idx = Math.floor(Math.random() * availableLevels.length);
        const chosen = availableLevels[idx];
        console.log('[MAIN] Nivel elegido aleatoriamente:', chosen);

        startLevel(chosen);
    }

    function startLevel(levelObj) {
        gameActive = false;
        loadingOverlay.classList.remove('hidden');
        
        // Redirigir al nivel seleccionado
        setTimeout(() => {
            if (levelObj) {
                window.location.href = levelObj.file;
            }
        }, 1000);
    }

    // FUNCIÓN MODIFICADA
    function checkDoorProximity() {
        const pos = player.getGridPosition();
        let isNearADoor = false; // Para rastrear si estamos cerca de *alguna* puerta

        // Usar un bucle 'for...of' para poder salir temprano
        for (const [key, door] of Object.entries(doors)) {
            const distance = Math.sqrt(
                Math.pow(pos.row - door.row, 2) + 
                Math.pow(pos.col - door.col, 2)
            );
            
            // Si el jugador está cerca de la puerta
            if (distance < 2) {
                isNearADoor = true; // Marcamos que estamos cerca de una puerta
                
                // Solo activar si es la *primera vez* que entramos en la zona de esta puerta
                if (currentDoorProximity !== key) { 
                    currentDoorProximity = key; // Establecemos la puerta actual
                    // Selección aleatoria y no repetida
                    selectRandomLevel();
                }
                
                // Ya encontramos la puerta más cercana, no necesitamos seguir
                break; 
            }
        }

        // Si no estamos cerca de *ninguna* puerta, reseteamos el estado
        // Esto permite que el aviso vuelva a salir si el jugador se va y regresa
        if (!isNearADoor) {
            currentDoorProximity = null;
        }
    }

    // ========== BUCLE PRINCIPAL ==========
    function gameLoop() {
        if (!gameActive) return;
        
        player.update(keys, canMoveTo, 16);
        
        // Esta función ahora tiene la nueva lógica
        checkDoorProximity();

        clearCanvas();
    // Aplicar cámara centrada en el jugador y con zoom
    player.applyCamera(ctx, canvas.width, canvas.height);
    drawMap();
    player.draw(ctx);
    drawLighting();
    player.restoreCamera(ctx);
        
    animationId = requestAnimationFrame(gameLoop);
    }

    // ========== INICIO DEL JUEGO ==========
    function startGame() {
        calculateSizes();
        
        // Crear jugador usando la clase Player existente
        player = new Player(0, 0, GRID_SIZE);
        player.setGridPosition(playerStartRow, playerStartCol);
        
        window.addEventListener('resize', resizeGame);
        
        // Inicializar niveles disponibles
        buildAvailableLevels();
        updateProgress();
        
        gameActive = true;
        animationId = requestAnimationFrame(gameLoop);
    }
    
    // Botón de inicio y botón de reinicio de progreso
    startButton.addEventListener('click', () => {
        instructionsOverlay.classList.add('hidden');
        startGame();
    });

    // Botón para reiniciar progreso
    const resetProgressButton = document.getElementById('reset-progress');
    if (resetProgressButton) {
        resetProgressButton.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres reiniciar todo tu progreso? Esto no se puede deshacer.')) {
                localStorage.setItem('gameProgress', JSON.stringify({"completed":[]}));
                localStorage.removeItem('map2_collectible'); // Limpiar coleccionables
                progress = {"completed":[]};
                updateProgress();
                location.reload();
            }
        });
    }

});