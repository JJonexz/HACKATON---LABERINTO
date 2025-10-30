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
    const availableLevels = ['map1.html', 'map2.html', 'map3.html'];
    let progress = JSON.parse(localStorage.getItem('gameProgress') || '{"completed":[]}');
    
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
        
        // Actualizar estado del coleccionable
        const collectibleCheckMain = document.getElementById('collectible-check-main');
        const collectiblesIndicator = document.getElementById('collectibles-indicator');
        if (localStorage.getItem('map2_collectible') === 'true') {
            collectibleCheckMain.textContent = '✓';
            collectibleCheckMain.style.color = '#00ff00';
            collectibleCheckMain.style.textShadow = '0 0 10px #00ff00';
            collectiblesIndicator.style.opacity = '1';
            collectiblesIndicator.style.filter = 'grayscale(0)';
        } else {
            collectibleCheckMain.textContent = '✗';
            collectibleCheckMain.style.color = '#ff4444';
            collectibleCheckMain.style.textShadow = 'none';
            collectiblesIndicator.style.opacity = '0.3';
            collectiblesIndicator.style.filter = 'grayscale(1)';
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
    const selectorMap = [
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
        "W                             W",
        "W                             W",
        "W                             W",
        "W    D1         D2        D3  W",
        "W    WW         WW        WW  W",
        "W    WW         WW        WW  W",
        "W    WW         WW        WW  W",
        "W                             W",
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
    
    // Posiciones de las puertas
    const doors = {
        'D1': { row: 4, col: 5, level: 0, name: 'NIVEL 1' },
        'D2': { row: 4, col: 16, level: 1, name: 'NIVEL 2' },
        'D3': { row: 4, col: 26, level: 2, name: 'NIVEL 3' }
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
                        
                    case 'D1':
                    case 'D2':
                    case 'D3':
                        const doorInfo = doors[cell];
                        const pulse = Math.sin(currentTime * 0.003) * 0.3 + 0.7;
                        
                        // Color según el estado del nivel
                        const levelIndex = parseInt(cell.replace('D', ''));
                        const isCompleted = progress.completed.includes(levelIndex);
                        const isLocked = levelIndex > 1 && !progress.completed.includes(levelIndex - 1);
                        
                        let doorColor;
                        if (isCompleted) {
                            doorColor = `rgba(0, 255, 0, ${pulse})`; // Verde para completados
                        } else if (isLocked) {
                            doorColor = `rgba(100, 100, 100, ${pulse * 0.5})`; // Gris para bloqueados
                        } else {
                            switch(cell) {
                                case 'D1':
                                    doorColor = `rgba(0, 100, 255, ${pulse})`;
                                    break;
                                case 'D2':
                                    doorColor = `rgba(0, 255, 100, ${pulse})`;
                                    break;
                                case 'D3':
                                    doorColor = `rgba(200, 0, 255, ${pulse})`;
                                    break;
                            }
                        }
                        
                        ctx.fillStyle = doorColor;
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        
                        // Efecto de candado para niveles bloqueados
                        if (isLocked) {
                            ctx.font = `bold ${GRID_SIZE * 0.6}px Arial`;
                            ctx.fillStyle = '#FF0000';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText('🔒', x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                        } else {
                            ctx.shadowBlur = 20 * pulse;
                            ctx.shadowColor = doorColor;
                            ctx.strokeStyle = doorColor;
                            ctx.lineWidth = 3;
                            ctx.strokeRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
                            ctx.shadowBlur = 0;
                        }
                        
                        // Texto del nivel
                        ctx.font = `bold ${GRID_SIZE * 0.4}px Arial`;
                        ctx.fillStyle = '#FFFFFF';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(levelIndex, x + GRID_SIZE / 2, y + GRID_SIZE / 2);
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
        
        Object.entries(doors).forEach(([key, door]) => {
            const x = door.col * GRID_SIZE + GRID_SIZE / 2;
            const y = (door.row - 1) * GRID_SIZE + GRID_SIZE / 2;
            
            ctx.fillStyle = '#FFFF00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFFF00';
            ctx.fillText(door.name, x, y);
            ctx.shadowBlur = 0;
        });
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
                    selectLevel(door.level); // Llamamos a la lógica de selección
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
    
    function selectLevel(levelIndex) {
        // Asegurar que progress.completed es un array
        if (!Array.isArray(progress.completed)) {
            progress.completed = [];
            localStorage.setItem('gameProgress', JSON.stringify(progress));
        }

        const levelNumber = levelIndex + 1;

        // Verificar si el nivel está bloqueado (debe completar el anterior primero)
        if (levelIndex > 0 && !progress.completed.includes(levelIndex)) {
            const doorInfo = Object.values(doors).find(d => d.level === levelIndex);
            
            // Crear y mostrar mensaje de bloqueo con efecto de sacudida
            // (Esta lógica no se repetirá gracias al cambio en checkDoorProximity)
            const message = document.createElement('div');
            message.style.position = 'fixed';
            message.style.top = '50%';
            message.style.left = '50%';
            message.style.transform = 'translate(-50%, -50%)';
            message.style.background = 'rgba(40, 0, 0, 0.95)';
            message.style.color = '#ff0000';
            message.style.padding = '20px 30px';
            message.style.borderRadius = '10px';
            message.style.border = '3px solid #ff0000';
            message.style.zIndex = '1000';
            message.style.textAlign = 'center';
            message.style.fontSize = '1.4em';
            message.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.3)';
            message.style.animation = 'shake 0.5s ease-in-out';
            message.innerHTML = `¡${doorInfo.name} BLOQUEADO!<br><span style="font-size: 0.8em; color: #ff6666">Completa el nivel anterior primero</span>`;
            
            // Añadir keyframes para la animación de sacudida
            if (!document.getElementById('shake-style')) {
                const style = document.createElement('style');
                style.id = 'shake-style';
                style.textContent = `
                    @keyframes shake {
                        0%, 100% { transform: translate(-50%, -50%); }
                        10%, 30%, 50%, 70%, 90% { transform: translate(-52%, -50%); }
                        20%, 40%, 60%, 80% { transform: translate(-48%, -50%); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(message);
            setTimeout(() => {
                message.style.transition = 'opacity 0.5s ease';
                message.style.opacity = '0';
                setTimeout(() => {
                    message.remove();
                }, 500);
            }, 2000);
            return;
        }

        // Si el nivel está completado, pedir confirmación
        // (Esta lógica tampoco se repetirá gracias al cambio)
        if (progress.completed.includes(levelNumber)) {
            const retry = confirm('Ya has completado este nivel. ¿Deseas intentarlo de nuevo?');
            
            if (!retry) {
                // !!!!! INICIO DE LA SOLUCIÓN !!!!!
                // Reseteamos todas las teclas. El 'confirm' bloquea el hilo
                // y puede hacer que se pierdan los eventos 'keyup'.
                // Esto evita que el jugador se quede "pegado" moviéndose.
                Object.keys(keys).forEach(key => { keys[key] = false; }); 
                // !!!!! FIN DE LA SOLUCIÓN !!!!!
                return; // Si el jugador cancela, la función termina.
            }
        }
        
        gameActive = false;
        loadingOverlay.classList.remove('hidden');
        
        // Redirigir al nivel correspondiente
        setTimeout(() => {
            window.location.href = availableLevels[levelIndex];
        }, 1000);
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
        
        // Actualizar progreso al inicio
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

