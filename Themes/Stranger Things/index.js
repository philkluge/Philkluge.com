// V.1.0 Stranger Things
class StarfieldRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.embers = [];
        this.glitches = [];
        this.animationId = null;
        this.isRunning = false;
        this.lastGlitchTime = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.generateEmbers();
    }

    generateEmbers() {
        const count = Math.floor((this.canvas.width * this.canvas.height) / 7000);
        this.embers = [];

        for (let i = 0; i < count; i++) {
            this.embers.push({
                x:      Math.random() * this.canvas.width,
                y:      Math.random() * this.canvas.height,
                radius: Math.random() * 1.4 + 0.5,
                alpha:  Math.random() * 0.5 + 0.2,
                vy:     -(Math.random() * 0.15 + 0.05), // drifts upward, like rising embers
                vx:     (Math.random() - 0.5) * 0.05,
                flickerSpeed: Math.random() * 0.03 + 0.01,
                flickerPhase: Math.random() * Math.PI * 2,
                hot: Math.random() < 0.15, // occasional white-hot spark among the red embers
            });
        }
    }

    spawnGlitch() {
        // brief horizontal interference streak, like a dying signal
        this.glitches.push({
            y: Math.random() * this.canvas.height,
            alpha: 0.5,
        });
    }

    draw(timestamp) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.embers.forEach(e => {
            e.flickerPhase += e.flickerSpeed;
            const a = e.alpha * (0.55 + 0.45 * Math.sin(e.flickerPhase));

            e.y += e.vy;
            e.x += e.vx;
            if (e.y < -10) {
                e.y = this.canvas.height + 10;
                e.x = Math.random() * this.canvas.width;
            }

            ctx.fillStyle = e.hot ? `rgba(255, 210, 150, ${a})` : `rgba(224, 60, 40, ${a})`;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fill();

            if (e.radius > 1.3) {
                const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * 5);
                grad.addColorStop(0, e.hot ? `rgba(255,180,100,${a * 0.35})` : `rgba(224,19,25,${a * 0.3})`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.radius * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        if (timestamp - this.lastGlitchTime > (Math.random() * 6000 + 5000)) {
            this.spawnGlitch();
            this.lastGlitchTime = timestamp;
        }

        this.glitches = this.glitches.filter(g => g.alpha > 0.02);
        this.glitches.forEach(g => {
            ctx.fillStyle = `rgba(255,255,255,${g.alpha})`;
            ctx.fillRect(0, g.y, this.canvas.width, 1.5);
            g.alpha -= 0.04;
        });

        this.animationId = requestAnimationFrame(ts => this.draw(ts));
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animationId = requestAnimationFrame(ts => this.draw(ts));
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

class StaticEffectManager {
    constructor(config, element) {
        this.config = config;
        this.element = element;
        this.lastUpdate = 0;
        this.animationId = null;
        this.isRunning = false;

        this.canvas = document.createElement('canvas');
        this.canvas.width  = this.config.canvasSize;
        this.canvas.height = this.config.canvasSize;
        this.ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: false });
        this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    }

    generate(timestamp) {
        if (!this.isRunning) return;

        if (timestamp - this.lastUpdate > this.config.staticUpdateInterval) {
            const data = this.imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const c = Math.random() * 255;
                data[i] = c; data[i + 1] = c; data[i + 2] = c; data[i + 3] = 255;
            }
            this.ctx.putImageData(this.imageData, 0, 0);
            this.element.style.backgroundImage = `url(${this.canvas.toDataURL()})`;
            this.element.style.backgroundSize = (this.config.canvasSize / 2) + 'px ' + (this.config.canvasSize / 2) + 'px';
            this.lastUpdate = timestamp;
        }

        this.animationId = requestAnimationFrame(ts => this.generate(ts));
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animationId = requestAnimationFrame(ts => this.generate(ts));
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

class PerformanceConfig {
    constructor() {
        this.screenWidth  = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.screenArea   = this.screenWidth * this.screenHeight;
        this.isMobile  = this.screenWidth < 768;
        this.isTablet  = this.screenWidth >= 768 && this.screenWidth < 1024;
        this.isDesktop = this.screenWidth >= 1024;
        this.config = this.getConfig();
    }

    getConfig() {
        if (this.isMobile) {
            return { canvasSize: 80,  staticUpdateInterval: 180 };
        } else if (this.isTablet) {
            return { canvasSize: 150, staticUpdateInterval: 100 };
        } else {
            return { canvasSize: 300, staticUpdateInterval: 55 };
        }
    }
}

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
        let current = this.getBreakpoint(this.currentWidth);
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                const newBp = this.getBreakpoint(window.innerWidth);
                if (current !== newBp) {
                    if (this.onBreakpointChange) this.onBreakpointChange(current, newBp);
                    current = newBp;
                    location.reload();
                }
                this.currentWidth = window.innerWidth;
            }, 250);
        });
    }
}

class ProjectCardHandler {
    constructor() {
        this.grid = document.querySelector('.projects-grid');
    }

    init() {
        if (!this.grid) return;

        this.grid.addEventListener('click', e => {
            const card = e.target.closest('.project-card');
            if (!card) return;

            const projectName = card.dataset.project;

            if (e.target.classList.contains('more-btn')) {
                e.stopPropagation();
                window.location.href = `projects/${projectName}/index.html`;
                return;
            }

            if (e.target.classList.contains('github-btn')) {
                e.stopPropagation();
                window.location.href = `https://github.com/philkluge/${projectName}`;
                return;
            }

            window.location.href = `projects/${projectName}/index.html`;
        });
    }
}

class ScreenshotModal {
    constructor() {
        this.modal = null;
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'screenshot-modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close" role="button" aria-label="Close">&times;</span>
                <img class="modal-img" src="" alt="Screenshot">
            </div>`;
        document.body.appendChild(this.modal);
    }

    bindEvents() {
        document.querySelectorAll('.screenshot-item').forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img) this.open(img.src);
            });
        });

        this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', e => { if (e.target === this.modal) this.close(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) this.close();
        });
    }

    open(src) {
        this.modal.querySelector('.modal-img').src = src;
        this.modal.classList.add('active');
    }

    close() {
        this.modal.classList.remove('active');
    }
}

class App {
    constructor() {
        this.starfield = null;
        this.staticEffect = null;
        this.responsiveHandler = null;
        this.projectCardHandler = null;
        this.screenshotModal = null;
    }

    init() {
        // Embers/glitch canvas – works with #Canvas (Hauptseite) OR #starsCanvas (Projektseiten)
        const canvas = document.getElementById('Canvas') || document.getElementById('starsCanvas');
        if (canvas) {
            this.starfield = new StarfieldRenderer(canvas);
            this.starfield.start();
        }

        // CRT static noise
        const staticEl = document.getElementById('staticEl');
        if (staticEl) {
            const perfConfig = new PerformanceConfig();
            this.staticEffect = new StaticEffectManager(perfConfig.config, staticEl);
            this.staticEffect.start();
        }

        // Responsive
        this.responsiveHandler = new ResponsiveHandler((a, b) => {
            console.log(`Breakpoint: ${a} → ${b}`);
        });
        this.responsiveHandler.init();

        // Project cards (nur auf der Hauptseite vorhanden)
        this.projectCardHandler = new ProjectCardHandler();
        this.projectCardHandler.init();

        // Screenshot modal (nur auf Projektseiten vorhanden)
        if (document.querySelector('.screenshot-item')) {
            this.screenshotModal = new ScreenshotModal();
        }
    }

    destroy() {
        if (this.starfield)    this.starfield.stop();
        if (this.staticEffect) this.staticEffect.stop();
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
