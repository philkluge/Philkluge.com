// V.6.1 Space Theme

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
                x:            Math.random() * this.canvas.width,
                y:            Math.random() * this.canvas.height,
                radius:       size < 0.6 ? Math.random() * 0.8 + 0.2
                            : size < 0.9 ? Math.random() * 1.2 + 0.6
                            :              Math.random() * 2 + 1.2,
                alpha:        Math.random() * 0.6 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.003,
                twinklePhase: Math.random() * Math.PI * 2,
                hue:          Math.random() < 0.5 ? 0
                            : Math.random() < 0.5 ? 220
                            :                       270,
                sat:          Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 40 + 30),
            });
        }
    }

    spawnShootingStar() {
        const startX = Math.random() * this.canvas.width * 0.7;
        const startY = Math.random() * this.canvas.height * 0.4;
        const angle  = (Math.random() * 20 + 20) * (Math.PI / 180);
        const speed  = Math.random() * 8 + 6;

        this.shootingStars.push({
            x: startX, y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            trail: [],
        });
    }

    draw(timestamp) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            const a = star.alpha * (0.6 + 0.4 * Math.sin(star.twinklePhase));

            ctx.fillStyle = star.sat === 0
                ? `rgba(255,255,255,${a})`
                : `hsla(${star.hue},${star.sat}%,90%,${a})`;

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();

            if (star.radius > 1.4) {
                const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4);
                grad.addColorStop(0, star.sat === 0
                    ? `rgba(255,255,255,${a * 0.3})`
                    : `hsla(${star.hue},${star.sat}%,90%,${a * 0.25})`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        if (timestamp - this.lastShootingStarTime > (Math.random() * 4000 + 3000)) {
            this.spawnShootingStar();
            this.lastShootingStarTime = timestamp;
        }

        this.shootingStars = this.shootingStars.filter(s => s.alpha > 0.02);
        this.shootingStars.forEach(s => {
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > 20) s.trail.shift();
            s.x += s.vx;
            s.y += s.vy;
            s.alpha -= 0.022;

            if (s.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(s.trail[0].x, s.trail[0].y);
                for (let i = 1; i < s.trail.length; i++) ctx.lineTo(s.trail[i].x, s.trail[i].y);
                const grad = ctx.createLinearGradient(s.trail[0].x, s.trail[0].y, s.x, s.y);
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(0.4, `rgba(192,132,252,${s.alpha * 0.3})`);
                grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

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
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

class StaticEffectManager {
    constructor(element) {
        this.element = element;
        this.lastUpdate = 0;
        this.animationId = null;
        this.isRunning = false;
        this.interval = window.innerWidth < 768 ? 200 : window.innerWidth < 1024 ? 120 : 60;
        const size = window.innerWidth < 768 ? 80 : window.innerWidth < 1024 ? 150 : 300;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvas.height = size;
        this.ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: false });
        this.imageData = this.ctx.createImageData(size, size);
        this.halfSize = size / 2;
    }

    generate(timestamp) {
        if (!this.isRunning) return;
        if (timestamp - this.lastUpdate > this.interval) {
            const data = this.imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const c = Math.random() * 255;
                data[i] = c; data[i+1] = c; data[i+2] = c; data[i+3] = 255;
            }
            this.ctx.putImageData(this.imageData, 0, 0);
            this.element.style.backgroundImage = `url(${this.canvas.toDataURL()})`;
            this.element.style.backgroundSize = `${this.halfSize}px ${this.halfSize}px`;
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

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('starsCanvas');
    if (canvas) {
        const sf = new StarfieldRenderer(canvas);
        sf.start();
        window.addEventListener('beforeunload', () => sf.stop());
    }

    const staticEl = document.getElementById('staticEl');
    if (staticEl) {
        const sm = new StaticEffectManager(staticEl);
        sm.start();
        window.addEventListener('beforeunload', () => sm.stop());
    }

    new ScreenshotModal();
});
