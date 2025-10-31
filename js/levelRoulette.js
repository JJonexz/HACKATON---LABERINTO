class LevelRoulette {
    constructor() {
        this.container = document.getElementById('level-roulette-container');
        this.roulette = document.getElementById('level-roulette');
        this.levels = [
            { id: 1, name: 'Laberinto Las Toninas', difficulty: 'easy', preview: null },
            { id: 2, name: 'Santa Teresita', difficulty: 'medium', preview: null },
            { id: 3, name: 'Villa Clelia', difficulty: 'hard', preview: null }
        ];
        this.selectedLevel = null;
        this.isSpinning = false;
        this.availableLevelIds = []; // Solo IDs de niveles disponibles
        
        // Generar previews al inicio
        this.levels.forEach(level => {
            level.preview = this.createPreview(level.id);
        });
        
        console.log('[ROULETTE] Constructor inicializado');
    }

    createPreview(levelId) {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        
        const map = this.getLevelMap(levelId);
        this.drawMapPreview(ctx, map);
        
        return canvas;
    }

    getLevelMap(levelId) {
        const maps = {
            1: [
                "WWWWWWWWWW",
                "WP       W",
                "W WWWWW  W",
                "W     W  W",
                "W WWW    W",
                "W   WWWWW",
                "WWW      W",
                "W     W  W",
                "W WWW   EW",
                "WWWWWWWWWW"
            ],
            2: [
                "WWWWWWWWWW",
                "WP  T    W",
                "W WWWWW  W",
                "W     W  W",
                "W WWW C  W",
                "W   WWWWW",
                "WWW  L   W",
                "W     W  W",
                "W WWW   EW",
                "WWWWWWWWWW"
            ],
            3: [
                "WWWWWWWWWW",
                "WP  A    W",
                "W WWWWW  W",
                "W  B  W  W",
                "W WWW    W",
                "W   WWWWW",
                "WWW  C   W",
                "W     W  W",
                "W WWW   EW",
                "WWWWWWWWWW"
            ]
        };
        return maps[levelId];
    }

    drawMapPreview(ctx, map) {
        const cellSize = Math.min(
            ctx.canvas.width / map[0].length,
            ctx.canvas.height / map.length
        );

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const offsetX = (ctx.canvas.width - cellSize * map[0].length) / 2;
        const offsetY = (ctx.canvas.height - cellSize * map.length) / 2;

        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[0].length; col++) {
                const x = offsetX + col * cellSize;
                const y = offsetY + row * cellSize;
                const cell = map[row][col];

                switch (cell) {
                    case 'W':
                        ctx.fillStyle = '#300';
                        ctx.fillRect(x, y, cellSize, cellSize);
                        break;
                    case 'P':
                        ctx.fillStyle = '#0f0';
                        ctx.beginPath();
                        ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/3, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 'E':
                        ctx.fillStyle = '#f00';
                        ctx.fillRect(x, y, cellSize, cellSize);
                        break;
                    case 'T':
                    case 'L':
                    case 'C':
                    case 'A':
                    case 'B':
                        ctx.fillStyle = '#ff0';
                        ctx.beginPath();
                        ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/4, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                }
            }
        }
    }

    createCard(level, isAvailable) {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.dataset.levelId = level.id;
        card.dataset.available = isAvailable ? 'true' : 'false';

        // Si no está disponible, agregar overlay de "ya jugado"
        if (!isAvailable) {
            card.style.opacity = '0.5';
            card.style.filter = 'grayscale(1)';
        }

        const title = document.createElement('div');
        title.className = 'level-card-title';
        title.textContent = level.name;

        const preview = document.createElement('div');
        preview.className = 'level-card-preview';
        
        if (level.preview) {
            preview.appendChild(level.preview.cloneNode(true));
        }

        // Si no está disponible, agregar marca de "completado"
        if (!isAvailable) {
            const completedMark = document.createElement('div');
            completedMark.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:3rem;color:#ff0000;text-shadow:0 0 10px #ff0000;';
            completedMark.textContent = '✓';
            preview.style.position = 'relative';
            preview.appendChild(completedMark);
        }

        const difficulty = document.createElement('div');
        difficulty.className = `level-difficulty difficulty-${level.difficulty}`;
        difficulty.textContent = this.getDifficultyText(level.difficulty);

        card.appendChild(title);
        card.appendChild(preview);
        card.appendChild(difficulty);

        return card;
    }

    getDifficultyText(difficulty) {
        const texts = {
            easy: 'FÁCIL',
            medium: 'MEDIO',
            hard: 'DIFÍCIL'
        };
        return texts[difficulty];
    }

    populateRoulette() {
        console.log('[ROULETTE] Populando ruleta...');
        console.log('[ROULETTE] IDs disponibles:', this.availableLevelIds);
        this.roulette.innerHTML = '';
        
        // SIEMPRE mostrar TODOS los niveles (1, 2, 3)
        // Pero marcar cuáles están disponibles
        const allLevelsWithStatus = this.levels.map(level => ({
            ...level,
            available: this.availableLevelIds.includes(level.id)
        }));
        
        console.log('[ROULETTE] Niveles con estado:', allLevelsWithStatus.map(l => `${l.name}(${l.available ? 'DISPONIBLE' : 'JUGADO'})`));
        
        // Crear solo las 3 cartas necesarias
        allLevelsWithStatus.forEach((levelWithStatus, index) => {
            const card = this.createCard(levelWithStatus, levelWithStatus.available);
            card.dataset.index = index;
            this.roulette.appendChild(card);
        });
        
        // Resetear posición inicial - centrar la ruleta
        this.roulette.style.transition = 'none';
        this.roulette.style.transform = 'translate(-50%, -50%)';
        
        console.log('[ROULETTE] Total de cartas:', this.roulette.children.length);
    }

    setAvailableLevels(availableLevelsFromMain) {
        // Guardar solo los IDs de los niveles disponibles
        this.availableLevelIds = availableLevelsFromMain.map(l => l.id);
        console.log('[ROULETTE] IDs de niveles disponibles:', this.availableLevelIds);
    }

    show() {
        console.log('[ROULETTE] Mostrando ruleta...');
        this.container.classList.remove('hidden');
        this.populateRoulette();
    }

    hide() {
        console.log('[ROULETTE] Ocultando ruleta...');
        this.container.classList.add('hidden');
        this.isSpinning = false;
    }

    spin() {
        if (this.isSpinning) {
            console.log('[ROULETTE] Ya está girando, ignorando...');
            return;
        }
        
        if (this.availableLevelIds.length === 0) {
            console.error('[ROULETTE] No hay niveles disponibles para seleccionar');
            return;
        }
        
        console.log('[ROULETTE] Iniciando spin...');
        this.isSpinning = true;

        // Seleccionar SOLO de los niveles disponibles
        const randomIndex = Math.floor(Math.random() * this.availableLevelIds.length);
        const selectedId = this.availableLevelIds[randomIndex];
        this.selectedLevel = this.levels.find(l => l.id === selectedId);
        
        console.log('[ROULETTE] Nivel seleccionado:', this.selectedLevel.name, '(ID:', this.selectedLevel.id, ')');

        // Encontrar el índice real en el array de 3 niveles
        const targetIndex = this.levels.findIndex(l => l.id === selectedId);
        
        // Calcular desplazamiento para centrar la carta seleccionada
        const cardWidth = 250; // Ancho de cada carta
        const gap = 20; // Espacio entre cartas
        const containerWidth = this.container.offsetWidth;
        
        // Posición de la carta objetivo relativa al centro
        const targetCardCenter = (targetIndex * (cardWidth + gap)) + (cardWidth / 2);
        const containerCenter = containerWidth / 2;
        
        // Desplazamiento necesario para centrar la carta objetivo
        const offset = targetCardCenter - containerCenter;
        
        console.log('[ROULETTE] Target index:', targetIndex, 'Offset:', offset);

        // Aplicar animación
        this.roulette.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        this.roulette.style.transform = `translate(calc(-50% - ${offset}px), -50%)`;

        // Después de la animación
        setTimeout(() => {
            console.log('[ROULETTE] Animación completada');
            
            // Marcar carta seleccionada
            const cards = Array.from(this.roulette.getElementsByClassName('level-card'));
            cards.forEach((card, index) => {
                card.classList.remove('selected');
                if (index === targetIndex) {
                    card.classList.add('selected');
                    console.log('[ROULETTE] Carta marcada - Índice:', index);
                }
            });
            
            this.isSpinning = false;
            
            // Emitir evento
            const event = new CustomEvent('levelSelected', {
                detail: { 
                    levelId: this.selectedLevel.id,
                    levelData: this.selectedLevel
                }
            });
            this.container.dispatchEvent(event);
            console.log('[ROULETTE] Evento emitido - ID:', this.selectedLevel.id);
            
        }, 3100);
    }
}

window.LevelRoulette = LevelRoulette;