// V.6.0 Space Theme

// ──────────────────────────────────────────
// Stars Canvas – particle starfield + shooting stars
// ──────────────────────────────────────────
class StarfieldRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.animationId = null;
        this.isRunning = false;
        this.lastShootingStarTime = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.generateStars();
    }

    generateStars() {
        const count = Math.floor((this.canvas.width * this.canvas.height) / 3500);
        this.stars = [];

        for (let i = 0; i < count; i++) {
            const size = Math.random();
            this.stars.push({
                x:         Math.random() * this.canvas.width,
                y:         Math.random() * this.canvas.height,
                radius:    size < 0.6 ? Math.random() * 0.8 + 0.2
                         : size < 0.9 ? Math.random() * 1.2 + 0.6
                         :              Math.random() * 2 + 1.2,
                alpha:     Math.random() * 0.6 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.003,
                twinklePhase: Math.random() * Math.PI * 2,
                // slight color tint – white / blue / purple
                hue: Math.random() < 0.5 ? 0
                   : Math.random() < 0.5 ? 220   // blue
                   :                       270,   // purple
                sat: Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 40 + 30),
            });
        }
    }

    spawnShootingStar() {
        const startX = Math.random() * this.canvas.width * 0.7;
        const startY = Math.random() * this.canvas.height * 0.4;
        const angle  = (Math.random() * 20 + 20) * (Math.PI / 180); // 20-40°
        const speed  = Math.random() * 8 + 6;
        const length = Math.random() * 150 + 80;

        this.shootingStars.push({
            x: startX, y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            length,
            alpha: 1,
            trail: [],
        });
    }

    draw(timestamp) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // ── static stars ──
        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            const a = star.alpha * (0.6 + 0.4 * Math.sin(star.twinklePhase));

            if (star.sat === 0) {
                ctx.fillStyle = `rgba(255,255,255,${a})`;
            } else {
                ctx.fillStyle = `hsla(${star.hue},${star.sat}%,90%,${a})`;
            }

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();

            // glow for bigger stars
            if (star.radius > 1.4) {
                ctx.beginPath();
                const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4);
                if (star.sat === 0) {
                    grad.addColorStop(0, `rgba(255,255,255,${a * 0.3})`);
                } else {
                    grad.addColorStop(0, `hsla(${star.hue},${star.sat}%,90%,${a * 0.25})`);
                }
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // ── spawn shooting stars ──
        if (timestamp - this.lastShootingStarTime > (Math.random() * 4000 + 3000)) {
            this.spawnShootingStar();
            this.lastShootingStarTime = timestamp;
        }

        // ── draw + update shooting stars ──
        this.shootingStars = this.shootingStars.filter(s => s.alpha > 0.02);

        this.shootingStars.forEach(s => {
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > 20) s.trail.shift();

            s.x += s.vx;
            s.y += s.vy;
            s.alpha -= 0.022;

            // draw trail
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
                grad.addColorStop(0.4, `rgba(192,132,252,${s.alpha * 0.3})`);
                grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // head glow
            const headGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 4);
            headGrad.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
            headGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
            ctx.fill();
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

// ──────────────────────────────────────────
// Static Noise
// ──────────────────────────────────────────
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
                data[i] = c; data[i+1] = c; data[i+2] = c; data[i+3] = 255;
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

// ──────────────────────────────────────────
// Performance Config
// ──────────────────────────────────────────
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

// ──────────────────────────────────────────
// Responsive Handler
// ──────────────────────────────────────────
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

// ──────────────────────────────────────────
// Project Card Handler
// ──────────────────────────────────────────
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
        const a = document.createElement('a');
        a.href = path;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// ──────────────────────────────────────────
// App
// ──────────────────────────────────────────
class App {
    constructor() {
        this.starfield = null;
        this.staticEffect = null;
        this.responsiveHandler = null;
        this.projectCardHandler = null;
    }

    init() {
        // Starfield
        const canvas = document.getElementById('starsCanvas');
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

        // Project cards
        this.projectCardHandler = new ProjectCardHandler();
        this.projectCardHandler.init();
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
