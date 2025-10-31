document.addEventListener('DOMContentLoaded', () => {

    // ========== CONFIGURACIÓN INICIAL ==========
    const canvas = document.getElementById('selectorCanvas');
    const ctx = canvas.getContext('2d');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const closeInstructionsBtn = document.getElementById('close-instructions');
    const instructionsToggleBtn = document.getElementById('instructions-toggle');
    const musicToggleBtn = document.getElementById('music-toggle');
    const backgroundMusic = document.getElementById('background-music');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    let GRID_SIZE = 40;
    let gameActive = false;
    let animationId;
    let playerManager = null;
    let currentDoorProximity = null;
    let isMusicPlaying = false;

    // ========== SISTEMA DE MÚSICA ==========
    function toggleMusic() {
        if (isMusicPlaying) {
            backgroundMusic.pause();
            musicToggleBtn.textContent = '🔇';
            musicToggleBtn.classList.remove('active');
            isMusicPlaying = false;
        } else {
            backgroundMusic.play().catch(err => {
                console.log('Error al reproducir música:', err);
            });
            musicToggleBtn.textContent = '🔊';
            musicToggleBtn.classList.add('active');
            isMusicPlaying = true;
        }
    }

    musicToggleBtn.addEventListener('click', toggleMusic);

    // ========== SISTEMA DE INSTRUCCIONES ==========
    function showInstructions() {
        instructionsOverlay.classList.remove('hidden');
        gameActive = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function hideInstructions() {
        instructionsOverlay.classList.add('hidden');
        if (!animationId && playerManager) {
            gameActive = true;
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    instructionsToggleBtn.addEventListener('click', showInstructions);
    closeInstructionsBtn.addEventListener('click', hideInstructions);

    // ========== SISTEMA DE NIVELES Y PROGRESO V2.0 ==========
    const levels = [
        { file: 'map1.html', id: 1, name: 'NIVEL 1' },
        { file: 'map2.html', id: 2, name: 'NIVEL 2' },
        { file: 'map3.html', id: 3, name: 'NIVEL 3' }
    ];
    
    let progress = JSON.parse(localStorage.getItem('gameProgress') || '{"completed":[], "playedThisSession":[]}');
    let availableLevels = [];

    function buildAvailableLevels() {
        if (!Array.isArray(progress.completed)) progress.completed = [];
        if (!Array.isArray(progress.playedThisSession)) progress.playedThisSession = [];

        availableLevels = levels.filter(level => 
            !progress.completed.includes(level.id) && 
            !progress.playedThisSession.includes(level.id)
        );

        console.log('[MAIN v2.0] Completados:', progress.completed);
        console.log('[MAIN v2.0] Jugados sesión:', progress.playedThisSession);
        console.log('[MAIN v2.0] Disponibles:', availableLevels.map(p => p.file));

        if (availableLevels.length === 0) {
            const allCompleted = progress.completed.length === levels.length;
            
            if (!allCompleted && progress.playedThisSession.length > 0) {
                console.log('[MAIN v2.0] Reseteando sesión');
                progress.playedThisSession = [];
                localStorage.setItem('gameProgress', JSON.stringify(progress));
                buildAvailableLevels();
            }
        }
    }

    function updateProgress() {
        if (!Array.isArray(progress.completed)) {
            progress.completed = [];
            localStorage.setItem('gameProgress', JSON.stringify(progress));
        }

        const levelsCompletedElement = document.getElementById('levels-completed');
        if (levelsCompletedElement) {
            levelsCompletedElement.textContent = progress.completed.length;
        }
        
        if (progress.completed.length === 3 && progress.completed.includes(1) && progress.completed.includes(2) && progress.completed.includes(3)) {
            if (!document.getElementById('victory-message')) {
                const victoryMessage = document.createElement('div');
                victoryMessage.id = 'victory-message';
                victoryMessage.style.cssText = 'position:fixed;top:100px;left:50%;transform:translateX(-50%);background:rgba(0,40,0,0.95);color:#00ff00;padding:20px 30px;border-radius:10px;border:3px solid #00ff00;z-index:1000;text-align:center;font-size:1.3em;box-shadow:0 0 30px #00ff00;animation:pulse 2s ease-in-out infinite';
                victoryMessage.innerHTML = '🏆 ¡FELICITACIONES! 🏆<br><span style="font-size:0.8em;">Has completado todos los niveles.<br>¡Eres el último turista en escapar!</span>';
                document.body.appendChild(victoryMessage);
            }
        }
    }

    // ========== MAPA DE SELECCIÓN ==========
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
    const doors = { 'D': { row: 4, col: 15 } };
    const playerStartRow = 12;
    const playerStartCol = 14;
    const keys = {};
    
    window.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        
        if (e.key === 'Escape') {
            pauseGame();
            e.preventDefault();
            return;
        }
        
        keys[e.key] = true;
        console.log('Tecla presionada:', e.key);
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'z', 'Z', 'm', 'M'].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // ========== REDIMENSIONAMIENTO ==========
    function calculateSizes() {
        GRID_SIZE = GameBase.calculateSizes(canvas, MAP_ROWS, MAP_COLS);
    }
    
    function resizeGame() {
        const oldGridSize = GRID_SIZE;
        calculateSizes();
        if (playerManager && oldGridSize) {
            playerManager.updateGridSize(GRID_SIZE);
        }
    }

    // ========== COLISIONES ==========
    function isWall(x, y) {
        return GameBase.isWall(x, y, selectorMap, GRID_SIZE);
    }

    function canMoveTo(x, y, radius) {
        return GameBase.canMoveTo(x, y, radius, selectorMap, GRID_SIZE);
    }

    // ========== DIBUJO ==========
    function clearCanvas() {
        GameBase.clearCanvas(ctx, canvas);
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
                        GameBase.drawWall(ctx, x, y, GRID_SIZE, '#330000', '#ff1a1a');
                        break;
                        
                    case 'D':
                        const pulse = Math.sin(currentTime * 0.003) * 0.3 + 0.7;
                        const hasAvailableLevels = availableLevels.length > 0;
                        const doorColor = hasAvailableLevels 
                            ? `rgba(0, 120, 255, ${pulse})`
                            : `rgba(0, 255, 0, ${pulse})`;

                        ctx.fillStyle = doorColor;
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        ctx.shadowBlur = 20 * pulse;
                        ctx.shadowColor = doorColor;
                        ctx.strokeStyle = doorColor;
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
                        ctx.shadowBlur = 0;

                        ctx.font = `bold ${GRID_SIZE * 0.45}px Arial`;
                        ctx.fillStyle = '#FFFFFF';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(hasAvailableLevels ? '▶' : '✓', x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                        break;
                        
                    default:
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        break;
                }
            }
        }
        
        ctx.font = `bold ${GRID_SIZE * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const singleDoor = Object.values(doors)[0];
        if (singleDoor) {
            const x = singleDoor.col * GRID_SIZE + GRID_SIZE / 2 - Math.round(GRID_SIZE * 1);
            const y = (singleDoor.row - 1) * GRID_SIZE + GRID_SIZE / 2;
            const hasAvailableLevels = availableLevels.length > 0;
            ctx.fillStyle = hasAvailableLevels ? '#FFFF00' : '#00FF00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = hasAvailableLevels ? '#FFFF00' : '#00FF00';
            ctx.fillText(hasAvailableLevels ? 'Viajar' : 'Completado', x, y);
            ctx.shadowBlur = 0;
        }
    }

    function drawLighting() {
        GameBase.drawLighting(ctx, player, canvas, 0.85);
    }
    
    // ========== SELECCIÓN DE NIVEL ==========
    let levelRoulette = null;

    function selectRandomLevel() {
        buildAvailableLevels();

        if (!availableLevels || availableLevels.length === 0) {
            const allCompleted = progress.completed.length === levels.length;
            const msg = document.createElement('div');
            msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:' + (allCompleted ? 'rgba(0,40,0,0.95)' : 'rgba(40,0,0,0.95)') + ';color:#fff;padding:30px 40px;border-radius:12px;z-index:1000;text-align:center;font-size:1.4em;border:3px solid ' + (allCompleted ? '#00ff00' : '#ff0000') + ';box-shadow:0 0 30px ' + (allCompleted ? '#00ff00' : '#ff0000');
            msg.innerHTML = allCompleted 
                ? '🏆 ¡Has completado todos los niveles!<br><span style="font-size:0.7em">No hay más desafíos disponibles.</span>'
                : '⚠️ No hay niveles disponibles.<br><span style="font-size:0.7em">Completa o reinicia tu progreso.</span>';
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 3000);
            return;
        }

        if (!levelRoulette) {
            levelRoulette = new LevelRoulette();
            levelRoulette.container.addEventListener('levelSelected', (e) => {
                const chosenLevel = levels.find(l => l.id === e.detail.levelId);
                if (chosenLevel && !progress.playedThisSession.includes(chosenLevel.id)) {
                    progress.playedThisSession.push(chosenLevel.id);
                    localStorage.setItem('gameProgress', JSON.stringify(progress));
                    console.log('[MAIN] Nivel jugado agregado:', chosenLevel.id, 'Sesión actual:', progress.playedThisSession);
                }
                setTimeout(() => {
                    levelRoulette.hide();
                    startLevel(chosenLevel);
                }, 1000);
            });
        }

        // CRÍTICO: Pasar los niveles disponibles a la ruleta antes de mostrarla
        levelRoulette.setAvailableLevels(availableLevels);
        levelRoulette.show();
        setTimeout(() => levelRoulette.spin(), 500);
    }

    function startLevel(levelObj) {
        gameActive = false;
        loadingOverlay.classList.remove('hidden');
        setTimeout(() => {
            if (levelObj) window.location.href = levelObj.file;
        }, 1000);
    }

    function checkDoorProximity() {
        const positions = playerManager.getPlayersGridPositions();
        let isNearADoor = false;

        for (const pos of positions) {
            for (const [key, door] of Object.entries(doors)) {
                const distance = Math.sqrt(
                    Math.pow(pos.row - door.row, 2) + 
                    Math.pow(pos.col - door.col, 2)
                );
                
                if (distance < 2) {
                    isNearADoor = true;
                    if (currentDoorProximity !== key) { 
                        currentDoorProximity = key;
                        selectRandomLevel();
                    }
                    break; 
                }
            }
            if (isNearADoor) break;
        }

        if (!isNearADoor) currentDoorProximity = null;
    }

    // ========== PAUSA ==========
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseMenu = document.getElementById('pause-menu');
    const resumeButton = document.getElementById('resume-button');
    const exitMenuButton = document.getElementById('exit-menu-button');
    const resetRunButton = document.getElementById('reset-run-button');

    function pauseGame() {
        if (!gameActive) return;
        gameActive = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (pauseOverlay && pauseMenu) {
            pauseOverlay.classList.remove('hidden');
            pauseMenu.classList.remove('hidden');
            canvas.classList.add('paused');
        }
        if (levelRoulette) {
            levelRoulette.hide();
        }
    }

    function resumeGame() {
        if (pauseOverlay && pauseMenu) {
            pauseOverlay.classList.add('hidden');
            pauseMenu.classList.add('hidden');
            canvas.classList.remove('paused');
        }
        gameActive = true;
        if (!animationId) animationId = requestAnimationFrame(gameLoop);
    }

    if (resumeButton) resumeButton.addEventListener('click', resumeGame);
    if (exitMenuButton) exitMenuButton.addEventListener('click', () => window.location.href = 'index.html');
    if (resetRunButton) {
        resetRunButton.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres reiniciar todo tu progreso? Esto no se puede deshacer.')) {
                localStorage.setItem('gameProgress', JSON.stringify({"completed":[], "playedThisSession":[]}));
                localStorage.removeItem('map2_collectible');
                progress = {"completed":[], "playedThisSession":[]};
                updateProgress();
                location.reload();
            }
        });
    }

    // ========== BUCLE PRINCIPAL ==========
    function gameLoop() {
        if (!gameActive) return;
        
        playerManager.update(keys, canMoveTo, 16);
        checkDoorProximity();
        clearCanvas();
        playerManager.draw(ctx, canvas.width, canvas.height);
        
        animationId = requestAnimationFrame(gameLoop);
    }

    // ========== INICIO ==========
    function startGame() {
        calculateSizes();
        playerManager = new MultiplayerManager(GRID_SIZE);
        
        // Configurar posiciones iniciales para todos los jugadores
        const startPositions = [
            { row: playerStartRow, col: playerStartCol },
            { row: playerStartRow, col: playerStartCol + 1 }
        ];
        playerManager.setPlayersPosition(startPositions);

        // Implementar el método drawGameWorld requerido
        playerManager.drawGameWorld = function(ctx, currentPlayer) {
            drawMap();
        };

        window.addEventListener('resize', resizeGame);
        buildAvailableLevels();
        updateProgress();
        gameActive = true;
        animationId = requestAnimationFrame(gameLoop);
    }
    
    // Iniciar el juego automáticamente (sin overlay de instrucciones)
    startGame();

});