/**
 * GameBase - Clase con funciones compartidas por todos los niveles
 * Evita duplicación de código entre map1.js, map2.js y map3.js
 */
class GameBase {
    
    // ========== CÁLCULO DE TAMAÑOS ==========
    static calculateSizes(canvas, rows, cols) {
        const availableHeight = window.innerHeight - 70;
        const availableWidth = window.innerWidth;
        
        const maxGridWidth = availableWidth / cols;
        const maxGridHeight = availableHeight / rows;
        
        const gridSize = Math.floor(Math.min(maxGridWidth, maxGridHeight));
        
        canvas.width = cols * gridSize;
        canvas.height = rows * gridSize;
        
        return gridSize;
    }

    // ========== COLISIONES ==========
    static isWall(x, y, map, gridSize) {
        const c = Math.floor(x / gridSize);
        const r = Math.floor(y / gridSize);

        if (r < 0 || r >= map.length || c < 0 || c >= map[0].length) {
            return true;
        }
        return map[r][c] === 'W';
    }

    static canMoveTo(x, y, radius, map, gridSize) {
        const checkPoints = [
            [x + radius, y],
            [x - radius, y],
            [x, y + radius],
            [x, y - radius],
            [x, y]
        ];

        for (const [px, py] of checkPoints) {
            if (GameBase.isWall(px, py, map, gridSize)) {
                return false;
            }
        }
        return true;
    }

    // ========== DIBUJO ==========
    static wallImage = null;

    static clearCanvas(ctx, canvas) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    static drawWall(ctx, x, y, gridSize, wallColor, strokeColor) {
        // Cargar la imagen de casa si aún no está cargada
        if (!GameBase.wallImage) {
            GameBase.wallImage = new Image();
            GameBase.wallImage.src = 'sprites/map/PNG/casa.png';
            
            // Manejar errores de carga
            GameBase.wallImage.onerror = () => {
                console.error('[GameBase] Error al cargar casa.png - usando respaldo');
                GameBase.wallImage.hadError = true;
            };
        }

        // Si la imagen está cargada y no hubo errores, dibujarla
        if (GameBase.wallImage.complete && !GameBase.wallImage.hadError) {
            try {
                ctx.drawImage(GameBase.wallImage, x, y, gridSize, gridSize);
            } catch (e) {
                console.error('[GameBase] Error al dibujar casa.png:', e);
                GameBase.wallImage.hadError = true;
                // Dibujar rectángulo de respaldo
                ctx.fillStyle = wallColor;
                ctx.fillRect(x, y, gridSize, gridSize);
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, gridSize, gridSize);
            }
        } else {
            // Mientras se carga o si hubo error, mostrar rectángulo temporal
            ctx.fillStyle = wallColor;
            ctx.fillRect(x, y, gridSize, gridSize);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, gridSize, gridSize);
        }
    }

    static drawExit(ctx, x, y, gridSize, currentTime) {
        const exitPulse = Math.sin(currentTime * 0.003) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 255, 0, ${exitPulse})`;
        ctx.fillRect(x, y, gridSize, gridSize);
        
        ctx.font = `bold ${gridSize * 0.7}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E', x + gridSize / 2, y + gridSize / 2);
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00FF00';
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
        ctx.shadowBlur = 0;
    }

    static drawTeleporter(ctx, x, y, gridSize, cellType, cooldownKey, cooldowns, currentTime) {
        let fillColor, strokeColor, icon;
        switch(cellType) {
            case 'T':
                fillColor = 'rgba(0, 100, 255, 0.6)';
                strokeColor = '#00FFFF';
                icon = 'T';
                break;
            case 'V':
                fillColor = 'rgba(0, 255, 100, 0.6)';
                strokeColor = '#00FF00';
                icon = 'V';
                break;
            case 'L':
                fillColor = 'rgba(200, 0, 255, 0.6)';
                strokeColor = '#FF00FF';
                icon = 'L';
                break;
            case 'X':
                fillColor = 'rgba(255, 0, 255, 0.6)';
                strokeColor = '#FF00FF';
                icon = 'X';
                break;
            case 'Y':
                fillColor = 'rgba(255, 255, 0, 0.6)';
                strokeColor = '#FFFF00';
                icon = 'Y';
                break;
            case 'A':
                fillColor = 'rgba(255, 0, 0, 0.6)';
                strokeColor = '#FF0000';
                icon = 'A';
                break;
            case 'B':
                fillColor = 'rgba(0, 150, 255, 0.6)';
                strokeColor = '#0096FF';
                icon = 'B';
                break;
            case 'C':
                fillColor = 'rgba(150, 0, 255, 0.6)';
                strokeColor = '#9600FF';
                icon = 'C';
                break;
        }
        
        let isCoolingDown = cooldowns[cooldownKey] && cooldowns[cooldownKey] > currentTime;
        
        if (isCoolingDown) {
            ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
            ctx.fillRect(x, y, gridSize, gridSize);
        } else {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, gridSize, gridSize);
            
            const pulse = Math.sin(currentTime * 0.005) * 0.5 + 0.5;
            ctx.shadowBlur = 15 * pulse;
            ctx.shadowColor = strokeColor;
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + gridSize / 2, y + gridSize / 2, gridSize / 3.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.font = `bold ${gridSize * 0.55}px Arial`;
        ctx.fillStyle = isCoolingDown ? '#888888' : strokeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x + gridSize / 2, y + gridSize / 2);
    }

    // ========== ILUMINACIÓN ==========
    static drawLighting(ctx, player, canvas, opacity = 0.90) {
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = canvas.width;
        lightCanvas.height = canvas.height;
        const lightCtx = lightCanvas.getContext('2d');
        
        lightCtx.fillStyle = 'rgba(0, 0, 0, 1)';
        lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
        
        lightCtx.globalCompositeOperation = 'destination-out';
        
        const adjustedLightRadius = player.lightRadius * 1.3;
        
        const gradient = lightCtx.createRadialGradient(
            player.x, player.y, 0,
            player.x, player.y, adjustedLightRadius
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.95)');
        gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.7)');
        gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        lightCtx.fillStyle = gradient;
        lightCtx.beginPath();
        lightCtx.arc(player.x, player.y, adjustedLightRadius, 0, Math.PI * 2);
        lightCtx.fill();
        
        ctx.globalAlpha = opacity;
        ctx.drawImage(lightCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
    }

    // ========== TELETRANSPORTE (DEPRECATED - Usar implementación local) ==========
    // Esta función se mantiene por compatibilidad pero se recomienda usar
    // implementaciones locales en cada mapa para mejor control
    static checkTeleport(player, map, teleportGroups, cooldowns, teleportCooldown, cooldownDisplay, cooldownTimer, gridSize) {
        console.warn('[GameBase] checkTeleport está deprecated. Usar implementación local en cada mapa.');
    }

    // ========== PAUSA ==========
    static pauseGame(gameState, canvas, pauseOverlay, pauseMenu) {
        if (gameState.isPaused || !gameState.gameActive) return;
        gameState.isPaused = true;

        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
            gameState.animationId = null;
        }

        if (pauseOverlay && pauseMenu) {
            pauseOverlay.classList.remove('hidden');
            pauseMenu.classList.remove('hidden');
            canvas.classList.add('paused');
        }
    }

    static resumeGame(gameState, canvas, pauseOverlay, pauseMenu, gameLoop) {
        if (!gameState.isPaused) return;
        gameState.isPaused = false;

        if (pauseOverlay && pauseMenu) {
            pauseOverlay.classList.add('hidden');
            pauseMenu.classList.add('hidden');
            canvas.classList.remove('paused');
        }

        gameState.lastTime = 0;
        
        if (!gameState.animationId) {
            gameState.animationId = requestAnimationFrame(gameLoop);
        }
    }

    // ========== MENSAJES ==========
    static showMessage(messageOverlay, messageTitle, messageText, messageStats, title, text, stats = '') {
        messageTitle.textContent = title;
        messageText.textContent = text;
        messageStats.textContent = stats;
        messageOverlay.classList.remove('hidden');
    }

    // ========== PROGRESO ==========
    static saveProgress(levelId) {
        let progress = JSON.parse(localStorage.getItem('gameProgress') || '{"completed":[], "playedThisSession":[]}');
        if (!Array.isArray(progress.completed)) {
            progress.completed = [];
        }
        
        if (!progress.completed.includes(levelId)) {
            progress.completed.push(levelId);
            progress.completed.sort((a, b) => a - b);
            localStorage.setItem('gameProgress', JSON.stringify(progress));
        }
        
        return progress;
    }

    // ========== INICIALIZACIÓN ==========
    static findPlayerStart(map) {
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                if (map[r][c] === 'P') {
                    return { row: r, col: c };
                }
            }
        }
        return { row: 0, col: 0 };
    }

    // ========== FPS COUNTER ==========
    static updateFPS(gameState, timestamp, fpsElement) {
        gameState.frameCount++;
        if (timestamp - gameState.lastFpsUpdate > 1000) {
            gameState.currentFps = Math.round(gameState.frameCount * 1000 / (timestamp - gameState.lastFpsUpdate));
            fpsElement.textContent = gameState.currentFps;
            gameState.frameCount = 0;
            gameState.lastFpsUpdate = timestamp;
        }
    }

    // ========== ZOOM AUTOMÁTICO ==========
    static adjustPlayerZoom(player, canvas) {
        try {
            const availableWidth = window.innerWidth;
            const availableHeight = window.innerHeight - 70;
            const mapPixelWidth = canvas.width;
            const mapPixelHeight = canvas.height;
            if (mapPixelWidth > 0 && mapPixelHeight > 0) {
                const fitZoom = Math.min(availableWidth / mapPixelWidth, availableHeight / mapPixelHeight) * 0.95;
                const minZoom = 1.0;
                const desiredZoom = Math.max(minZoom, fitZoom);
                if (desiredZoom > 0) {
                    player.cameraZoom = desiredZoom;
                    console.log('[GameBase] Player zoom adjusted:', desiredZoom);
                }
            }
        } catch (e) {
            console.warn('[GameBase] Failed to compute zoom:', e);
        }
    }
}

// Exportar para uso global
window.GameBase = GameBase;