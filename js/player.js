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
        this.cameraZoom = 1.5; // Nivel de zoom (ajustable)
        this.cameraLerpFactor = 0.12; // Suavizado de la cámara (0-1, más pequeño = más suave)
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
        
        // Down sprites (índice 0 = idle, 1-2 = walking)
        this.spriteImages.down[0].src = basePath + 'aba.png';
        this.spriteImages.down[1].src = basePath + 'aba1.png';
        this.spriteImages.down[2].src = basePath + 'aba2.png';

        // Up sprites (índice 0 = idle, 1-2 = walking)
        this.spriteImages.up[0].src = basePath + 'arr.png';
        this.spriteImages.up[1].src = basePath + 'arr1.png';
        this.spriteImages.up[2].src = basePath + 'arr2.png';

        // Left sprites (índice 0 = idle, 1-2 = walking)
        this.spriteImages.left[0].src = basePath + 'izq.png';
        this.spriteImages.left[1].src = basePath + 'izq1.png';
        this.spriteImages.left[2].src = basePath + 'izq2.png';

        // Right sprites (índice 0 = idle, 1-2 = walking)
        this.spriteImages.right[0].src = basePath + 'der.png';
        this.spriteImages.right[1].src = basePath + 'der1.png';
        this.spriteImages.right[2].src = basePath + 'der2.png';
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
        // Interpolar la posición de la cámara hacia la posición del jugador
        this.cameraX += (this.x - this.cameraX) * this.cameraLerpFactor;
        this.cameraY += (this.y - this.cameraY) * this.cameraLerpFactor;

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

        if (frame && frame.complete && frame.naturalHeight !== 0) {
            ctx.drawImage(frame, drawX, drawY, this.width, this.height);
        } else {
            // Fallback simple si no cargan los sprites
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
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
        this.x = col * this.gridSize + this.gridSize / 2;
        this.y = row * this.gridSize + this.gridSize / 2;
        
        // Actualizar también la posición de la cámara para evitar saltos
        this.cameraX = this.x;
        this.cameraY = this.y;
    }
}

// Exportar para uso global
window.Player = Player;