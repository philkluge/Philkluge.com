// Performance-Konfiguration basierend auf Gerät
class PerformanceConfig {
    constructor() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.screenArea = this.screenWidth * this.screenHeight;
        this.isMobile = this.screenWidth < 768;
        this.isTablet = this.screenWidth >= 768 && this.screenWidth < 1024;
        this.isDesktop = this.screenWidth >= 1024;
        
        this.config = this.getConfig();
    }
    
    getConfig() {
        if (this.isMobile) {
            return {
                maxParticles: Math.max(8, Math.floor(this.screenArea / 80000)),
                particleInterval: 600,
                stringCount: 3,
                canvasSize: 80,
                staticUpdateInterval: 200,
                particleSize: { min: 3, max: 6 }
            };
        } else if (this.isTablet) {
            return {
                maxParticles: Math.max(12, Math.floor(this.screenArea / 50000)),
                particleInterval: 400,
                stringCount: 5,
                canvasSize: 150,
                staticUpdateInterval: 100,
                particleSize: { min: 4, max: 7 }
            };
        } else {
            return {
                maxParticles: Math.max(20, Math.floor(this.screenArea / 40000)),
                particleInterval: 150,
                stringCount: 8,
                canvasSize: 300,
                staticUpdateInterval: 50,
                particleSize: { min: 4, max: 8 }
            };
        }
    }
}

// Partikel-Manager
class ParticleManager {
    constructor(config, container) {
        this.config = config;
        this.container = container;
        this.particleCount = 0;
        this.particlePool = [];
    }
    
    createParticle() {
        if (this.particleCount >= this.config.maxParticles) return;
        
        let particle = this.particlePool.pop();
        if (!particle) {
            particle = document.createElement('div');
            particle.className = 'floating-particle';
        }
        
        const size = Math.random() * (this.config.particleSize.max - this.config.particleSize.min) + this.config.particleSize.min;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.bottom = '-20px';
        
        const duration = Math.random() * 8 + 12;
        particle.style.animationDuration = duration + 's';
        particle.style.animationDelay = '0s';
        
        this.setDriftValues(particle);
        
        this.particleCount++;
        this.container.appendChild(particle);
        
        setTimeout(() => {
            this.removeParticle(particle);
        }, duration * 1000);
    }
    
    setDriftValues(particle) {
        const driftMultiplier = this.config.particleSize.max <= 6 ? 0.6 : 1;
        const drifts = [80, 120, 100, 150, 90, 130];
        
        drifts.forEach((drift, index) => {
            const value = (Math.random() - 0.5) * drift * driftMultiplier + 'px';
            particle.style.setProperty(`--drift-${index + 1}`, value);
        });
    }
    
    removeParticle(particle) {
        if (particle.parentNode) {
            particle.remove();
            this.particlePool.push(particle);
        }
        this.particleCount--;
    }
    
    initParticles() {
        for (let i = 0; i < this.config.maxParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            
            const size = Math.random() * (this.config.particleSize.max - this.config.particleSize.min) + this.config.particleSize.min;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.bottom = '-20px';
            
            const duration = Math.random() * 8 + 12;
            particle.style.animationDuration = duration + 's';
            
            const randomDelay = -Math.random() * duration;
            particle.style.animationDelay = randomDelay + 's';
            
            this.setDriftValues(particle);
            
            this.container.appendChild(particle);
            this.particleCount++;
            
            setTimeout(() => {
                this.removeParticle(particle);
                this.createParticle();
            }, (duration + randomDelay) * 1000);
        }
    }
    
    maintainFlow() {
        if (this.particleCount < this.config.maxParticles) {
            this.createParticle();
        }
        setTimeout(() => this.maintainFlow(), this.config.particleInterval);
    }
}

// Lichterketten-Manager
class LightStringManager {
    constructor(config, container) {
        this.config = config;
        this.container = container;
    }
    
    create() {
        for (let i = 0; i < this.config.stringCount; i++) {
            const lightString = document.createElement('div');
            lightString.className = 'light-string';
            lightString.style.top = (i * 12 + 5) + '%';
            lightString.style.animationDelay = (i * 0.3) + 's';
            this.container.appendChild(lightString);
        }
    }
}

// Static-Effekt Manager
class StaticEffectManager {
    constructor(config, element) {
        this.config = config;
        this.element = element;
        this.lastUpdate = 0;
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.config.canvasSize;
        this.canvas.height = this.config.canvasSize;
        this.ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: false });
        
        this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    }
    
    generate(timestamp) {
        if (timestamp - this.lastUpdate > this.config.staticUpdateInterval) {
            const data = this.imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const color = Math.random() * 255;
                data[i] = color;
                data[i + 1] = color;
                data[i + 2] = color;
                data[i + 3] = 255;
            }
            
            this.ctx.putImageData(this.imageData, 0, 0);
            this.element.style.backgroundImage = `url(${this.canvas.toDataURL()})`;
            this.element.style.backgroundSize = (this.config.canvasSize / 2) + 'px ' + (this.config.canvasSize / 2) + 'px';
            
            this.lastUpdate = timestamp;
        }
        
        requestAnimationFrame((ts) => this.generate(ts));
    }
    
    start() {
        requestAnimationFrame((ts) => this.generate(ts));
    }
}

// Responsive Handler für Window Resize
class ResponsiveHandler {
    constructor() {
        this.currentWidth = window.innerWidth;
        this.resizeTimeout = null;
    }
    
    init() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                const newWidth = window.innerWidth;
                
                // Nur neu laden wenn zwischen Mobile/Tablet/Desktop gewechselt wurde
                if ((this.currentWidth < 768 && newWidth >= 768) ||
                    (this.currentWidth >= 768 && newWidth < 768) ||
                    (this.currentWidth < 1024 && newWidth >= 1024) ||
                    (this.currentWidth >= 1024 && newWidth < 1024)) {
                    location.reload();
                }
            }, 250);
        });
    }
}

// Screenshot Modal
class ScreenshotModal {
    constructor() {
        this.modal = null;
        this.createModal();
        this.init();
    }
    
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'screenshot-modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <img class="modal-img" src="" alt="Screenshot">
            </div>
        `;
        document.body.appendChild(this.modal);
    }
    
    init() {
        // Screenshot-Klick Handler
        document.querySelectorAll('.screenshot-item').forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img) {
                    this.open(img.src);
                }
            });
        });
        
        // Modal schließen
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // ESC Taste zum Schließen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }
    
    open(src) {
        const img = this.modal.querySelector('.modal-img');
        if (img) {
            img.src = src;
            this.modal.classList.add('active');
        }
    }
    
    close() {
        this.modal.classList.remove('active');
    }
}

// Haupt-Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    const perfConfig = new PerformanceConfig();
    const config = perfConfig.config;
    
    // Lichterketten erstellen
    const lightsContainer = document.getElementById('lightsContainer');
    if (lightsContainer) {
        const lightStringManager = new LightStringManager(config, lightsContainer);
        lightStringManager.create();
        
        // Partikel-System starten
        const particleManager = new ParticleManager(config, lightsContainer);
        particleManager.initParticles();
        particleManager.maintainFlow();
    }
    
    // Static-Effekt starten
    const staticEl = document.getElementById('staticEl');
    if (staticEl) {
        const staticEffectManager = new StaticEffectManager(config, staticEl);
        staticEffectManager.start();
    }
    
    // Responsive Handler initialisieren
    const responsiveHandler = new ResponsiveHandler();
    responsiveHandler.init();
    
    // Screenshot Modal initialisieren
    const screenshotModal = new ScreenshotModal();
    
    // Random light color changes
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    setInterval(() => {
        const lights = document.querySelectorAll('.light-string');
        lights.forEach(light => {
            if (Math.random() > 0.7) {
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                light.style.background = `linear-gradient(90deg, transparent 0%, ${randomColor}33 20%, ${randomColor}66 40%, ${randomColor}33 60%, transparent 100%)`;
            }
        });
    }, 2000);
});