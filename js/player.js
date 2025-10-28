// ==================== CONFIGURACIÓN DEL CANVAS ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Establecer tamaño del canvas (ajustable)
canvas.width = 800;
canvas.height = 600;

// ==================== CLASE PLAYER ====================
class Player {
    constructor(x, y) {
        // ========== POSICIÓN ==========
        this.x = x;                    // Posición X en el canvas
        this.y = y;                    // Posición Y en el canvas
        
        // ========== MOVIMIENTO ==========
        this.speed = 4;                // Velocidad de movimiento (píxeles por frame)
        this.isMoving = false;         // ¿El personaje se está moviendo?
        
        // ========== DIRECCIÓN ==========
        this.direction = 'down';       // Dirección actual (up, down, left, right)
        
        // ========== DIMENSIONES ==========
        this.width = 50;               // Ancho del cuadrado
        this.height = 50;              // Alto del cuadrado
        
        // ========== COLOR DEL CUADRADO ==========
        this.colors = {
            up: '#3498db',       // Azul cuando mira arriba
            down: '#e74c3c',     // Rojo cuando mira abajo
            left: '#f39c12',     // Naranja cuando mira izquierda
            right: '#2ecc71'     // Verde cuando mira derecha
        };
    }

    // ==================== ACTUALIZAR POSICIÓN ====================
    update(keys) {
        // Resetear estado de movimiento
        this.isMoving = false;
        
        // Variables para acumular movimiento
        let dx = 0;
        let dy = 0;

        // ========== DETECTAR TECLAS PRESIONADAS ==========
        // W o w = Arriba
        if (keys['w'] || keys['W']) {
            dy -= this.speed;
            this.direction = 'up';
            this.isMoving = true;
        }
        // S o s = Abajo
        if (keys['s'] || keys['S']) {
            dy += this.speed;
            this.direction = 'down';
            this.isMoving = true;
        }
        // A o a = Izquierda
        if (keys['a'] || keys['A']) {
            dx -= this.speed;
            this.direction = 'left';
            this.isMoving = true;
        }
        // D o d = Derecha
        if (keys['d'] || keys['D']) {
            dx += this.speed;
            this.direction = 'right';
            this.isMoving = true;
        }

        // ========== NORMALIZAR MOVIMIENTO DIAGONAL ==========
        // Para que no vaya más rápido en diagonal
        if (dx !== 0 && dy !== 0) {
            const factor = Math.sqrt(2) / 2; // ≈ 0.707
            dx *= factor;
            dy *= factor;
        }

        // ========== APLICAR MOVIMIENTO ==========
        this.x += dx;
        this.y += dy;

        // ========== MANTENER DENTRO DE LOS LÍMITES ==========
        // No dejar que el personaje salga del canvas
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
        }
    }

    // ==================== DIBUJAR PERSONAJE ====================
    draw() {
        // ========== DIBUJAR CUADRADO PRINCIPAL ==========
        // El color cambia según la dirección
        ctx.fillStyle = this.colors[this.direction];
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // ========== DIBUJAR BORDE ==========
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // ========== DIBUJAR INDICADOR DE DIRECCIÓN ==========
        // Dibuja una pequeña marca que indica hacia dónde mira
        ctx.fillStyle = '#2c3e50';
        
        switch(this.direction) {
            case 'up':
                // Triángulo apuntando arriba
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y + 10);
                ctx.lineTo(this.x + this.width / 2 - 8, this.y + 25);
                ctx.lineTo(this.x + this.width / 2 + 8, this.y + 25);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'down':
                // Triángulo apuntando abajo
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y + this.height - 10);
                ctx.lineTo(this.x + this.width / 2 - 8, this.y + this.height - 25);
                ctx.lineTo(this.x + this.width / 2 + 8, this.y + this.height - 25);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'left':
                // Triángulo apuntando izquierda
                ctx.beginPath();
                ctx.moveTo(this.x + 10, this.y + this.height / 2);
                ctx.lineTo(this.x + 25, this.y + this.height / 2 - 8);
                ctx.lineTo(this.x + 25, this.y + this.height / 2 + 8);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'right':
                // Triángulo apuntando derecha
                ctx.beginPath();
                ctx.moveTo(this.x + this.width - 10, this.y + this.height / 2);
                ctx.lineTo(this.x + this.width - 25, this.y + this.height / 2 - 8);
                ctx.lineTo(this.x + this.width - 25, this.y + this.height / 2 + 8);
                ctx.closePath();
                ctx.fill();
                break;
        }
    }
}

// ==================== GESTIÓN DE INPUTS ====================
const keys = {};

// Detectar cuando se presiona una tecla
window.addEventListener('keydown', (e) => {
    // Sigue registrando las teclas de movimiento
    keys[e.key] = true;
    
    // === ¡CAMBIO IMPORTANTE! ===
    // Ahora 'Escape' maneja la pausa, en lugar de volver al menú.
    if (e.key === 'Escape') {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

// Detectar cuando se suelta una tecla
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ==================== INICIALIZACIÓN DEL JUEGO ====================
let player;
let animationId; // Tu variable original para el ID de animación

// Función para iniciar el juego
function initGame() {
    // Crear el jugador en el centro del canvas
    const centerX = (canvas.width / 2) - 25;  // Restamos la mitad del ancho del cuadrado
    const centerY = (canvas.height / 2) - 25; // Restamos la mitad del alto del cuadrado
    
    player = new Player(centerX, centerY);
    
    console.log('✅ Juego iniciado');
    
    // Iniciar el loop del juego
    gameLoop();
}

// ==================== LOOP PRINCIPAL DEL JUEGO ====================
function gameLoop() {
    // Limpiar el canvas (fondo blanco)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Actualizar el jugador
    player.update(keys);
    
    // Dibujar el jugador
    player.draw();
    
    // Llamar al siguiente frame
    // Usa tu variable original 'animationId'
    animationId = requestAnimationFrame(gameLoop);
}

// ==================== LÓGICA DEL MENÚ DE PAUSA ====================

// 1. Obtener referencias a los elementos del DOM
// (Ya no necesitamos 'gameCanvas' aquí, ya está definido arriba)
const controlsInfo = document.querySelector('.controls-info');
const pauseOverlay = document.getElementById('pauseOverlay');
const pauseMenu = document.getElementById('pauseMenu');
const resumeButton = document.getElementById('resumeButton');

// 2. Variable para guardar el estado de pausa
let isPaused = false;

// (Ya no necesitamos 'animationFrameId', usaremos tu 'animationId' original)

// 3. Funciones para Pausar y Reanudar

function pauseGame() {
    if (isPaused) return; // Si ya está pausado, no hacer nada
    isPaused = true;
    console.log("Juego Pausado");

    // ¡IMPORTANTE! Detiene el bucle del juego
    // Usamos tu variable 'animationId'
    cancelAnimationFrame(animationId);

    // Muestra el menú y el fondo oscuro
    pauseOverlay.classList.remove('hidden');
    pauseMenu.classList.remove('hidden');

    // Aplica el efecto de desenfoque al canvas y los controles
    canvas.classList.add('paused'); // 'canvas' en lugar de 'gameCanvas'
    controlsInfo.classList.add('paused');
}

function resumeGame() {
    if (!isPaused) return; // Si no está pausado, no hacer nada
    isPaused = false;
    console.log("Juego Reanudado");

    // Oculta el menú y el fondo oscuro
    pauseOverlay.classList.add('hidden');
    pauseMenu.classList.add('hidden');

    // Quita el efecto de desenfoque
    canvas.classList.remove('paused'); // 'canvas' en lugar de 'gameCanvas'
    controlsInfo.classList.remove('paused');

    // ¡IMPORTANTE! Reanuda el bucle del juego
    // Llama a tu función principal del bucle de juego.
    gameLoop(); 
}

// 4. Detectar eventos

// (El evento 'Escape' ya fue movido a la sección 'GESTIÓN DE INPUTS')

// Evento para el botón de 'Reanudar'
resumeButton.addEventListener('click', resumeGame);


// ==================== INICIAR EL JUEGO ====================
// (La lógica de pausa ya está definida, ahora podemos iniciar el juego)
initGame();