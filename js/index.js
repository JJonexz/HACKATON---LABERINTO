/**
 * index.js - Efectos de partículas y controles de música
 */
document.addEventListener('DOMContentLoaded', () => {
    // Crear partículas flotantes
    function createParticles() {
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            particle.style.animationDelay = Math.random() * 5 + 's';
            particle.style.opacity = Math.random() * 0.5 + 0.2;
            document.body.appendChild(particle);
        }
    }

    createParticles();

    // Sistema de selección de modo de juego
    const modeButtons = document.querySelectorAll('.mode-button');
    let selectedPlayers = 1;

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedPlayers = parseInt(button.dataset.players);
            localStorage.setItem('gamePlayers', selectedPlayers);
        });
    });

    // Modificar la función startGame global
    window.startGame = function() {
        localStorage.setItem('gamePlayers', selectedPlayers);
        window.location.href = 'main.html';
    };

    // Sistema de música
    const bgMusic = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('music-toggle');
    const musicVolume = document.getElementById('music-volume');

    if (bgMusic && musicToggle && musicVolume) {
        let isPlaying = false;

        // Configurar volumen inicial
        bgMusic.volume = 0.6;

        musicToggle.addEventListener('click', () => {
            if (isPlaying) {
                bgMusic.pause();
                musicToggle.textContent = '▶';
                isPlaying = false;
            } else {
                bgMusic.play().catch(err => {
                    console.log('Error reproduciendo música:', err);
                });
                musicToggle.textContent = '⏸';
                isPlaying = true;
            }
        });

        musicVolume.addEventListener('input', (e) => {
            bgMusic.volume = e.target.value;
        });

        // Actualizar el botón si la música termina
        bgMusic.addEventListener('ended', () => {
            musicToggle.textContent = '▶';
            isPlaying = false;
        });
    }
});