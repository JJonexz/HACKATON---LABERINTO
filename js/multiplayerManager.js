/**
 * MultiplayerManager.js - Sistema de manejo de múltiples jugadores
 */
class MultiplayerManager {
    constructor(gridSize) {
        this.players = [];
        this.gridSize = gridSize;
        this.splitScreenActive = false;
        
        // Cargar la configuración de jugadores
        this.numPlayers = parseInt(localStorage.getItem('gamePlayers') || '1');
        this.initializePlayers();

        // Inicializar el sistema de proyectiles
        this.projectileManager = new ProjectileManager();
        console.log('ProjectileManager inicializado');
    }

    initializePlayers() {
        // Crear jugadores según la configuración
        for (let i = 0; i < this.numPlayers; i++) {
            const player = new Player(0, 0, this.gridSize);
            player.playerNumber = i + 1; // Asignar número de jugador (1 o 2)
            if (i === 1) { // Para el segundo jugador, usar un color ligeramente diferente
                player.color = '#FFE566';
            }
            this.players.push(player);
        }
    }

    updateGridSize(newGridSize) {
        this.gridSize = newGridSize;
        this.players.forEach(player => player.updateGridSize(newGridSize));
    }

    update(keys, canMoveTo, deltaTime) {
        // Actualizar primer jugador con WASD
        const keysPlayer1 = {
            'w': keys['w'] || keys['W'],
            's': keys['s'] || keys['S'],
            'a': keys['a'] || keys['A'],
            'd': keys['d'] || keys['D']
        };

        this.players[0].update(keysPlayer1, canMoveTo, deltaTime);

        // Disparos del jugador 1 (tecla Z)
        if (keys['z'] || keys['Z']) {
            console.log('Jugador 1 intentando disparar');
            if (this.projectileManager) {
                this.projectileManager.createProjectile(this.players[0], '#0066ff');
            } else {
                console.error('ProjectileManager no está inicializado para J1');
            }
        }

        // Actualizar segundo jugador con flechas si existe
        if (this.players.length > 1) {
            const keysPlayer2 = {
                'ArrowUp': keys['ArrowUp'],
                'ArrowDown': keys['ArrowDown'],
                'ArrowLeft': keys['ArrowLeft'],
                'ArrowRight': keys['ArrowRight']
            };

            this.players[1].update(keysPlayer2, canMoveTo, deltaTime);

            // Disparos del jugador 2 (tecla M)
            if (keys['m'] || keys['M']) {
                console.log('Jugador 2 intentando disparar');
                if (this.projectileManager) {
                    this.projectileManager.createProjectile(this.players[1], '#ff2222');
                } else {
                    console.error('ProjectileManager no está inicializado para J2');
                }
            }
        }

        // Actualizar proyectiles si existen
        if (this.projectileManager && this.projectileManager.projectiles) {
            this.projectileManager.update(canMoveTo);
            if (this.projectileManager.projectiles.length > 0) {
                console.log('Proyectiles activos:', this.projectileManager.projectiles.length);
            }
        }
    }

    draw(ctx, canvasWidth, canvasHeight) {
        if (this.players.length === 1) {
            // Modo un jugador: pantalla completa
            this.players[0].applyCamera(ctx, canvasWidth, canvasHeight);
            this.drawGameWorld(ctx, this.players[0]);
            // Dibujar todos los jugadores
            this.players.forEach(p => p.draw(ctx));
            // Aplicar iluminación
            this.drawLighting(ctx, canvasWidth, canvasHeight, this.players[0]);
            // Dibujar proyectiles
            if (this.projectileManager) {
                this.projectileManager.draw(ctx);
            }
            this.players[0].restoreCamera(ctx);
        } else {
            // Modo dos jugadores: pantalla dividida vertical
            const halfWidth = canvasWidth / 2;

            // Dibujar división
            ctx.save();
            ctx.fillStyle = '#ad0000';
            ctx.fillRect(halfWidth - 2, 0, 4, canvasHeight);
            ctx.restore();

            // Función auxiliar para dibujar cada vista
            const drawPlayerView = (player, startX, viewWidth) => {
                ctx.save();
                ctx.beginPath();
                ctx.rect(startX, 0, viewWidth, canvasHeight);
                ctx.clip();

                // Calcular el centro de la vista para este jugador
                const centerX = startX + viewWidth / 2;
                
                // Aplicar la transformación de la cámara
                ctx.save();
                ctx.translate(centerX, canvasHeight / 2);
                ctx.scale(player.cameraZoom, player.cameraZoom);
                ctx.translate(-player.x, -player.y);

                // Dibujar el mundo y los jugadores
                this.drawGameWorld(ctx, player);
                this.players.forEach(p => p.draw(ctx));
                
                // Dibujar proyectiles
                if (this.projectileManager) {
                    this.projectileManager.draw(ctx);
                }
                
                // Aplicar iluminación
                this.drawLighting(ctx, viewWidth, canvasHeight, player);
                
                ctx.restore();
                ctx.restore();
            };

            // Dibujar vista del jugador 1 (izquierda)
            drawPlayerView(this.players[0], 0, halfWidth);

            // Dibujar vista del jugador 2 (derecha)
            drawPlayerView(this.players[1], halfWidth, halfWidth);

            // Dibujar indicadores de control
            this.drawControlIndicators(ctx, canvasWidth, canvasHeight);
        }
    }

    drawControlIndicators(ctx, canvasWidth, canvasHeight) {
        const halfWidth = canvasWidth / 2;
        
        ctx.save();
        ctx.font = '20px "Courier New"';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        
        // Indicador jugador 1 (WASD + Z)
        ctx.fillStyle = '#0066ff';
        ctx.fillText('WASD + Z', 100, canvasHeight - 20);
        
        // Indicador jugador 2 (Flechas + M)
        ctx.fillStyle = '#ff2222';
        ctx.fillText('↑←↓→ + M', halfWidth + 100, canvasHeight - 20);
        ctx.restore();
    }

    drawGameWorld(ctx, currentPlayer) {
        // Este método debe ser sobrescrito por la clase que use MultiplayerManager
        // para dibujar el mundo del juego (paredes, objetos, etc.)
    }

    drawLighting(ctx, canvasWidth, canvasHeight, currentPlayer) {
        const gradient = ctx.createRadialGradient(
            currentPlayer.x, currentPlayer.y, currentPlayer.lightRadius * 0.1,
            currentPlayer.x, currentPlayer.y, currentPlayer.lightRadius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

        ctx.fillStyle = gradient;
        ctx.fillRect(
            currentPlayer.x - canvasWidth,
            currentPlayer.y - canvasHeight,
            canvasWidth * 2,
            canvasHeight * 2
        );
    }

    setPlayersPosition(positions) {
        positions.forEach((pos, index) => {
            if (this.players[index]) {
                this.players[index].setGridPosition(pos.row, pos.col);
            }
        });
    }

    getPlayersGridPositions() {
        return this.players.map(player => player.getGridPosition());
    }
}

// Exportar para uso global
window.MultiplayerManager = MultiplayerManager;