/**
 * ProjectileManager.js - Sistema de proyectiles para los jugadores
 */
class Projectile {
    constructor(x, y, directionX, directionY, color, speed, size) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.color = color;
        this.speed = speed;
        this.size = size;
        this.alive = true;
        this.lifetime = 1000; // 1 segundo de vida
        this.createTime = Date.now();
        this.glowIntensity = 1;
    }

    update() {
        this.x += this.directionX * this.speed;
        this.y += this.directionY * this.speed;

        // Actualizar el tiempo de vida
        const age = Date.now() - this.createTime;
        if (age >= this.lifetime) {
            this.alive = false;
        } else {
            this.glowIntensity = 1 - (age / this.lifetime);
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Configurar el efecto de brillo
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20 * this.glowIntensity;
        
        // Dibujar el núcleo del proyectil
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Dibujar el rastro de energía
        const gradient = ctx.createLinearGradient(
            this.x - this.directionX * this.size * 4,
            this.y - this.directionY * this.size * 4,
            this.x,
            this.y
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, this.color);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.size * 1.5;
        ctx.lineCap = 'round';
        ctx.moveTo(
            this.x - this.directionX * this.size * 4,
            this.y - this.directionY * this.size * 4
        );
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        ctx.restore();
    }

    checkCollision(x, y, radius) {
        const dx = this.x - x;
        const dy = this.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size + radius);
    }
}

class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.lastShootTime = {
            player1: 0,
            player2: 0
        };
        this.shootCooldown = 250; // 250ms entre disparos
    }

    createProjectile(player, color) {
        const now = Date.now();
        const playerKey = `player${player.playerNumber}`;
        
        if (now - this.lastShootTime[playerKey] < this.shootCooldown) {
            return;
        }

        this.lastShootTime[playerKey] = now;

        // Determinar la dirección basada en la orientación del jugador
        let directionX = 0;
        let directionY = 0;

        switch (player.direction) {
            case 'up':
                directionY = -1;
                break;
            case 'down':
                directionY = 1;
                break;
            case 'left':
                directionX = -1;
                break;
            case 'right':
                directionX = 1;
                break;
        }

        // Crear el proyectil
        const projectile = new Projectile(
            player.x,
            player.y,
            directionX,
            directionY,
            color,
            player.gridSize / 4, // velocidad
            player.gridSize / 6   // tamaño
        );

        this.projectiles.push(projectile);
    }

    update(canMoveTo) {
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update();
            
            // Comprobar colisiones con paredes
            if (!canMoveTo(projectile.x, projectile.y, projectile.size)) {
                return false;
            }

            return projectile.alive;
        });
    }

    draw(ctx) {
        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}

// Exportar para uso global
window.ProjectileManager = ProjectileManager;