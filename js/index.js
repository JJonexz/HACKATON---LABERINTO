// Crear partículas flotantes
for(let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particle.style.animationDelay = Math.random() * 5 + 's';
    document.body.appendChild(particle);
}

// Iniciar música de fondo después de que el DOM cargue
document.addEventListener('DOMContentLoaded', () => {
    const bgMusic = document.getElementById('bgMusic');
    if (!bgMusic) {
        console.warn('No audio element with id "bgMusic" found in DOM.');
        return;
    }

    // Logs iniciales para diagnóstico
    console.log('Audio element found:', bgMusic);
    console.log('Audio src (before):', bgMusic.src, 'children:', bgMusic.children.length);
    console.log('CanPlayType mp3:', bgMusic.canPlayType && bgMusic.canPlayType('audio/mpeg'));

    // Si no hay <source> ni src, asignar el fallback solicitado
    if (bgMusic.children.length === 0 && !bgMusic.src) {
        bgMusic.src = 'audio/suspenso.mp3';
    }

    console.log('Audio src (after):', bgMusic.src);
    console.log('Initial volume (from storage or default):', localStorage.getItem('musicVolume'));

    // Recuperar el volumen guardado o usar el valor por defecto
    const savedVolume = localStorage.getItem('musicVolume');
    bgMusic.volume = savedVolume ? parseFloat(savedVolume) : 0.6;

    // Función para reproducir la música
    const playMusic = async () => {
        console.log('Attempting to play bgMusic - paused:', bgMusic.paused, 'currentTime:', bgMusic.currentTime, 'readyState:', bgMusic.readyState);
        try {
            const p = bgMusic.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    console.log('bgMusic.play() resolved successfully');
                    updateToggleUI();
                }).catch(err => {
                    console.error('bgMusic.play() promise rejected:', err);
                });
            } else {
                // Some browsers return undefined
                console.log('bgMusic.play() returned:', p);
                updateToggleUI();
            }
        } catch (error) {
            console.error('Reproducción fallida (catch):', error);
        }
    };

    // Intentar reproducir inmediatamente
    playMusic();

    // Intentar reproducir con cualquier interacción del usuario
    const startAudioOnInteraction = () => {
        console.log('User interaction detected to start audio. paused:', bgMusic.paused);
        if (bgMusic.paused) {
            playMusic();
        } else {
            console.log('Audio already playing on interaction');
        }
        document.removeEventListener('click', startAudioOnInteraction);
        document.removeEventListener('touchstart', startAudioOnInteraction);
        document.removeEventListener('keydown', startAudioOnInteraction);
    };

    document.addEventListener('click', startAudioOnInteraction);
    document.addEventListener('touchstart', startAudioOnInteraction);
    document.addEventListener('keydown', startAudioOnInteraction);

    // Controles visibles
    const musicToggle = document.getElementById('music-toggle');
    const musicVolume = document.getElementById('music-volume');

    // Eventos del audio para diagnóstico
    bgMusic.addEventListener('play', () => console.log('event: play'));
    bgMusic.addEventListener('pause', () => console.log('event: pause'));
    bgMusic.addEventListener('error', (e) => console.error('event: error', e, bgMusic.error));
    bgMusic.addEventListener('canplay', () => console.log('event: canplay, readyState=', bgMusic.readyState));
    bgMusic.addEventListener('canplaythrough', () => console.log('event: canplaythrough, readyState=', bgMusic.readyState));
    bgMusic.addEventListener('loadedmetadata', () => console.log('event: loadedmetadata, duration=', bgMusic.duration));
    bgMusic.addEventListener('stalled', () => console.warn('event: stalled'));

    // Estado inicial de volumen desde localStorage
    if (musicVolume) {
        const storedVolume = parseFloat(localStorage.getItem('musicVolume'));
        if (!isNaN(storedVolume)) {
            bgMusic.volume = Math.max(0, Math.min(1, storedVolume));
        } else {
            bgMusic.volume = parseFloat(musicVolume.value) || 0.6;
        }
        musicVolume.value = bgMusic.volume;
    }

    function updateToggleUI() {
        if (!musicToggle) return;
        if (bgMusic.paused) {
            musicToggle.textContent = '▶';
            musicToggle.classList.add('paused');
            musicToggle.setAttribute('aria-label', 'Reproducir música');
        } else {
            musicToggle.textContent = '⏸';
            musicToggle.classList.remove('paused');
            musicToggle.setAttribute('aria-label', 'Pausar música');
        }
    }

    // Intentar reproducir al primer click general (política de autoplay), pero no forzamos si falla
    const tryPlayOnce = () => {
        bgMusic.play().then(() => {
            updateToggleUI();
        }).catch(e => {
            // No podemos reproducir (autoplay/permiso) — el usuario puede usar el botón
            console.log('Audio autoplay blocked or failed:', e);
        });
    };
    document.addEventListener('click', tryPlayOnce, { once: true });

    // Botón de play/pause
    if (musicToggle) {
        musicToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bgMusic.paused) {
                bgMusic.play().catch(err => console.log('Play failed:', err));
            } else {
                bgMusic.pause();
            }
            updateToggleUI();
        });
    }

    // Slider de volumen
    if (musicVolume) {
        musicVolume.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            bgMusic.volume = v;
            localStorage.setItem('musicVolume', String(v));
        });
    }

    // Actualizar UI cuando cambie el estado de reproducción
    bgMusic.addEventListener('play', updateToggleUI);
    bgMusic.addEventListener('pause', updateToggleUI);
    bgMusic.addEventListener('ended', updateToggleUI);

    // Inicializar UI
    updateToggleUI();
});

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
document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.querySelector('.play-button');
    if (playButton) {
        playButton.addEventListener('mouseenter', () => {
            playButton.style.filter = 'brightness(1.2)';
        });

        playButton.addEventListener('mouseleave', () => {
            playButton.style.filter = 'brightness(1)';
        });
    } else {
        console.warn('play-button element not found when adding hover effects');
    }
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