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
    }

    initializePlayers() {
        // Crear jugadores según la configuración
        for (let i = 0; i < this.numPlayers; i++) {
            const player = new Player(0, 0, this.gridSize);
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

        // Actualizar segundo jugador con flechas si existe
        if (this.players.length > 1) {
            const keysPlayer2 = {
                'ArrowUp': keys['ArrowUp'],
                'ArrowDown': keys['ArrowDown'],
                'ArrowLeft': keys['ArrowLeft'],
                'ArrowRight': keys['ArrowRight']
            };

            this.players[1].update(keysPlayer2, canMoveTo, deltaTime);
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
            this.players[0].restoreCamera(ctx);
        } else {
            // Modo dos jugadores: pantalla dividida vertical
            const halfWidth = canvasWidth / 2;

            // Dibujar división
            ctx.save();
            ctx.fillStyle = '#ad0000';
            ctx.fillRect(halfWidth - 2, 0, 4, canvasHeight);
            ctx.restore();

            // Dibujar lado izquierdo (Jugador 1)
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, halfWidth, canvasHeight);
            ctx.clip();
            this.players[0].applyCamera(ctx, halfWidth, canvasHeight);
            this.drawGameWorld(ctx, this.players[0]);
            // Dibujar todos los jugadores en la vista del jugador 1
            this.players.forEach(p => p.draw(ctx));
            // Aplicar iluminación para jugador 1
            this.drawLighting(ctx, halfWidth, canvasHeight, this.players[0]);
            this.players[0].restoreCamera(ctx);
            ctx.restore();

            // Dibujar lado derecho (Jugador 2)
            ctx.save();
            ctx.beginPath();
            ctx.rect(halfWidth, 0, halfWidth, canvasHeight);
            ctx.clip();
            this.players[1].applyCamera(ctx, halfWidth, canvasHeight);
            this.drawGameWorld(ctx, this.players[1]);
            // Dibujar todos los jugadores en la vista del jugador 2
            this.players.forEach(p => p.draw(ctx));
            // Aplicar iluminación para jugador 2
            this.drawLighting(ctx, halfWidth, canvasHeight, this.players[1]);
            this.players[1].restoreCamera(ctx);
            ctx.restore();

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
        
        // Indicador jugador 1 (WASD)
        ctx.fillText('WASD', 60, canvasHeight - 20);
        
        // Indicador jugador 2 (Flechas)
        ctx.fillText('↑←↓→', halfWidth + 60, canvasHeight - 20);
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