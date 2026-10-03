// V.1.1 Halloween
class HalloweenNightRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.wisps = [];
        this.bats = [];
        this.animationId = null;
        this.isRunning = false;
        this.time = 0;

        // Mondposition wird in resize() berechnet und auch für den Klick (Easter Egg) gebraucht
        this.moon = { x: 0, y: 0, radius: 0 };

        // Easter Egg: Blutmond mit Fledermaus-Schwarm und Hexe
        this.moonEvent = null;
        this.swarm = [];
        this.witch = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    } //AI

    resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.updateMoonPosition();
        this.generateStars();
        this.generateWisps();
        this.generateBats();
    } //AI

    updateMoonPosition() {
        this.moon.radius = Math.min(this.canvas.width, this.canvas.height) * 0.09 + 20;
        this.moon.x = this.canvas.width * 0.82;
        this.moon.y = this.canvas.height * 0.18;
    } //AI

    isOnMoon(x, y) {
        const dx = x - this.moon.x;
        const dy = y - this.moon.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.moon.radius;
    } //AI

    generateStars() {
        // Nur wenige, schwache Sterne – die Nacht soll dunkel bleiben
        const count = Math.floor((this.canvas.width * this.canvas.height) / 14000);
        this.stars = [];

        for (let i = 0; i < count; i++) {
            this.stars.push({
                x:      Math.random() * this.canvas.width,
                y:      Math.random() * this.canvas.height * 0.7,
                radius: Math.random() * 0.9 + 0.3,
                alpha:  Math.random() * 0.4 + 0.1,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinklePhase: Math.random() * Math.PI * 2,
            });
        }
    } //AI

    generateWisps() {
        // Irrlichter: grüne Geisterlichter und orange Kerzenfunken, die langsam schweben
        const count = Math.floor((this.canvas.width * this.canvas.height) / 45000) + 6;
        this.wisps = [];

        for (let i = 0; i < count; i++) {
            this.wisps.push({
                x:      Math.random() * this.canvas.width,
                y:      Math.random() * this.canvas.height,
                radius: Math.random() * 1.8 + 1,
                vy:     -(Math.random() * 0.25 + 0.05),
                swayAmount: Math.random() * 0.6 + 0.2,
                swaySpeed:  Math.random() * 0.02 + 0.005,
                phase:  Math.random() * Math.PI * 2,
                green:  Math.random() < 0.6,
            });
        }
    } //AI

    generateBats() {
        const count = this.canvas.width < 768 ? 4 : 8;
        this.bats = [];

        for (let i = 0; i < count; i++) {
            this.bats.push(this.createBat(true));
        }
    } //AI

    createBat(randomStartX) {
        // Fledermäuse fliegen von links nach rechts oder umgekehrt durch das obere Bilddrittel
        const fromLeft = Math.random() < 0.5;
        const speed = Math.random() * 1.2 + 0.6;
        let startX;

        if (randomStartX) {
            startX = Math.random() * this.canvas.width;
        } else if (fromLeft) {
            startX = -40;
        } else {
            startX = this.canvas.width + 40;
        }

        return {
            x:     startX,
            y:     Math.random() * this.canvas.height * 0.45 + 20,
            vx:    fromLeft ? speed : -speed,
            size:  Math.random() * 10 + 8,
            flapSpeed: Math.random() * 0.15 + 0.2,
            flapPhase: Math.random() * Math.PI * 2,
            bobPhase:  Math.random() * Math.PI * 2,
        };
    } //AI

    mixColor(colorA, colorB, amount) {
        // Mischt zwei Farben [r, g, b]; amount = 0 ergibt colorA, amount = 1 ergibt colorB
        const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * amount);
        const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * amount);
        const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * amount);
        return `${r}, ${g}, ${b}`;
    } //AI

    drawMoon(bloodAmount) {
        // bloodAmount: 0 = normaler Mond, 1 = Blutmond (Easter Egg)
        const ctx = this.ctx;
        const radius = this.moon.radius;
        const x = this.moon.x;
        const y = this.moon.y;

        // Schein um den Mond – beim Blutmond größer und roter
        const glowColor = this.mixColor([255, 200, 120], [220, 30, 20], bloodAmount);
        const glowSize = radius * (4 + bloodAmount * 2);
        const glow = ctx.createRadialGradient(x, y, radius * 0.8, x, y, glowSize);
        glow.addColorStop(0, `rgba(${glowColor}, ${0.25 + bloodAmount * 0.2})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Mondscheibe
        const body = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
        body.addColorStop(0, `rgb(${this.mixColor([255, 243, 214], [255, 110, 80], bloodAmount)})`);
        body.addColorStop(1, `rgb(${this.mixColor([240, 184, 96], [140, 10, 10], bloodAmount)})`);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Ein paar Krater
        ctx.fillStyle = `rgba(${this.mixColor([180, 120, 50], [90, 0, 0], bloodAmount)}, 0.25)`;
        ctx.beginPath();
        ctx.arc(x - radius * 0.35, y + radius * 0.2, radius * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.3, y - radius * 0.25, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.15, y + radius * 0.45, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
    } //AI

    drawBat(bat) {
        const ctx = this.ctx;
        const s = bat.size;
        // flap geht von -1 bis 1 und bewegt die Flügelspitzen hoch und runter
        const flap = Math.sin(bat.flapPhase);

        ctx.save();
        ctx.translate(bat.x, bat.y);
        if (bat.vx < 0) {
            ctx.scale(-1, 1);
        }

        ctx.fillStyle = 'rgba(8, 3, 12, 0.92)';
        ctx.beginPath();
        // linker Flügel
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-s * 0.6, -s * 0.6 * flap - s * 0.2, -s * 1.4, -s * flap);
        ctx.quadraticCurveTo(-s * 1.0, -s * 0.1, -s * 0.8, s * 0.15);
        ctx.quadraticCurveTo(-s * 0.5, 0, -s * 0.3, s * 0.25);
        ctx.lineTo(0, s * 0.1);
        // rechter Flügel
        ctx.lineTo(s * 0.3, s * 0.25);
        ctx.quadraticCurveTo(s * 0.5, 0, s * 0.8, s * 0.15);
        ctx.quadraticCurveTo(s * 1.0, -s * 0.1, s * 1.4, -s * flap);
        ctx.quadraticCurveTo(s * 0.6, -s * 0.6 * flap - s * 0.2, 0, 0);
        ctx.fill();

        // Körper mit kleinen Ohren
        ctx.beginPath();
        ctx.ellipse(0, s * 0.05, s * 0.18, s * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.12, -s * 0.15);
        ctx.lineTo(-s * 0.08, -s * 0.38);
        ctx.lineTo(-s * 0.02, -s * 0.18);
        ctx.lineTo(s * 0.02, -s * 0.18);
        ctx.lineTo(s * 0.08, -s * 0.38);
        ctx.lineTo(s * 0.12, -s * 0.15);
        ctx.fill();

        ctx.restore();
    } //AI

    drawWitch(x, y, s) {
        // Silhouette einer Hexe auf dem Besen, Blickrichtung nach rechts
        const ctx = this.ctx;
        // Umhang flattert leicht im Wind
        const cloakWave = Math.sin(this.time * 0.25) * s * 0.08;

        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = 'rgba(8, 3, 12, 0.95)';
        ctx.strokeStyle = 'rgba(8, 3, 12, 0.95)';
        ctx.lineCap = 'round';

        // Besenstiel
        ctx.lineWidth = s * 0.06;
        ctx.beginPath();
        ctx.moveTo(-s * 1.1, s * 0.15);
        ctx.lineTo(s * 0.9, -s * 0.05);
        ctx.stroke();

        // Reisig hinten am Besen
        ctx.beginPath();
        ctx.moveTo(-s * 1.0, s * 0.14);
        ctx.lineTo(-s * 1.5, -s * 0.05);
        ctx.lineTo(-s * 1.65, s * 0.22);
        ctx.lineTo(-s * 1.45, s * 0.42);
        ctx.closePath();
        ctx.fill();

        // Körper
        ctx.beginPath();
        ctx.moveTo(-s * 0.45, s * 0.1);
        ctx.lineTo(s * 0.25, s * 0.03);
        ctx.lineTo(-s * 0.05, -s * 0.6);
        ctx.closePath();
        ctx.fill();

        // Umhang nach hinten
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, -s * 0.5);
        ctx.quadraticCurveTo(-s * 0.6, -s * 0.4, -s * 0.9, s * 0.05 + cloakWave);
        ctx.lineTo(-s * 0.4, s * 0.1);
        ctx.closePath();
        ctx.fill();

        // Bein nach vorne
        ctx.lineWidth = s * 0.08;
        ctx.beginPath();
        ctx.moveTo(-s * 0.05, s * 0.05);
        ctx.lineTo(s * 0.2, s * 0.25);
        ctx.stroke();

        // Kopf
        ctx.beginPath();
        ctx.arc(-s * 0.02, -s * 0.68, s * 0.13, 0, Math.PI * 2);
        ctx.fill();

        // Hutkrempe und Hutspitze (Spitze zeigt nach hinten)
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.74);
        ctx.lineTo(s * 0.26, -s * 0.8);
        ctx.lineTo(s * 0.24, -s * 0.73);
        ctx.lineTo(-s * 0.3, -s * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.16, -s * 0.76);
        ctx.lineTo(s * 0.12, -s * 0.79);
        ctx.lineTo(-s * 0.28, -s * 1.25);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    } //AI

    startMoonEvent() {
        // Läuft das Easter Egg schon, wird ein weiterer Klick ignoriert
        if (this.moonEvent) return;

        this.moonEvent = { frame: 0, duration: 540 }; // ca. 9 Sekunden bei 60 FPS

        // Fledermaus-Schwarm, der aus dem Mond in alle Richtungen herausfliegt
        this.swarm = [];
        const swarmCount = this.canvas.width < 768 ? 18 : 35;
        for (let i = 0; i < swarmCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            this.swarm.push({
                x:     this.moon.x,
                y:     this.moon.y,
                vx:    Math.cos(angle) * speed,
                vy:    Math.sin(angle) * speed,
                size:  Math.random() * 8 + 6,
                flapSpeed: Math.random() * 0.2 + 0.35,
                flapPhase: Math.random() * Math.PI * 2,
                delay: Math.floor(Math.random() * 60), // nicht alle gleichzeitig
            });
        }

        // Die Hexe startet links vom Mond und fliegt einmal quer davor vorbei
        this.witch = {
            x:     this.moon.x - this.moon.radius * 6,
            y:     this.moon.y + this.moon.radius * 0.15,
            speed: this.moon.radius * 12 / 330,
            size:  this.moon.radius * 0.7,
        };
    } //AI

    drawMoonEvent(bloodAmount) {
        const ctx = this.ctx;

        // Hexe
        if (this.witch) {
            this.witch.x += this.witch.speed;
            const bob = Math.sin(this.time * 0.05) * this.moon.radius * 0.1;
            this.drawWitch(this.witch.x, this.witch.y + bob, this.witch.size);

            if (this.witch.x > this.canvas.width + this.witch.size * 2) {
                this.witch = null;
            }
        }

        // Fledermaus-Schwarm – wer den Bildschirm verlässt, wird entfernt
        const remainingBats = [];
        this.swarm.forEach(bat => {
            if (bat.delay > 0) {
                bat.delay -= 1;
                remainingBats.push(bat);
                return;
            }

            bat.x += bat.vx;
            bat.y += bat.vy;
            bat.flapPhase += bat.flapSpeed;
            this.drawBat(bat);

            const isVisible = bat.x > -60 && bat.x < this.canvas.width + 60 && bat.y > -60 && bat.y < this.canvas.height + 60;
            if (isVisible) {
                remainingBats.push(bat);
            }
        });
        this.swarm = remainingBats;

        // Schriftzug unter dem Mond, blendet mit dem Blutmond ein und aus
        if (bloodAmount > 0) {
            const fontSize = Math.max(26, this.moon.radius * 0.5);
            const text = 'Happy Halloween!';
            ctx.save();
            ctx.font = `${fontSize}px Creepster, cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text darf nicht über den rechten Rand hinausragen
            const halfWidth = ctx.measureText(text).width / 2;
            let textX = this.moon.x;
            if (textX + halfWidth > this.canvas.width - 16) {
                textX = this.canvas.width - 16 - halfWidth;
            }
            const textY = this.moon.y + this.moon.radius * 1.6 + fontSize * 0.6;

            ctx.globalAlpha = bloodAmount;
            ctx.shadowColor = 'rgba(255, 60, 20, 0.9)';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#ffb35c';
            ctx.fillText(text, textX, textY);
            ctx.restore();
        }
    } //AI

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.time += 1;

        // Sterne
        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            const alpha = star.alpha * (0.5 + 0.5 * Math.sin(star.twinklePhase));
            ctx.fillStyle = `rgba(230, 215, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Easter Egg: Blutmond wird in der ersten Sekunde stärker und in der letzten Sekunde wieder schwächer
        let bloodAmount = 0;
        if (this.moonEvent) {
            this.moonEvent.frame += 1;
            const frame = this.moonEvent.frame;
            const duration = this.moonEvent.duration;
            bloodAmount = Math.max(0, Math.min(1, frame / 60, (duration - frame) / 60));

            if (frame >= duration) {
                this.moonEvent = null;
            }
        }

        this.drawMoon(bloodAmount);

        // Irrlichter
        this.wisps.forEach(wisp => {
            wisp.phase += wisp.swaySpeed;
            wisp.y += wisp.vy;
            wisp.x += Math.sin(wisp.phase) * wisp.swayAmount;

            if (wisp.y < -20) {
                wisp.y = this.canvas.height + 20;
                wisp.x = Math.random() * this.canvas.width;
            }

            const alpha = 0.35 + 0.3 * Math.sin(wisp.phase * 2);
            let color;
            if (wisp.green) {
                color = '157, 255, 58';
            } else {
                color = '255, 140, 40';
            }

            const glow = ctx.createRadialGradient(wisp.x, wisp.y, 0, wisp.x, wisp.y, wisp.radius * 7);
            glow.addColorStop(0, `rgba(${color}, ${alpha * 0.5})`);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(wisp.x, wisp.y, wisp.radius * 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(${color}, ${alpha + 0.2})`;
            ctx.beginPath();
            ctx.arc(wisp.x, wisp.y, wisp.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Fledermäuse – wer den Bildschirm verlässt, wird durch eine neue ersetzt
        for (let i = 0; i < this.bats.length; i++) {
            const bat = this.bats[i];
            bat.flapPhase += bat.flapSpeed;
            bat.bobPhase  += 0.03;
            bat.x += bat.vx;
            bat.y += Math.sin(bat.bobPhase) * 0.6;

            if (bat.x < -60 || bat.x > this.canvas.width + 60) {
                this.bats[i] = this.createBat(false);
            }

            this.drawBat(bat);
        }

        this.drawMoonEvent(bloodAmount);

        this.animationId = requestAnimationFrame(() => this.draw());
    } //AI

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animationId = requestAnimationFrame(() => this.draw());
    } //AI

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    } //AI
}

class LightningEffectManager {
    constructor(element) {
        this.element = element;
        this.timeoutId = null;
        this.isRunning = false;
    } //AI

    scheduleNext() {
        if (!this.isRunning) return;

        // Alle 12 bis 25 Sekunden ein kurzer, schwacher Blitz
        const delay = Math.random() * 13000 + 12000;
        this.timeoutId = setTimeout(() => this.flash(), delay);
    } //AI

    flash() {
        if (!this.isRunning) return;

        // Doppelblitz: hell, kurz dunkel, nochmal etwas schwächer, dann ausblenden.
        // Die Helligkeit bleibt bewusst niedrig, damit es nicht unangenehm grell wird.
        const el = this.element;
        el.style.transition = 'none';
        el.style.opacity = '0.35';

        setTimeout(() => { el.style.opacity = '0.05'; }, 80);
        setTimeout(() => { el.style.opacity = '0.25'; }, 160);
        setTimeout(() => {
            el.style.transition = 'opacity 0.8s ease-out';
            el.style.opacity = '0';
        }, 240);

        this.scheduleNext();
    } //AI

    start() {
        if (this.isRunning) return;

        // Bei "Bewegung reduzieren" keine Blitze anzeigen
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        this.isRunning = true;
        this.scheduleNext();
    } //AI

    stop() {
        this.isRunning = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    } //AI
}

class ResponsiveHandler {
    constructor(onBreakpointChange) {
        this.currentWidth = window.innerWidth;
        this.resizeTimeout = null;
        this.onBreakpointChange = onBreakpointChange;
    } //AI

    getBreakpoint(width) {
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    } //AI

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
    } //AI
}

class ProjectCardHandler {
    constructor() {
        this.grid = document.querySelector('.projects-grid');
    } //AI

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
    } //AI
}

class ScreenshotModal {
    constructor() {
        this.modal = null;
        this.createModal();
        this.bindEvents();
    } //AI

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'screenshot-modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close" role="button" aria-label="Close">&times;</span>
                <img class="modal-img" src="" alt="Screenshot">
            </div>`;
        document.body.appendChild(this.modal);
    } //AI

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
    } //AI

    open(src) {
        this.modal.querySelector('.modal-img').src = src;
        this.modal.classList.add('active');
    } //AI

    close() {
        this.modal.classList.remove('active');
    } //AI
}

class MoonClickHandler {
    constructor(nightRenderer) {
        this.nightRenderer = nightRenderer;
        // Auf diesen Elementen soll ein Klick nie das Easter Egg auslösen, auch wenn sie über dem Mond liegen
        this.ignoredElements = 'a, button, select, input, .project-card, #theme-switcher, #cookie-banner, .back-nav, .screenshot-modal';
    } //AI

    init() {
        // Das Canvas hat pointer-events: none, daher wird der Klick auf dem ganzen Dokument abgefragt
        // und anhand der Mausposition geprüft, ob der Mond getroffen wurde.
        document.addEventListener('click', e => {
            if (e.target.closest(this.ignoredElements)) return;

            if (this.nightRenderer.isOnMoon(e.clientX, e.clientY)) {
                this.nightRenderer.startMoonEvent();
            }
        });

        // Hand-Cursor über dem Mond als kleiner Hinweis, dass man klicken kann
        document.addEventListener('mousemove', e => {
            const overMoon = this.nightRenderer.isOnMoon(e.clientX, e.clientY) && !e.target.closest(this.ignoredElements);
            if (overMoon) {
                document.body.style.cursor = 'pointer';
            } else {
                document.body.style.cursor = '';
            }
        });
    } //AI
}

class App {
    constructor() {
        this.nightRenderer = null;
        this.moonClickHandler = null;
        this.lightning = null;
        this.responsiveHandler = null;
        this.projectCardHandler = null;
        this.screenshotModal = null;
    } //AI

    init() {
        // Mond, Fledermäuse, Irrlichter – funktioniert mit #Canvas (Hauptseite) ODER #starsCanvas (Projektseiten)
        const canvas = document.getElementById('Canvas') || document.getElementById('starsCanvas');
        if (canvas) {
            this.nightRenderer = new HalloweenNightRenderer(canvas);
            this.nightRenderer.start();

            // Easter Egg: Klick auf den Mond
            this.moonClickHandler = new MoonClickHandler(this.nightRenderer);
            this.moonClickHandler.init();
        }

        // Blitze – nutzt das vorhandene #staticEl als Lichtfläche
        const staticEl = document.getElementById('staticEl');
        if (staticEl) {
            this.lightning = new LightningEffectManager(staticEl);
            this.lightning.start();
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
    } //AI

    destroy() {
        if (this.nightRenderer) this.nightRenderer.stop();
        if (this.lightning)     this.lightning.stop();
    } //AI
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    app.init();
});

window.addEventListener('beforeunload', () => {
    if (app) app.destroy();
});
