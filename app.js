// V.5.1
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
        this.activeParticles = new Set();
        this.intervalId = null;
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
        this.activeParticles.add(particle);
        
        const timeoutId = setTimeout(() => {
            this.removeParticle(particle);
        }, duration * 1000);
        
        particle.dataset.timeoutId = timeoutId;
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
        if (!this.activeParticles.has(particle)) return;
        
        if (particle.dataset.timeoutId) {
            clearTimeout(parseInt(particle.dataset.timeoutId));
            delete particle.dataset.timeoutId;
        }
        
        if (particle.parentNode) {
            particle.remove();
            this.particlePool.push(particle);
        }
        
        this.activeParticles.delete(particle);
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
            this.activeParticles.add(particle);
            
            const timeoutId = setTimeout(() => {
                this.removeParticle(particle);
                this.createParticle();
            }, (duration + randomDelay) * 1000);
            
            particle.dataset.timeoutId = timeoutId;
        }
    }
    
    maintainFlow() {
        this.intervalId = setInterval(() => {
            if (this.particleCount < this.config.maxParticles) {
                this.createParticle();
            }
        }, this.config.particleInterval);
    }
    
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.activeParticles.forEach(particle => {
            if (particle.dataset.timeoutId) {
                clearTimeout(parseInt(particle.dataset.timeoutId));
            }
            if (particle.parentNode) {
                particle.remove();
            }
        });
        
        this.activeParticles.clear();
        this.particlePool = [];
        this.particleCount = 0;
    }
}

class LightStringManager {
    constructor(config, container) {
        this.config = config;
        this.container = container;
        this.strings = [];
    }
    
    create() {
        for (let i = 0; i < this.config.stringCount; i++) {
            const lightString = document.createElement('div');
            lightString.className = 'light-string';
            lightString.style.top = (i * 12 + 5) + '%';
            lightString.style.animationDelay = (i * 0.3) + 's';
            this.container.appendChild(lightString);
            this.strings.push(lightString);
        }
    }
    
    destroy() {
        this.strings.forEach(string => {
            if (string.parentNode) {
                string.remove();
            }
        });
        this.strings = [];
    }
}

// Static
class StaticEffectManager {
    constructor(config, element) {
        this.config = config;
        this.element = element;
        this.lastUpdate = 0;
        this.animationId = null;
        this.isRunning = false;
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.config.canvasSize;
        this.canvas.height = this.config.canvasSize;
        this.ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: false });
        
        this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    }
    
    generate(timestamp) {
        if (!this.isRunning) return;
        
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
        
        this.animationId = requestAnimationFrame((ts) => this.generate(ts));
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animationId = requestAnimationFrame((ts) => this.generate(ts));
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

//Window Resize
class ResponsiveHandler {
    constructor(onBreakpointChange) {
        this.currentWidth = window.innerWidth;
        this.resizeTimeout = null;
        this.onBreakpointChange = onBreakpointChange;
    }
    
    getBreakpoint(width) {
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }
    
    init() {
        let currentBreakpoint = this.getBreakpoint(this.currentWidth);
        
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                const newWidth = window.innerWidth;
                const newBreakpoint = this.getBreakpoint(newWidth);
                
                if (currentBreakpoint !== newBreakpoint) {
                    if (this.onBreakpointChange) {
                        this.onBreakpointChange(currentBreakpoint, newBreakpoint);
                    }
                    currentBreakpoint = newBreakpoint;
                    location.reload();
                }
                
                this.currentWidth = newWidth;
            }, 250);
        });
    }
}

class LightColorManager {
    constructor() {
        this.colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        this.intervalId = null;
    }
    
    start() {
        this.intervalId = setInterval(() => {
            const lights = document.querySelectorAll('.light-string');
            lights.forEach(light => {
                if (Math.random() > 0.7) {
                    const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
                    light.style.background = `linear-gradient(90deg, transparent 0%, ${randomColor}33 20%, ${randomColor}66 40%, ${randomColor}33 60%, transparent 100%)`;
                }
            });
        }, 2000);
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

// Projekt-Handler
class ProjectCardHandler {
    constructor() {
        this.projectsContainer = document.querySelector('.projects-grid');
    }
    
    init() {
        if (!this.projectsContainer) return;

        this.projectsContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.project-card');
            if (!card) return;
            
            const projectName = card.dataset.project;
            const downloadPath = card.dataset.download;

            if (e.target.classList.contains('more-btn')) {
                e.stopPropagation();
                window.location.href = `projects/${projectName}/index.html`;
                return;
            }

            if (e.target.classList.contains('download-btn') || 
                e.target.classList.contains('documentation-btn')) {
                e.stopPropagation();
                this.downloadFile(downloadPath);
                return;
            }
            
            window.location.href = `projects/${projectName}/index.html`;
        });
    }
    
    downloadFile(path) {
        const link = document.createElement('a');
        link.href = path;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

class App {
    constructor() {
        this.perfConfig = null;
        this.particleManager = null;
        this.lightStringManager = null;
        this.staticEffectManager = null;
        this.lightColorManager = null;
        this.responsiveHandler = null;
        this.projectCardHandler = null;
    }
    
    init() {
        this.perfConfig = new PerformanceConfig();
        const config = this.perfConfig.config;
        
        const lightsContainer = document.getElementById('lightsContainer');
        if (lightsContainer) {
            this.lightStringManager = new LightStringManager(config, lightsContainer);
            this.lightStringManager.create();
            this.particleManager = new ParticleManager(config, lightsContainer);
            this.particleManager.initParticles();
            this.particleManager.maintainFlow();
        }
        
        const staticEl = document.getElementById('staticEl');
        if (staticEl) {
            this.staticEffectManager = new StaticEffectManager(config, staticEl);
            this.staticEffectManager.start();
        }

        this.lightColorManager = new LightColorManager();
        this.lightColorManager.start();

        this.responsiveHandler = new ResponsiveHandler((oldBp, newBp) => {
            console.log(`Breakpoint changed from ${oldBp} to ${newBp}`);
        });
        this.responsiveHandler.init();

        this.projectCardHandler = new ProjectCardHandler();
        this.projectCardHandler.init();
    }
    
    destroy() {
        if (this.particleManager) this.particleManager.destroy();
        if (this.lightStringManager) this.lightStringManager.destroy();
        if (this.staticEffectManager) this.staticEffectManager.stop();
        if (this.lightColorManager) this.lightColorManager.stop();
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    app.init();
});

window.addEventListener('beforeunload', () => {
    if (app) app.destroy();
});