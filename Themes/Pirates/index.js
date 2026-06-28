class StarfieldRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');
        this.animationId = null;
        this.isRunning   = false;
        this.startTime   = null;

        this.waves = this._buildWaves();
        this.stars = [];
        this.lightning     = null;
        this.lightningAt   = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    _buildWaves() {
        return [
            // Hintergrund – fein, klein, kurze Wellenlänge
            { amp:  9,  freq: 0.0280, speed: 0.10, yFrac: 0.58, alpha: 0.45, hue: 205, sat: 40, lit: 12 },
            { amp: 15,  freq: 0.0200, speed: 0.32, yFrac: 0.63, alpha: 0.52, hue: 202, sat: 43, lit: 14 },
            { amp: 22,  freq: 0.0150, speed: 0.16, yFrac: 0.68, alpha: 0.60, hue: 198, sat: 46, lit: 16 },
            // Mittelgrund
            { amp: 30,  freq: 0.0110, speed: 0.45, yFrac: 0.73, alpha: 0.68, hue: 194, sat: 50, lit: 17 },
            { amp: 40,  freq: 0.0080, speed: 0.22, yFrac: 0.78, alpha: 0.72, hue: 190, sat: 52, lit: 18 },
            // Vordergrund – groß, breit, dominant
            { amp: 50,  freq: 0.0060, speed: 0.60, yFrac: 0.83, alpha: 0.75, hue: 186, sat: 48, lit: 17 },
            { amp: 60,  freq: 0.0045, speed: 0.34, yFrac: 0.88, alpha: 0.68, hue: 182, sat: 44, lit: 15 },
        ];
    }

    _randomLightningDelay() {
        return 10000 + Math.random() * 20000;
    }

    resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this._generateStars();
    }

    _generateStars() {
        const count = Math.floor((this.canvas.width * this.canvas.height) / 3800);
        this.stars = [];
        for (let i = 0; i < count; i++) {
            const big = Math.random() < 0.12;
            this.stars.push({
                x:      Math.random() * this.canvas.width,
                y:      Math.random() * this.canvas.height * 0.58,
                r:      big ? Math.random() * 1.4 + 0.8 : Math.random() * 0.7 + 0.2,
                baseA:  Math.random() * 0.55 + 0.20,
                phase:  Math.random() * Math.PI * 2,
                speed:  Math.random() * 0.9 + 0.3,
                gold:   Math.random() < 0.09,
            });
        }
    }

    _triggerLightning() {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const x = W * (0.18 + Math.random() * 0.64);
        this.lightning = {
            x,
            segs:       this._buildLightningSegs(x, 0, x, H * 0.55, 9),
            alpha:      1.0,
            decay:      0.07 + Math.random() * 0.05,
            flashAlpha: 0.14 + Math.random() * 0.10,
        };
    }

    _buildLightningSegs(x1, y1, x2, y2, depth) {
        if (depth === 0 || Math.abs(y2 - y1) < 6) return [{ x1, y1, x2, y2 }];
        const jitter = Math.abs(y2 - y1) * 0.45;
        const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * jitter;
        const my = (y1 + y2) / 2;
        const segs = [
            ...this._buildLightningSegs(x1, y1, mx, my, depth - 1),
            ...this._buildLightningSegs(mx, my, x2, y2, depth - 1),
        ];
        if (Math.random() < 0.3) {
            const bx = mx + (Math.random() - 0.5) * 90;
            const by = my + 30 + Math.random() * 70;
            segs.push(...this._buildLightningSegs(mx, my, bx, by, Math.max(depth - 3, 1)));
        }
        return segs;
    }

    _waveY(wave, px, t) {
        return (
            Math.sin(px * wave.freq        + t * wave.speed)        * wave.amp        +
            Math.sin(px * wave.freq * 1.73 + t * wave.speed * 1.41) * wave.amp * 0.35 +
            Math.sin(px * wave.freq * 0.53 + t * wave.speed * 0.67) * wave.amp * 0.20
        );
    }

    draw(timestamp) {
        if (!this.isRunning) return;
        if (this.startTime === null) this.startTime = timestamp;
        const t = (timestamp - this.startTime) * 0.001;

        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;

        ctx.clearRect(0, 0, W, H);

        const horizonY = H * 0.60;

        // ── Himmel ──
        const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
        sky.addColorStop(0,   '#010609');
        sky.addColorStop(0.3, '#020d18');
        sky.addColorStop(0.7, '#04182a');
        sky.addColorStop(1,   '#071f35');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, horizonY);

        // ── Mond ──
        const moonX = W * 0.74;
        const moonY = H * 0.09;

        const halo = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 160);
        halo.addColorStop(0,   'rgba(230, 210, 145, 0.22)');
        halo.addColorStop(0.4, 'rgba(180, 160, 100, 0.09)');
        halo.addColorStop(1,   'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 160, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = 'rgba(245, 232, 182, 0.92)';
        ctx.fillRect(moonX - 30, moonY - 30, 60, 60);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(moonX + 17, moonY - 10, 32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill();
        ctx.restore();

        const reflW = 100 + Math.sin(t * 0.4) * 18;
        const rx    = moonX - reflW / 2 + Math.sin(t * 0.3) * 12;
        const refl  = ctx.createLinearGradient(rx, horizonY, rx, H);
        refl.addColorStop(0,    'rgba(200, 175, 100, 0.00)');
        refl.addColorStop(0.05, 'rgba(200, 175, 100, 0.18)');
        refl.addColorStop(0.4,  'rgba(180, 155, 85, 0.10)');
        refl.addColorStop(1,    'rgba(160, 135, 70, 0.04)');
        ctx.fillStyle = refl;
        ctx.fillRect(rx, horizonY, reflW, H - horizonY);

        // ── Sterne ──
        this.stars.forEach(s => {
            const a = s.baseA * (0.6 + 0.4 * Math.sin(s.phase + t * s.speed));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = s.gold
                ? `rgba(210, 175, 80, ${a})`
                : `rgba(215, 228, 245, ${a})`;
            ctx.fill();
        });

        // ── Blitz ──
        if (this.lightningAt === null) this.lightningAt = timestamp + this._randomLightningDelay();
        if (timestamp >= this.lightningAt) {
            this._triggerLightning();
            this.lightningAt = timestamp + this._randomLightningDelay();
        }

        if (this.lightning) {
            const la = this.lightning.alpha;
            ctx.fillStyle = `rgba(215, 228, 248, ${la * this.lightning.flashAlpha})`;
            ctx.fillRect(0, 0, W, H);

            ctx.save();
            this.lightning.segs.forEach(seg => {
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.strokeStyle = `rgba(225, 238, 255, ${la})`;
                ctx.lineWidth   = 1.3;
                ctx.shadowBlur  = 3;
                ctx.shadowColor = `rgba(160, 200, 255, ${la * 0.35})`;
                ctx.stroke();
            });
            ctx.restore();
            this.lightning.alpha -= this.lightning.decay;
            if (this.lightning.alpha <= 0) this.lightning = null;
        }

        const waterFill = ctx.createLinearGradient(0, horizonY, 0, H);
        waterFill.addColorStop(0,    '#071c2e');
        waterFill.addColorStop(0.35, '#05131f');
        waterFill.addColorStop(1,    '#020b14');
        ctx.fillStyle = waterFill;
        ctx.fillRect(0, horizonY, W, H - horizonY);

        for (let i = 0; i < 5; i++) {
            const glX = (i / 4) * W + Math.sin(t * 0.2 + i * 1.3) * 40;
            const glY = H * (0.70 + i * 0.05);
            const glW = 180 + Math.sin(t * 0.15 + i) * 40;
            const gl  = ctx.createRadialGradient(glX, glY, 0, glX, glY, glW * 0.5);
            gl.addColorStop(0, `rgba(50, 120, 160, ${0.06 - i * 0.005})`);
            gl.addColorStop(1, 'transparent');
            ctx.fillStyle = gl;
            ctx.fillRect(glX - glW / 2, glY - 10, glW, 20);
        }

        this.waves.forEach((wave, wi) => {
            const yBase = H * wave.yFrac;

            ctx.beginPath();
            ctx.moveTo(-2, H);
            ctx.lineTo(-2, yBase + this._waveY(wave, 0, t));

            for (let px = 0; px <= W; px += 4) {
                ctx.lineTo(px, yBase + this._waveY(wave, px, t));
            }

            ctx.lineTo(W + 2, H);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, yBase - wave.amp, 0, yBase + wave.amp * 1.5);
            grad.addColorStop(0,   `hsla(${wave.hue}, ${wave.sat}%, ${wave.lit + 14}%, ${wave.alpha})`);
            grad.addColorStop(0.4, `hsla(${wave.hue}, ${wave.sat}%, ${wave.lit}%,      ${wave.alpha})`);
            grad.addColorStop(1,   `hsla(${wave.hue}, ${wave.sat - 6}%, ${wave.lit - 5}%, ${wave.alpha * 0.65})`);
            ctx.fillStyle = grad;
            ctx.fill();

            const crestAlpha = 0.15 + (wi / this.waves.length) * 0.35;
            ctx.beginPath();
            for (let px = 0; px <= W; px += 4) {
                const y = yBase + this._waveY(wave, px, t);
                px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
            }
            ctx.strokeStyle = `rgba(185, 222, 240, ${crestAlpha})`;
            ctx.lineWidth   = 0.8 + (wi / this.waves.length) * 1.4;
            ctx.stroke();
        });


        const fogShift = Math.sin(t * 0.06) * 0.06;
        const fog = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 80);
        fog.addColorStop(0,   'transparent');
        fog.addColorStop(0.3, `rgba(22, 50, 72, ${0.28 + fogShift})`);
        fog.addColorStop(0.7, `rgba(12, 28, 42, ${0.18 + fogShift})`);
        fog.addColorStop(1,   'transparent');
        ctx.fillStyle = fog;
        ctx.fillRect(0, horizonY - 40, W, 120);

        const bottomVig = ctx.createLinearGradient(0, H * 0.85, 0, H);
        bottomVig.addColorStop(0, 'transparent');
        bottomVig.addColorStop(1, 'rgba(2, 8, 14, 0.65)');
        ctx.fillStyle = bottomVig;
        ctx.fillRect(0, H * 0.85, W, H * 0.15);

        this.animationId = requestAnimationFrame(ts => this.draw(ts));
    }

    start() {
        if (this.isRunning) return;
        this.isRunning   = true;
        this.animationId = requestAnimationFrame(ts => this.draw(ts));
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

class StaticEffectManager {
    constructor(config, element) {
        this.config  = config;
        this.element = element;
        this.lastUpdate  = 0;
        this.animationId = null;
        this.isRunning   = false;

        if (!config || config.canvasSize === 0) return;

        this.offscreen = document.createElement('canvas');
        this.offscreen.width  = config.canvasSize;
        this.offscreen.height = config.canvasSize;
        this.offCtx  = this.offscreen.getContext('2d', { alpha: false, willReadFrequently: false });
        this.imgData = this.offCtx.createImageData(config.canvasSize, config.canvasSize);
    }

    generate(timestamp) {
        if (!this.isRunning || !this.offscreen) return;
        if (timestamp - this.lastUpdate > this.config.staticUpdateInterval) {
            const d = this.imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                const v = Math.random() * 160 + 50;
                d[i] = v * 0.78; d[i+1] = v * 0.90; d[i+2] = v; d[i+3] = 255;
            }
            this.offCtx.putImageData(this.imgData, 0, 0);
            const s = (this.config.canvasSize / 2) + 'px';
            this.element.style.backgroundImage = `url(${this.offscreen.toDataURL()})`;
            this.element.style.backgroundSize  = `${s} ${s}`;
            this.lastUpdate = timestamp;
        }
        this.animationId = requestAnimationFrame(ts => this.generate(ts));
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        if (this.offscreen) this.animationId = requestAnimationFrame(ts => this.generate(ts));
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

class PerformanceConfig {
    constructor() {
        this.screenWidth = window.innerWidth;
        this.isMobile    = this.screenWidth < 768;
        this.isTablet    = this.screenWidth >= 768 && this.screenWidth < 1024;
        this.config      = this.getConfig();
    }
    getConfig() {
        if (this.isMobile) return { canvasSize: 80,  staticUpdateInterval: 260 };
        if (this.isTablet) return { canvasSize: 150, staticUpdateInterval: 140 };
        return                    { canvasSize: 280, staticUpdateInterval: 70  };
    }
}

class ResponsiveHandler {
    constructor(onBreakpointChange) {
        this.currentWidth       = window.innerWidth;
        this.resizeTimeout      = null;
        this.onBreakpointChange = onBreakpointChange;
    }
    getBreakpoint(w) {
        if (w < 768)  return 'mobile';
        if (w < 1024) return 'tablet';
        return 'desktop';
    }
    init() {
        let current = this.getBreakpoint(this.currentWidth);
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                const nb = this.getBreakpoint(window.innerWidth);
                if (current !== nb) {
                    if (this.onBreakpointChange) this.onBreakpointChange(current, nb);
                    current = nb;
                    location.reload();
                }
                this.currentWidth = window.innerWidth;
            }, 250);
        });
    }
}

class ProjectCardHandler {
    constructor() { this.grid = document.querySelector('.projects-grid'); }
    init() {
        if (!this.grid) return;
        this.grid.addEventListener('click', e => {
            const card = e.target.closest('.project-card');
            if (!card) return;
            const name = card.dataset.project;
            if (e.target.classList.contains('more-btn'))   { e.stopPropagation(); window.location.href = `projects/${name}/index.html`; return; }
            if (e.target.classList.contains('github-btn')) { e.stopPropagation(); window.location.href = `https://github.com/philkluge/${name}`; return; }
            window.location.href = `projects/${name}/index.html`;
        });
    }
    downloadFile(path) {
        const a = document.createElement('a');
        a.href = path; a.download = '';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
}

class ScreenshotModal {
    constructor() { this.modal = null; this.createModal(); this.bindEvents(); }
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'screenshot-modal';
        this.modal.innerHTML = `<div class="modal-content"><span class="modal-close" role="button" aria-label="Close">&times;</span><img class="modal-img" src="" alt="Screenshot"></div>`;
        document.body.appendChild(this.modal);
    }
    bindEvents() {
        document.querySelectorAll('.screenshot-item').forEach(item => {
            item.addEventListener('click', () => { const img = item.querySelector('img'); if (img) this.open(img.src); });
        });
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', e => { if (e.target === this.modal) this.close(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && this.modal.classList.contains('active')) this.close(); });
    }
    open(src)  { this.modal.querySelector('.modal-img').src = src; this.modal.classList.add('active'); }
    close()    { this.modal.classList.remove('active'); }
}

class App {
    constructor() {
        this.starfield = null; this.staticEffect = null;
        this.responsiveHandler = null; this.projectCardHandler = null; this.screenshotModal = null;
    }
    init() {
        const canvas = document.getElementById('Canvas') || document.getElementById('starsCanvas');
        if (canvas) { this.starfield = new StarfieldRenderer(canvas); this.starfield.start(); }

        const staticEl = document.getElementById('staticEl');
        if (staticEl) { const perf = new PerformanceConfig(); this.staticEffect = new StaticEffectManager(perf.config, staticEl); this.staticEffect.start(); }

        this.responsiveHandler = new ResponsiveHandler((a, b) => console.log(`BP: ${a}→${b}`));
        this.responsiveHandler.init();

        this.projectCardHandler = new ProjectCardHandler();
        this.projectCardHandler.init();

        if (document.querySelector('.screenshot-item')) this.screenshotModal = new ScreenshotModal();
    }
    destroy() {
        if (this.starfield)    this.starfield.stop();
        if (this.staticEffect) this.staticEffect.stop();
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => { app = new App(); app.init(); });
window.addEventListener('beforeunload', () => { if (app) app.destroy(); });