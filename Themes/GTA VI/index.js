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
        // "Stars" werden hier zu treibenden Partikeln (Staub/Glitzer in der Hitze) umfunktioniert
        const count = Math.floor((this.canvas.width * this.canvas.height) / 4500);
        this.stars = [];
 
        for (let i = 0; i < count; i++) {
            const size = Math.random();
            this.stars.push({
                x:         Math.random() * this.canvas.width,
                y:         Math.random() * this.canvas.height * 0.65, // bleiben im "Himmel"
                radius:    size < 0.6 ? Math.random() * 0.8 + 0.2
                         : size < 0.9 ? Math.random() * 1.2 + 0.6
                         :              Math.random() * 2 + 1.2,
                alpha:     Math.random() * 0.6 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.003,
                twinklePhase: Math.random() * Math.PI * 2,
                // Pink / Orange / Cyan Farbpalette statt weiß/blau/lila
                hue: Math.random() < 0.4 ? 330   // pink
                   : Math.random() < 0.7 ? 35    // orange
                   :                       185,  // cyan
                sat: Math.floor(Math.random() * 40 + 60),
            });
        }
    }
 
    spawnShootingStar() {
        // Statt Sternschnuppen: schnelle Lichtstreifen ("Nightrider")
        const startX = -50;
        const startY = this.canvas.height * (0.2 + Math.random() * 0.4);
        const speed  = Math.random() * 10 + 10;
        const length = Math.random() * 150 + 80;
        const colorPick = Math.random() < 0.5 ? 'pink' : 'cyan';
 
        this.shootingStars.push({
            x: startX, y: startY,
            vx: speed,
            vy: 0,
            length,
            alpha: 1,
            trail: [],
            color: colorPick,
        });
    }
 
    draw(timestamp) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
 
        // ── Sonnenuntergangs-Sonne ──
        const sunCx = w * 0.5;
        const sunCy = h * 0.62;
        const sunR  = Math.min(w, h) * 0.22;
        const sunGrad = ctx.createRadialGradient(sunCx, sunCy, 0, sunCx, sunCy, sunR);
        sunGrad.addColorStop(0,   'rgba(255, 174, 0, 0.55)');
        sunGrad.addColorStop(0.5, 'rgba(255, 45, 120, 0.30)');
        sunGrad.addColorStop(1,   'rgba(255, 45, 120, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunCx, sunCy, sunR, 0, Math.PI * 2);
        ctx.fill();
 
        // Sonnen-Streifen (klassischer Retro-Synthwave-Look)
        ctx.save();
        ctx.beginPath();
        ctx.arc(sunCx, sunCy, sunR * 0.9, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(26,10,31,0.55)';
        const stripeCount = 7;
        for (let i = 0; i < stripeCount; i++) {
            const sh = (sunR * 1.8) / (stripeCount * 2);
            const sy = sunCy - sunR * 0.9 + i * (sh * 2.4) + sh;
            ctx.fillRect(sunCx - sunR, sy, sunR * 2, sh);
        }
        ctx.restore();
 
        // ── treibende Glitzerpartikel ──
        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            const a = star.alpha * (0.6 + 0.4 * Math.sin(star.twinklePhase));
 
            ctx.fillStyle = `hsla(${star.hue},${star.sat}%,65%,${a})`;
 
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
 
            if (star.radius > 1.4) {
                ctx.beginPath();
                const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4);
                grad.addColorStop(0, `hsla(${star.hue},${star.sat}%,65%,${a * 0.25})`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
 
        // ── perspektivisches Retro-Grid am unteren Bildrand ──
        this.gridOffset = (this.gridOffset + 0.6) % 40;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
        ctx.lineWidth = 1;
        const horizonY = h * 0.62;
        const vanishX = w * 0.5;
 
        // horizontale Linien (näher = weiter auseinander)
        for (let i = 0; i < 14; i++) {
            const t = (i * 40 + this.gridOffset) / (14 * 40);
            const y = horizonY + Math.pow(t, 2.2) * (h - horizonY);
            const alpha = 0.3 * (1 - t * 0.6);
            ctx.strokeStyle = `rgba(255, 45, 120, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
 
        // vertikale Linien Richtung Fluchtpunkt
        const vCount = 12;
        for (let i = 0; i <= vCount; i++) {
            const xBottom = (w / vCount) * i;
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
            ctx.beginPath();
            ctx.moveTo(vanishX, horizonY);
            ctx.lineTo(xBottom, h);
            ctx.stroke();
        }
        ctx.restore();
 
        // ── spawn ──
        if (timestamp - this.lastShootingStarTime > (Math.random() * 4000 + 3000)) {
            this.spawnShootingStar();
            this.lastShootingStarTime = timestamp;
        }
 
        // ── Lichtstreifen ──
        this.shootingStars = this.shootingStars.filter(s => s.alpha > 0.02 && s.x < w + 100);
 
        this.shootingStars.forEach(s => {
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > 20) s.trail.shift();
 
            s.x += s.vx;
            s.y += s.vy;
            if (s.trail.length > 16) s.alpha -= 0.012;
 
            const baseColor = s.color === 'pink' ? '255,45,120' : '0,229,255';
 
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
                grad.addColorStop(0.4, `rgba(${baseColor},${s.alpha * 0.3})`);
                grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
 
            // glow
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
            // Hitzeflimmer-Rauschen statt reinem Grau: leicht warmer Ton
            const data = this.imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const c = Math.random() * 255;
                data[i]   = c;                         // R
                data[i+1] = c * 0.85;                   // G (leicht wärmer)
                data[i+2] = c * 0.9;                     // B
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
