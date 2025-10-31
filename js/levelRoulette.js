class LevelRoulette {
    constructor() {
        this.container = document.getElementById('level-roulette-container');
        this.roulette = document.getElementById('level-roulette');
        this.levels = [
            { id: 1, name: 'Laberinto Las Toninas', difficulty: 'easy', preview: this.createPreview(1) },
            { id: 2, name: 'Santa Teresita', difficulty: 'medium', preview: this.createPreview(2) },
            { id: 3, name: 'Villa Clelia', difficulty: 'hard', preview: this.createPreview(3) }
        ];
        this.selectedLevel = null;
        this.isSpinning = false;
    }

    createPreview(levelId) {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        
        // Obtener el mapa correcto según el nivel
        const map = this.getLevelMap(levelId);
        this.drawMapPreview(ctx, map);
        
        return canvas;
    }

    getLevelMap(levelId) {
        // Mapas simplificados para las previsualizaciones
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

    createCard(level) {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.dataset.levelId = level.id;

        const title = document.createElement('div');
        title.className = 'level-card-title';
        title.textContent = level.name;

        const preview = document.createElement('div');
        preview.className = 'level-card-preview';
        preview.appendChild(level.preview);

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
        // Duplicar los niveles para crear el efecto de ruleta infinita
        const allLevels = [...this.levels, ...this.levels, ...this.levels];
        allLevels.forEach(level => {
            this.roulette.appendChild(this.createCard(level));
        });
    }

    show() {
        this.container.classList.remove('hidden');
        if (this.roulette.children.length === 0) {
            this.populateRoulette();
        }
    }

    hide() {
        this.container.classList.add('hidden');
    }

    spin() {
        if (this.isSpinning) return;
        this.isSpinning = true;

        // Elegir un nivel aleatorio
        const randomIndex = Math.floor(Math.random() * this.levels.length);
        this.selectedLevel = this.levels[randomIndex];

        // Calcular la posición final para centrar el nivel seleccionado
        const cardWidth = 270; // ancho de la tarjeta + gap
        const centerOffset = (this.container.offsetWidth - cardWidth) / 2;
        const targetOffset = -(cardWidth * (this.levels.length + randomIndex)) + centerOffset;

        // Aplicar la animación
        this.roulette.style.transform = `translateX(${targetOffset}px)`;

        // Esperar a que termine la animación
        setTimeout(() => {
            const cards = this.roulette.getElementsByClassName('level-card');
            Array.from(cards).forEach(card => {
                card.classList.remove('selected');
                if (card.dataset.levelId === this.selectedLevel.id.toString()) {
                    card.classList.add('selected');
                }
            });
            this.isSpinning = false;
            
            // Disparar evento de selección
            const event = new CustomEvent('levelSelected', {
                detail: { levelId: this.selectedLevel.id }
            });
            this.container.dispatchEvent(event);
        }, 3000);
    }
}

// Exportar la clase para usarla en main.js
window.LevelRoulette = LevelRoulette;