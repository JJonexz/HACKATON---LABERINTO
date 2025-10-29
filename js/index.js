/* partículas */
for(let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particle.style.animationDelay = Math.random() * 5 + 's';
    document.body.appendChild(particle);
}

    // Iniciar música de fondo
    const bgMusic = document.getElementById('bgMusic');
    
    // Intentar reproducir la música automáticamente solo si tiene source válido
    if (bgMusic.children.length > 0) {
        document.addEventListener('click', function() {
            bgMusic.play().catch(e => console.log('Audio playback failed:', e));
        }, { once: true });
    }

    function startGame() {
        // Efecto de transición
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            // Aquí redirige a tu página de juego
            window.location.href = 'map1.html';
        }, 500);
    }

    // Efecto de sonido hover en el botón (opcional)
    const playButton = document.querySelector('.play-button');
    playButton.addEventListener('mouseenter', () => {
        // Aquí podrías agregar un efecto de sonido de hover
    });