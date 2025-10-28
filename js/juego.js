document.addEventListener('DOMContentLoaded', () => {

    // --- Configuración Inicial ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const timerElement = document.getElementById('timer');
    const messageOverlay = document.getElementById('message-overlay');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const retryButton = document.getElementById('retry-button');
    
    // Configuración de la cuadrícula (ahora dinámicas)
    let GRID_SIZE; 
    let PLAYER_SPEED; 
    let VISIBILITY_RADIUS;

    let gameActive = true;
    let timerInterval;
    let timeLeft = 60; // 60 segundos
    // player ahora incluye la celda de inicio para recalcular posición al redimensionar
    let player = { x: 0, y: 0, dx: 0, dy: 0, startRow: 0, startCol: 0 }; 
    
    // --- Configuración de Teletransportes con Cooldown ---
    const teleportCooldown = 2000; // Tiempo de recarga en milisegundos (2 segundos)
    const cooldowns = {}; // Almacena el tiempo de fin de cooldown por coordenada 'fila,col'

    // --- Mapa del Laberinto ---
    // W: Muro, P: Inicio, E: Salida
    // T: Teletransporte Azul, V: Teletransporte Verde, L: Teletransporte Violeta
    const mazeMap = [
        "WWWWWWWWWWWWWWWWWWWWWWWWWW",
        "WP  W     W T W   W      W",
        "W W WWWWW WWWWW W WWWWWW W",
        "W L W   W     W W W      W", // L: Teletransporte Violeta (1)
        "W WWW W WWWWW WWW W WWWWWW",
        "W   W W W   W W   W    W V", 
        "WWW W W W W W W WWWWWW W T",
        "W   W   W W W W      W W W",
        "W WWWWWWW W WWW WWWW W W W",
        "W W V   W W   W W    W W L", // L: Teletransporte Violeta (2)
        "W W WWWWW WWW W W WW W W W",
        "W L W   W W W   W  W   W W", // **NUEVO L: Teletransporte Violeta (3)**
        "W WWWWWWWW WWWWWW WWW WWW W",
        "W W     W   W   W W W E W",
        "WWWWWWWWWWWWWWWWWWWWWWWWWW"
    ];

    const MAZE_ROWS = mazeMap.length;
    const MAZE_COLS = mazeMap[0].length;
    
    // Agrupación de teletransportes por tipo (color)
    const teleportGroups = {
        'T': [ // Teletransportes Azules
            { row: 1, col: 12 },
            { row: 6, col: 25 }
        ],
        'V': [ // Teletransportes Verdes
            { row: 5, col: 25 }, 
            { row: 9, col: 4 } 
        ],
        'L': [ // Teletransportes Violetas (¡Ahora tres!)
            { row: 3, col: 2 },
            { row: 9, col: 25 },
            { row: 11, col: 2 } // **NUEVA COORDENADA L**
        ]
    };

    // --- Funciones de Redimensionamiento y Cálculo de Posición ---

    /**
     * Calcula dinámicamente el tamaño de GRID_SIZE, canvas.width/height, 
     * y otros parámetros basados en el tamaño actual de la ventana.
     */
    function calculateSizes() {
        // Reservar espacio para el header (aprox 60px)
        const availableHeight = window.innerHeight - 60;
        
        const maxGridWidth = window.innerWidth / MAZE_COLS;
        const maxGridHeight = availableHeight / MAZE_ROWS;
        
        // Elegir el menor para asegurar que todo el laberinto quepa en la pantalla
        GRID_SIZE = Math.floor(Math.min(maxGridWidth, maxGridHeight)) - 2; 
        
        // Asegurar un tamaño mínimo de celda
        if (GRID_SIZE < 15) GRID_SIZE = 15; 

        // 2. Establecer dimensiones del canvas (las dimensiones reales de dibujo)
        canvas.width = MAZE_COLS * GRID_SIZE;
        canvas.height = MAZE_ROWS * GRID_SIZE;

        // 3. Actualizar parámetros dependientes del GRID_SIZE
        PLAYER_SPEED = GRID_SIZE / 5; // Velocidad proporcional a la celda
        // VISIBILITY_RADIUS ajustado
        VISIBILITY_RADIUS = GRID_SIZE * 3.5; 
    }
    
    /**
     * Maneja el redimensionamiento de la ventana y ajusta el tamaño del mapa 
     * y la posición del jugador proporcionalmente.
     */
    function resizeGame() {
        const oldGridSize = GRID_SIZE; 

        calculateSizes(); 
        
        // 4. Actualizar la posición del jugador
        if (oldGridSize) {
            // Si ya existía, escalar la posición del jugador proporcionalmente
            const scaleFactor = GRID_SIZE / oldGridSize;
            player.x *= scaleFactor;
            player.y *= scaleFactor;
        } else {
            // Inicialización: centrar jugador en la celda de inicio
            player.x = player.startCol * GRID_SIZE + GRID_SIZE / 2;
            player.y = player.startRow * GRID_SIZE + GRID_SIZE / 2;
        }
    }


    // --- Inicialización y Posición del Jugador ---
    function initializeGame() {
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                if (mazeMap[r][c] === 'P') {
                    // Guardar la celda de inicio 
                    player.startCol = c;
                    player.startRow = r;
                    return;
                }
            }
        }
    }
    
    // --- Dibujo del Laberinto y Niebla ---

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
                    case 'W': // Muro
                        ctx.fillStyle = '#330000'; 
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        ctx.strokeStyle = '#ff1a1a';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
                        break;
                    case 'E': // Salida
                        ctx.fillStyle = '#00FF00'; 
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        ctx.font = `${GRID_SIZE * 0.8}px Arial`;
                        ctx.fillStyle = '#000000';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('E', x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                        break;
                    case 'T': // Teletransporte Azul
                    case 'V': // Teletransporte Verde
                    case 'L': // Teletransporte Violeta
                        let fillColor, strokeColor, icon;
                        switch(cell) {
                            case 'T': // Azul
                                fillColor = 'rgba(0, 0, 200, 0.5)';
                                strokeColor = '#00FFFF';
                                icon = 'T';
                                break;
                            case 'V': // Verde
                                fillColor = 'rgba(0, 200, 0, 0.5)';
                                strokeColor = '#00FF00';
                                icon = 'V';
                                break;
                            case 'L': // Violeta
                                fillColor = 'rgba(128, 0, 128, 0.5)';
                                strokeColor = '#FF00FF';
                                icon = 'L';
                                break;
                        }
                        
                        // Determinar si está en cooldown para cambiar el color o el borde
                        const cooldownKey = `${r},${c}`;
                        let isCoolingDown = cooldowns[cooldownKey] && cooldowns[cooldownKey] > currentTime;
                        
                        if (isCoolingDown) {
                            // Dibuja un fondo oscuro si está en cooldown
                            ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'; 
                            ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        } else {
                            // Dibuja el color normal si está activo
                            ctx.fillStyle = fillColor;
                            ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        }

                        // Dibuja el borde y el icono
                        ctx.strokeStyle = strokeColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 3, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Dibuja el icono de la letra
                        ctx.font = `${GRID_SIZE * 0.6}px Arial`;
                        ctx.fillStyle = isCoolingDown ? '#888888' : strokeColor; // Icono gris si está en cooldown
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(icon, x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                        break;
                    case 'P': // Punto de inicio
                    case ' ': // Camino
                        ctx.fillStyle = '#000000'; 
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        break;
                }
            }
        }
    }

    function drawPlayer() {
        // Dibuja el aura brillante *detrás* del jugador (Amarilla con MÁS transparencia)
        const gradient = ctx.createRadialGradient(player.x, player.y, GRID_SIZE / 3, player.x, player.y, VISIBILITY_RADIUS);
        // Opacidad muy baja (0.15 y 0.05)
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.15)'); // Amarillo con baja opacidad
        gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.05)'); // Amarillo con muy baja opacidad
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)'); // Totalmente transparente
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, VISIBILITY_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Dibuja el jugador (Amarillo)
        ctx.fillStyle = '#FFFF00'; 
        ctx.beginPath();
        ctx.arc(player.x, player.y, GRID_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Dibuja la niebla de guerra usando el modo de composición 'destination-out'
     */
    function drawFogOfWar() {
        ctx.save();
        
        // 1. Dibuja la capa de niebla opaca sobre TODO el canvas.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Cambia el modo de composición a 'destination-out'.
        ctx.globalCompositeOperation = 'destination-out';
        
        // 3. Dibuja el círculo "borrador" con un degradado.
        const gradient = ctx.createRadialGradient(
            player.x, player.y, 0, 
            player.x, player.y, VISIBILITY_RADIUS
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); 
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, VISIBILITY_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // 4. Restaura el modo de composición predeterminado.
        ctx.globalCompositeOperation = 'source-over'; 
        
        ctx.restore(); 
    }
    
    // --- Lógica de Movimiento y Colisión ---

    function isWall(x, y) {
        const c = Math.floor(x / GRID_SIZE);
        const r = Math.floor(y / GRID_SIZE);

        if (r < 0 || r >= MAZE_ROWS || c < 0 || c >= MAZE_COLS) {
            return true;
        }
        return mazeMap[r][c] === 'W';
    }

    function canMoveTo(x, y) {
        const playerSize = GRID_SIZE / 3; 

        const checkPoints = [
            [x + playerSize, y],
            [x - playerSize, y],
            [x, y + playerSize],
            [x, y - playerSize],
            [x, y]
        ];

        for (const [px, py] of checkPoints) {
            if (isWall(px, py)) {
                return false;
            }
        }
        // No verificamos teletransporte aquí para permitir entrada sin detenerse
        return true;
    }

    function movePlayer() {
        if (player.dx === 0 && player.dy === 0) return;

        let newX = player.x + player.dx;
        if (canMoveTo(newX, player.y)) {
            player.x = newX;
        } else {
            player.dx = 0;
        }

        let newY = player.y + player.dy;
        if (canMoveTo(player.x, newY)) {
            player.y = newY;
        } else {
            player.dy = 0;
        }
        
        checkWinCondition();
        checkTeleport(); 
    }

    function checkWinCondition() {
        const exitCol = Math.floor(player.x / GRID_SIZE);
        const exitRow = Math.floor(player.y / GRID_SIZE);
        if (mazeMap[exitRow][exitCol] === 'E') {
            winGame();
        }
    }
    
    /**
     * Revisa la posición del jugador y activa la teletransportación si se encuentra en
     * una celda de teletransporte activa. Aplica cooldown a ambos puntos (o a todos los demás).
     */
    function checkTeleport() {
        const playerCol = Math.floor(player.x / GRID_SIZE);
        const playerRow = Math.floor(player.y / GRID_SIZE);
        
        const cellType = mazeMap[playerRow][playerCol];
        const cooldownKey = `${playerRow},${playerCol}`;

        // 1. Verificar si es un teletransporte (T, V, o L)
        if (!teleportGroups[cellType]) return; 

        const currentTime = Date.now();
        
        // 2. Verificar el cooldown del punto de entrada
        if (cooldowns[cooldownKey] && cooldowns[cooldownKey] > currentTime) {
            // Está en cooldown. Ignorar el teletransporte.
            console.log(`Teletransporte en [${playerRow}, ${playerCol}] (Tipo: ${cellType}) en cooldown. Tiempo restante: ${Math.ceil((cooldowns[cooldownKey] - currentTime) / 1000)}s`);
            return; 
        }

        const group = teleportGroups[cellType];
        if (group.length < 2) return; 

        // 3. Encontrar el punto de teletransporte actual y los posibles destinos
        const currentTeleport = group.find(tp => tp.row === playerRow && tp.col === playerCol);
        
        if (currentTeleport) {
            // Filtrar todos los destinos posibles (todos menos el actual)
            const possibleTargets = group.filter(tp => tp.row !== playerRow || tp.col !== playerCol);

            if (possibleTargets.length > 0) {
                
                // Seleccionar un destino aleatorio
                const targetTeleport = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                const targetCooldownKey = `${targetTeleport.row},${targetTeleport.col}`;

                // 4. Aplicar cooldown al teletransportador actual
                cooldowns[cooldownKey] = currentTime + teleportCooldown;
                
                // 5. Aplicar cooldown al teletransportador de destino 
                cooldowns[targetCooldownKey] = currentTime + teleportCooldown;

                // 6. Teletransportar al centro de la celda de destino
                player.x = targetTeleport.col * GRID_SIZE + GRID_SIZE / 2;
                player.y = targetTeleport.row * GRID_SIZE + GRID_SIZE / 2;
                
                // 7. Detener el movimiento temporalmente
                player.dx = 0;
                player.dy = 0;
                
                console.log(`Teletransportado de [${playerRow}, ${playerCol}] a [${targetTeleport.row}, ${targetTeleport.col}] (Tipo: ${cellType}). Cooldown aplicado.`);
            }
        }
    }


    // --- Manejo de Eventos y Mensajes (sin cambios) ---

    function handleKeyDown(event) {
        if (!gameActive) return;

        // Mantener las direcciones si el jugador mantiene varias teclas. 
        // Solo sobrescribir si una dirección opuesta está activa.
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                player.dy = -PLAYER_SPEED;
                break;
            case 'ArrowDown':
            case 's':
                player.dy = PLAYER_SPEED;
                break;
            case 'ArrowLeft':
            case 'a':
                player.dx = -PLAYER_SPEED;
                break;
            case 'ArrowRight':
            case 'd':
                player.dx = PLAYER_SPEED;
                break;
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
            event.preventDefault();
        }
    }

    function handleKeyUp(event) {
        // Solo anular el movimiento si la tecla liberada es la que actualmente define la dirección
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                if (player.dy < 0) player.dy = 0;
                break;
            case 'ArrowDown':
            case 's':
                if (player.dy > 0) player.dy = 0;
                break;
            case 'ArrowLeft':
            case 'a':
                if (player.dx < 0) player.dx = 0;
                break;
            case 'ArrowRight':
            case 'd':
                if (player.dx > 0) player.dx = 0;
                break;
        }
    }

    retryButton.addEventListener('click', () => {
        // Redirección para reiniciar el juego
        window.location.reload();
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

    // --- Bucle Principal del Juego ---
    function gameLoop() {
        if (!gameActive) return; 

        movePlayer(); 

        clearCanvas(); 

        // 1. Dibujar todo el laberinto ANTES de la niebla.
        drawMaze(); 
        
        // 2. Aplicar la niebla de guerra.
        drawFogOfWar();

        // 3. Dibujar al jugador y su aura.
        drawPlayer();  
        
        requestAnimationFrame(gameLoop);
    }

    // --- Inicio del Juego ---
    function startGame() {
        initializeGame();
        resizeGame(); // **Llamada inicial para calcular el tamaño y la posición**
        
        // **Nuevo: Escuchar el evento de redimensionamiento de la ventana**
        window.addEventListener('resize', resizeGame);
        
        // Iniciar el temporizador
        timerInterval = setInterval(() => {
            if (!gameActive) {
                clearInterval(timerInterval);
                return;
            }
            timeLeft--;
            timerElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                loseGame();
            }
        }, 1000);

        // Escuchar teclas
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Iniciar el bucle de juego
        requestAnimationFrame(gameLoop);
    }

    // Iniciar el juego al cargar
    startGame();

});
