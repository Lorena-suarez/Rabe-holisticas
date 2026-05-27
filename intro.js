// ── Canvas & contexto ──────────────────────────────────────────
const canvas = document.getElementById('particles');
const ctx    = canvas.getContext('2d');

let W, H, cx, cy;
let particles = [];
let activated = false;
let mouse     = { x: -999, y: -999 };

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  cx = W / 2;
  cy = H / 2;
}
resize();
window.addEventListener('resize', resize);

// ── Rastrear mouse ─────────────────────────────────────────────
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener('mouseleave', () => {
  mouse.x = -999;
  mouse.y = -999;
});

// ── Clase Partícula ────────────────────────────────────────────
class Particle {
  constructor() { this.reset(); }

  reset() {
    this.x     = Math.random() * W;
    this.y     = Math.random() * H;
    this.r     = Math.random() * 2.5 + 0.4;
    this.alpha = Math.random() * 0.55 + 0.2;

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.28 + 0.04;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    // velocidad base para restaurar después del empuje
    this.baseVx = this.vx;
    this.baseVy = this.vy;

    this.pulseSpeed = Math.random() * 0.007 + 0.003;
    this.pulseDir   = Math.random() > 0.5 ? 1 : -1;

    this.captured = false;
    this.arriving = false;
  }

  update() {
    if (this.arriving) {
      const dx   = cx - this.x;
      const dy   = cy - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) { this.alpha = 0; return; }
      this.x += (dx / dist) * 4;
      this.y += (dy / dist) * 4;
      this.alpha = Math.max(0, this.alpha - 0.008);
      return;
    }
    if (this.captured) return;

    // ── Repulsión del mouse ──
    const RADIUS = 90;  // zona de influencia del cursor
    const mdx  = this.x - mouse.x;
    const mdy  = this.y - mouse.y;
    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

    if (mdist < RADIUS && mdist > 0) {
      const force = (RADIUS - mdist) / RADIUS;  // 0→1 más cerca más fuerza
      const pushX = (mdx / mdist) * force * 2.8;
      const pushY = (mdy / mdist) * force * 2.8;
      this.vx += pushX;
      this.vy += pushY;
    }

    // Amortiguación: vuelve suavemente a la velocidad base
    this.vx += (this.baseVx - this.vx) * 0.04;
    this.vy += (this.baseVy - this.vy) * 0.04;

    this.x += this.vx;
    this.y += this.vy;

    // Pulso de opacidad
    this.alpha += this.pulseSpeed * this.pulseDir;
    if (this.alpha > 0.78 || this.alpha < 0.1) this.pulseDir *= -1;

    // Rebote en bordes
    if (this.x < 0 || this.x > W) { this.vx *= -1; this.baseVx *= -1; }
    if (this.y < 0 || this.y > H) { this.vy *= -1; this.baseVy *= -1; }
  }

  draw() {
    if (this.alpha <= 0) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 220, 200, ${this.alpha})`;
    ctx.fill();
  }
}

// ── Inicializar partículas ─────────────────────────────────────
function initParticles() {
  const count = Math.floor((W * H) / 4000);
  particles = Array.from({ length: Math.min(count, 300) }, () => new Particle());
}
initParticles();

// ── Loop ───────────────────────────────────────────────────────
function loop() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(loop);
}
loop();

// ── Círculo: achicarse al hover ────────────────────────────────
const circle = document.getElementById('circle');

circle.addEventListener('mouseenter', () => {
  if (!activated) circle.style.transform = 'scale(0.88)';
});
circle.addEventListener('mouseleave', () => {
  if (!activated) circle.style.transform = 'scale(1)';
});

// ── Activación ────────────────────────────────────────────────
const msg    = document.getElementById('msg');
const msgSec = document.getElementById('msgSecondary');
const hint   = document.getElementById('hint');
const scene  = document.getElementById('scene');

function activate() {
  if (activated) return;
  activated = true;

  // Restaurar tamaño del círculo antes de la animación
  circle.style.transform = 'scale(1)';
  hint.style.opacity = '0';

  // Partículas vuelan al centro
  particles.forEach(p => { p.arriving = true; });

  // Respirar
  setTimeout(() => {
    circle.classList.add('breathing');

    setTimeout(() => {
      msg.style.opacity   = '0';
      msg.style.transform = 'translateY(-12px)';
      setTimeout(() => {
        msgSec.style.opacity   = '1';
        msgSec.style.transform = 'translateY(0)';
      }, 400);
    }, 1800);

    setTimeout(() => {
      scene.classList.add('fade-out');
      canvas.style.transition = 'opacity 1s ease';
      canvas.style.opacity    = '0';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }, 6000);

  }, 800);
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') activate(); });
circle.addEventListener('click', activate);