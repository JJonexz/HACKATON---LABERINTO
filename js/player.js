class Player {
    constructor(x, y, gridSize) {
        // ========== POSICIÓN ==========
        this.x = x;                    // Posición X en el canvas
        this.y = y;                    // Posición Y en el canvas
        
        // ========== GRID ==========
        this.gridSize = gridSize;      // Tamaño de celda (para cálculos)
        
        // ========== MOVIMIENTO ==========
        this.speed = gridSize / 5;     // Velocidad proporcional al grid
        this.dx = 0;                   // Delta X (movimiento horizontal)
        this.dy = 0;                   // Delta Y (movimiento vertical)
        this.isMoving = false;         // ¿Se está moviendo?
        
        // ========== DIRECCIÓN ==========
        this.direction = 'down';       // Dirección actual (up, down, left, right)
        
        // ========== DIMENSIONES ==========
        this.radius = gridSize / 3;    // Radio del círculo del jugador
        
        // ========== VISIBILIDAD ==========
        this.visibilityRadius = gridSize * 3.5; // Radio de visión
        
        // ========== COLORES ==========
        this.color = '#FFFF00';        // Amarillo
        this.auraColor = 'rgba(255, 255, 0, 0.15)';
    }

    // ==================== ACTUALIZAR GRID SIZE ====================
    updateGridSize(newGridSize) {
        // Guardar la posición relativa en celdas
        const gridX = this.x / this.gridSize;
        const gridY = this.y / this.gridSize;
        
        // Actualizar el gridSize
        this.gridSize = newGridSize;
        
        // Recalcular posición y parámetros
        this.x = gridX * newGridSize;
        this.y = gridY * newGridSize;
        this.speed = newGridSize / 5;
        this.radius = newGridSize / 3;
        this.visibilityRadius = newGridSize * 3.5;
    }

    // ==================== ACTUALIZAR POSICIÓN ====================
    update(keys, canMoveTo) {
        // Resetear estado de movimiento
        this.isMoving = false;
        
        // Variables para acumular movimiento
        let dx = 0;
        let dy = 0;

        // ========== DETECTAR TECLAS PRESIONADAS ==========
        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            dy -= this.speed;
            this.direction = 'up';
            this.isMoving = true;
        }
        if (keys['s'] || keys['S'] || keys['ArrowDown']) {
            dy += this.speed;
            this.direction = 'down';
            this.isMoving = true;
        }
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
            dx -= this.speed;
            this.direction = 'left';
            this.isMoving = true;
        }
        if (keys['d'] || keys['D'] || keys['ArrowRight']) {
            dx += this.speed;
            this.direction = 'right';
            this.isMoving = true;
        }

        // ========== NORMALIZAR MOVIMIENTO DIAGONAL ==========
        if (dx !== 0 && dy !== 0) {
            const factor = Math.sqrt(2) / 2;
            dx *= factor;
            dy *= factor;
        }

        // ========== APLICAR MOVIMIENTO CON COLISIONES ==========
        let newX = this.x + dx;
        if (canMoveTo(newX, this.y, this.radius)) {
            this.x = newX;
        } else {
            dx = 0;
        }

        let newY = this.y + dy;
        if (canMoveTo(this.x, newY, this.radius)) {
            this.y = newY;
        } else {
            dy = 0;
        }
        
        // Guardar deltas para uso externo si es necesario
        this.dx = dx;
        this.dy = dy;
    }

    // ==================== DIBUJAR AURA ====================
    drawAura(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius, 
            this.x, this.y, this.visibilityRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.15)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.visibilityRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==================== DIBUJAR PERSONAJE ====================
    draw(ctx) {
        // Dibujar jugador (círculo amarillo)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==================== OBTENER CELDA ACTUAL ====================
    getGridPosition() {
        return {
            col: Math.floor(this.x / this.gridSize),
            row: Math.floor(this.y / this.gridSize)
        };
    }

    // ==================== ESTABLECER POSICIÓN EN CELDA ====================
    setGridPosition(row, col) {
        this.x = col * this.gridSize + this.gridSize / 2;
        this.y = row * this.gridSize + this.gridSize / 2;
    }
}