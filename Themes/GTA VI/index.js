// V.1.0 GTA VI
class StarfieldRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.animationId = null;
        this.isRunning = false;
        this.lastShootingStarTime = 0;
        this.gridOffset = 0;
 
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
 
    resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.generateStars();
    }
 
    generateStars() {
        // "Stars" werden hier zu sehr dezenten treibenden Partikeln umfunktioniert
        const count = Math.floor((this.canvas.width * this.canvas.height) / 9000);
        this.stars = [];
 
        for (let i = 0; i < count; i++) {
            const size = Math.random();
            this.stars.push({
                x:         Math.random() * this.canvas.width,
                y:         Math.random() * this.canvas.height,
                radius:    size < 0.7 ? Math.random() * 0.6 + 0.2
                         : size < 0.95 ? Math.random() * 0.9 + 0.5
                         :               Math.random() * 1.3 + 0.8,
                alpha:     Math.random() * 0.25 + 0.08,
                twinkleSpeed: Math.random() * 0.012 + 0.002,
                twinklePhase: Math.random() * Math.PI * 2,
                // dezentes Violett, leichter Magenta-Einschlag
                hue: Math.random() < 0.6 ? 270 : 290,
                sat: Math.floor(Math.random() * 25 + 25),
            });
        }
    }
 
    spawnShootingStar() {
        // Sehr seltene, dezente Lichtstreifen
        const startX = -50;
        const startY = this.canvas.height * (0.15 + Math.random() * 0.5);
        const speed  = Math.random() * 6 + 5;
        const length = Math.random() * 100 + 60;
 
        this.shootingStars.push({
            x: startX, y: startY,
            vx: speed,
            vy: 0,
            length,
            alpha: 0.5,
            trail: [],
        });
    }
 
    draw(timestamp) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
 
        // ── sehr dezenter Lichtschein, kein dominanter Sonnenkörper ──
        const glowCx = w * 0.5;
        const glowCy = h * 0.95;
        const glowR  = Math.min(w, h) * 0.55;
        const glowGrad = ctx.createRadialGradient(glowCx, glowCy, 0, glowCx, glowCy, glowR);
        glowGrad.addColorStop(0,   'rgba(176, 61, 214, 0.07)');
        glowGrad.addColorStop(0.6, 'rgba(109, 92, 224, 0.04)');
        glowGrad.addColorStop(1,   'rgba(109, 92, 224, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(glowCx, glowCy, glowR, 0, Math.PI * 2);
        ctx.fill();
 
        // ── treibende, kaum sichtbare Partikel ──
        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            const a = star.alpha * (0.6 + 0.4 * Math.sin(star.twinklePhase));
 
            ctx.fillStyle = `hsla(${star.hue},${star.sat}%,75%,${a})`;
 
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        });
 
        // ── spawn (sehr selten) ──
        if (timestamp - this.lastShootingStarTime > (Math.random() * 9000 + 9000)) {
            this.spawnShootingStar();
            this.lastShootingStarTime = timestamp;
        }
 
        // ── dezente Lichtstreifen ──
        this.shootingStars = this.shootingStars.filter(s => s.alpha > 0.01 && s.x < w + 100);
 
        this.shootingStars.forEach(s => {
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > 16) s.trail.shift();
 
            s.x += s.vx;
            s.y += s.vy;
            if (s.trail.length > 12) s.alpha -= 0.008;
 
            // trail
            if (s.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(s.trail[0].x, s.trail[0].y);
                for (let i = 1; i < s.trail.length; i++) {
                    ctx.lineTo(s.trail[i].x, s.trail[i].y);
                }
                const grad = ctx.createLinearGradient(
                    s.trail[0].x, s.trail[0].y,
                    s.x, s.y
                );
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(0.4, `rgba(176, 61, 214,${s.alpha * 0.2})`);
                grad.addColorStop(1, `rgba(220, 210, 245,${s.alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
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
            // Sehr dezentes Rauschen, leicht violett getönt
            const data = this.imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const c = Math.random() * 255;
                data[i]   = c * 0.92;                   // R
                data[i+1] = c * 0.85;                   // G
                data[i+2] = c;                            // B (leicht kühler/violetter)
                data[i+3] = 255;
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
            return { canvasSize: 80,  staticUpdateInterval: 200 };
        } else if (this.isTablet) {
            return { canvasSize: 150, staticUpdateInterval: 120 };
        } else {
            return { canvasSize: 300, staticUpdateInterval: 60 };
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
 
            const projectName  = card.dataset.project;
            const downloadPath = card.dataset.download;
 
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
 
    downloadFile(path) {
        const a = document.createElement('a');
        a.href = path;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
        // Starfield – funktioniert mit #Canvas (Hauptseite) ODER #starsCanvas (Projektseiten)
        const canvas = document.getElementById('Canvas') || document.getElementById('starsCanvas');
        if (canvas) {
            this.starfield = new StarfieldRenderer(canvas);
            this.starfield.start();
        }
 
        // Static noise
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
