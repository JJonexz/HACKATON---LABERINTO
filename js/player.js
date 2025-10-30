/**
 * Player.js - Sistema de jugador con cámara suave, animaciones y sprites
 */
class Player {
    constructor(x, y, gridSize) {
        // ========== POSICIÓN ==========
        this.x = x;
        this.y = y;
        
        // ========== GRID ==========
        this.gridSize = gridSize;
        
        // ========== MOVIMIENTO ==========
        this.speed = gridSize / 4;
        this.dx = 0;
        this.dy = 0;
        this.isMoving = false;
        
        // ========== CÁMARA ==========
        this.cameraZoom = 2.5; // Nivel de zoom (ajustable)
        this.cameraLerpFactor = 0.08; // Suavizado de la cámara (0-1, más pequeño = más suave)
        // Posición actual de la cámara en coordenadas del mundo (se interpola hacia el jugador)
        this.cameraX = this.x;
        this.cameraY = this.y;
        
        // ========== DIRECCIÓN ==========
        this.direction = 'down';
        
        // ========== DIMENSIONES ==========
        this.radius = gridSize / 3;
        this.width = gridSize;
        this.height = gridSize;
        
        // ========== VISIBILIDAD ==========
        // Radio de luz fijo y simple
        this.lightRadius = gridSize * 5;
        
        // ========== COLORES ==========
        this.color = '#FFFF00';
        
        // ========== ANIMACIÓN Y SPRITES ==========
        this.spriteImages = {
            down: [new Image(), new Image(), new Image()],
            up: [new Image(), new Image(), new Image()],
            left: [new Image(), new Image(), new Image()],
            right: [new Image(), new Image(), new Image()]
        };
        this.loadSprites();
        
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 120;
    }
    
    // ========== CARGAR SPRITES ==========
    loadSprites() {
        const basePath = 'sprites/player/';
        
        const directions = {
            down: ['aba.png', 'aba1.png', 'aba2.png'],
            up: ['arr.png', 'arr1.png', 'arr2.png'],
            left: ['izq.png', 'izq1.png', 'izq2.png'],
            right: ['der.png', 'der1.png', 'der2.png']
        };

        // Cargar todos los sprites y asegurarse de que estén cargados
        for (const [direction, files] of Object.entries(directions)) {
            files.forEach((file, index) => {
                this.spriteImages[direction][index] = new Image();
                this.spriteImages[direction][index].src = basePath + file;
                
                // Agregar un manejador de error para cada imagen
                this.spriteImages[direction][index].onerror = () => {
                    console.error(`Error cargando sprite: ${basePath}${file}`);
                };
            });
        }
    }

    // ========== ACTUALIZAR GRID SIZE ==========
    updateGridSize(newGridSize) {
        const gridX = this.x / this.gridSize;
        const gridY = this.y / this.gridSize;
        
        this.gridSize = newGridSize;
        
        this.x = gridX * newGridSize;
        this.y = gridY * newGridSize;
        this.speed = newGridSize / 4;
        this.radius = newGridSize / 3;
        this.lightRadius = newGridSize * 5;
        
        this.width = newGridSize;
        this.height = newGridSize;
    }

    // ========== ACTUALIZAR POSICIÓN Y ANIMACIÓN ==========
    update(keys, canMoveTo, deltaTime) {
        this.isMoving = false;
        
        let dx = 0;
        let dy = 0;

        // Detectar teclas presionadas
        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            dy -= this.speed;
            this.direction = 'up';
        }
        if (keys['s'] || keys['S'] || keys['ArrowDown']) {
            dy += this.speed;
            this.direction = 'down';
        }
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
            dx -= this.speed;
            this.direction = 'left';
        }
        if (keys['d'] || keys['D'] || keys['ArrowRight']) {
            dx += this.speed;
            this.direction = 'right';
        }

        // Normalizar movimiento diagonal
        if (dx !== 0 && dy !== 0) {
            const factor = Math.sqrt(2) / 2;
            dx *= factor;
            dy *= factor;
        }

        // Aplicar movimiento con colisiones
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
        
        this.dx = dx;
        this.dy = dy;

        // Si ambas componentes quedaron a 0 (movimiento bloqueado), no se considera
        // que el jugador esté "moving" y por tanto no avanza la animación de caminar
        this.isMoving = (dx !== 0 || dy !== 0);

        // Actualizar animación
        if (this.isMoving) {
            this.animationTimer += deltaTime;
            if (this.animationTimer > this.animationSpeed) {
                this.animationFrame++;
                this.animationTimer = 0;
            }
        } else {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }

    // ========== APLICAR CÁMARA ==========
    applyCamera(ctx, canvasWidth, canvasHeight) {
        // Calcular el centro objetivo de la cámara
        const targetX = this.x;
        const targetY = this.y;

        // Interpolar suavemente la posición de la cámara
        if (Math.abs(this.cameraX - targetX) > 0.1) {
            this.cameraX += (targetX - this.cameraX) * this.cameraLerpFactor;
        } else {
            this.cameraX = targetX;
        }

        if (Math.abs(this.cameraY - targetY) > 0.1) {
            this.cameraY += (targetY - this.cameraY) * this.cameraLerpFactor;
        } else {
            this.cameraY = targetY;
        }

        // Aplicar transformación: centrar la cámara en (cameraX, cameraY) y aplicar zoom
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.scale(this.cameraZoom, this.cameraZoom);
        ctx.translate(-this.cameraX, -this.cameraY);
    }

    // ========== RESTAURAR CÁMARA ==========
    restoreCamera(ctx) {
        ctx.restore();
    }

    // ========== DIBUJAR PERSONAJE ==========
    draw(ctx) {
        let currentSpriteSet;
        
        switch (this.direction) {
            case 'up':
                currentSpriteSet = this.spriteImages.up;
                break;
            case 'down':
                currentSpriteSet = this.spriteImages.down;
                break;
            case 'left':
                currentSpriteSet = this.spriteImages.left;
                break;
            case 'right':
                currentSpriteSet = this.spriteImages.right;
                break;
            default:
                currentSpriteSet = this.spriteImages.down;
        }

        let frame;

        if (this.isMoving) {
            // Usar todos los frames excepto el 0 para la animación de caminar
            const walkFrames = currentSpriteSet.slice(1);

            if (this.animationFrame >= walkFrames.length) {
                this.animationFrame = 0;
            }
            frame = walkFrames[this.animationFrame];

        } else {
            // Pose estática: índice 0 reservado para idle en todas las direcciones
            frame = currentSpriteSet[0];
        }
        
        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;

        // Dibujar el sprite del jugador
        if (frame && frame.complete && frame.naturalHeight !== 0) {
            ctx.drawImage(frame, drawX, drawY, this.width, this.height);
        } else {
            // Fallback simple si no cargan los sprites
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dibujar el indicador de jugador
        if (this.playerNumber !== undefined) {
            const indicatorY = drawY - this.gridSize * 0.3;
            const indicatorSize = this.gridSize * 0.25;
            
            // Configurar sombra
            ctx.shadowColor = this.playerNumber === 1 ? '#0044ff' : '#ff0000';
            ctx.shadowBlur = 15;
            
            // Dibujar círculo con borde
            ctx.beginPath();
            ctx.arc(this.x, indicatorY, indicatorSize, 0, Math.PI * 2);
            ctx.fillStyle = this.playerNumber === 1 ? '#0066ff' : '#ff2222';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Dibujar número
            ctx.font = `bold ${indicatorSize}px Arial`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 0;
            ctx.fillText(this.playerNumber.toString(), this.x, indicatorY);
        }
    }

    // ========== OBTENER CELDA ACTUAL ==========
    getGridPosition() {
        return {
            col: Math.floor(this.x / this.gridSize),
            row: Math.floor(this.y / this.gridSize)
        };
    }

    // ========== ESTABLECER POSICIÓN EN CELDA ==========
    setGridPosition(row, col) {
        // Calcular posición central de la celda
        const newX = col * this.gridSize + this.gridSize / 2;
        const newY = row * this.gridSize + this.gridSize / 2;
        
        // Actualizar posición del jugador
        this.x = newX;
        this.y = newY;
        
        // Actualizar también la posición de la cámara para evitar saltos
        this.cameraX = newX;
        this.cameraY = newY;
        
        // Resetear velocidad
        this.dx = 0;
        this.dy = 0;
    }
}

// Exportar para uso global
window.Player = Player;