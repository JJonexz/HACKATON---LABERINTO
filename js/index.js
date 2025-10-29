// Crear partículas flotantes
for(let i = 0; i < 30; i++) {
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
    // Efecto de transición mejorado
    document.body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    document.body.style.opacity = '0';
    document.body.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        window.location.href = 'main.html';
    }, 500);
}

// Efecto de sonido hover en el botón
const playButton = document.querySelector('.play-button');
playButton.addEventListener('mouseenter', () => {
    playButton.style.filter = 'brightness(1.2)';
});

playButton.addEventListener('mouseleave', () => {
    playButton.style.filter = 'brightness(1)';
});

// Efecto de tecla Enter para iniciar
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        startGame();
    }
});

// Animación de aparición de características
document.addEventListener('DOMContentLoaded', () => {
    const features = document.querySelectorAll('.feature-item');
    features.forEach((feature, index) => {
        feature.style.opacity = '0';
        feature.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            feature.style.transition = 'all 0.5s ease';
            feature.style.opacity = '0.8';
            feature.style.transform = 'translateX(0)';
        }, 2000 + (index * 200));
    });
});