(() => {
  'use strict';

  const CONFIG = {
    email: 'your-email@example.com'
  };

  clearTimeout(window.__rv);

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const menuBtn = $('#menuBtn');
  const nav = $('#nav');

  function closeMenu() {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
  }

  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  $$('a', nav).forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  const progress = $('#progress');
  const header = $('#siteHeader');
  const timeline = $('#timeline');
  let ticking = false;

  function updateScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? doc.scrollTop / max : 0) + ')';
    header.classList.toggle('scrolled', doc.scrollTop > 8);

    if (timeline && !reduceMotion) {
      const rect = timeline.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - rect.top) / rect.height));
      timeline.style.setProperty('--tl', p.toFixed(3));
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();

  const navLinks = $$('a', nav);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((section) => spy.observe(section));
  }

  $$('[data-stagger]').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.classList.add('reveal');
      child.style.setProperty('--d', (i * 0.08).toFixed(2) + 's');
    });
  });

  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  async function runTerminal() {
    const body = $('#terminal');
    if (!body) return;
    const lines = $$('.tl', body);

    if (reduceMotion) { lines.forEach((line) => line.classList.add('show')); return; }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await sleep(600);

    for (const line of lines) {
      const cmd = $('.cmd', line);
      line.classList.add('show');
      if (cmd) {
        const text = cmd.dataset.text || '';
        cmd.textContent = '';
        for (const char of text) {
          cmd.textContent += char;
          await sleep(40 + Math.random() * 50);
        }
        await sleep(280);
      } else {
        await sleep(380);
      }
    }
  }
  runTerminal();

  const chips = $$('.chip');
  const cells = $$('.work-cell');
  const count = $('#count');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));

      let shown = 0;
      cells.forEach((cell) => {
        const match = filter === 'all' || cell.dataset.cat === filter;
        cell.hidden = !match;
        if (match) {
          shown += 1;
          cell.classList.add('is-in');
          if (!reduceMotion) {
            cell.classList.remove('pop');
            void cell.offsetWidth;
            cell.classList.add('pop');
          }
        }
      });
      count.textContent = 'Showing ' + shown + (shown === 1 ? ' work' : ' works');
    });
  });

  $$('.card').forEach((card) => {
    const tilts = card.classList.contains('tilt');

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');

      if (tilts && !reduceMotion && e.pointerType === 'mouse') {
        const rx = (y / rect.height - 0.5) * -6;
        const ry = (x / rect.width - 0.5) * 6;
        card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
      }
    });

    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  $$('[data-email]').forEach((el) => {
    el.textContent = CONFIG.email;
    if (el.tagName === 'A') el.setAttribute('href', 'mailto:' + CONFIG.email);
  });

  const form = $('#contactForm');
  const status = $('#formStatus');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();

      if (!name || !email || !message) {
        status.style.color = '#ff5f56';
        status.textContent = 'Please fill in your name, email and message.';
        return;
      }

      const subject = encodeURIComponent('Portfolio message from ' + name);
      const body = encodeURIComponent(message + '\n\nFrom: ' + name + ' (' + email + ')');
      status.style.color = 'var(--ok)';
      status.textContent = 'Opening your email app...';
      window.location.href = 'mailto:' + CONFIG.email + '?subject=' + subject + '&body=' + body;
    });
  }

  const canvas = $('#particleCanvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const particles = [];
    const PARTICLE_COUNT = 60;
    const CONNECT_DIST = 140;
    let w, h, animId;

    function getColors() {
      const style = getComputedStyle(document.documentElement);
      return {
        dot: style.getPropertyValue('--primary').trim() || '#00ff66',
        line: style.getPropertyValue('--line').trim() || '#1a3423',
        accent: style.getPropertyValue('--accent').trim() || '#00df81'
      };
    }

    function resize() {
      const hero = canvas.closest('.hero-bg') || canvas.parentElement;
      w = canvas.width = hero.offsetWidth;
      h = canvas.height = hero.offsetHeight;
    }

    function createParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          r: Math.random() * 2 + 1.5,
          isAccent: Math.random() < 0.15
        });
      }
    }

    function draw() {
      const c = getColors();
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const opacity = (1 - dist / CONNECT_DIST) * 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = c.line;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.isAccent ? c.accent : c.dot;
        ctx.globalAlpha = p.isAccent ? 0.9 : 0.6;
        ctx.fill();

        if (p.isAccent) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = c.accent;
          ctx.globalAlpha = 0.08;
          ctx.fill();
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });

    if ('IntersectionObserver' in window) {
      const heroObs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          if (!animId) draw();
        } else {
          cancelAnimationFrame(animId);
          animId = null;
        }
      });
      const heroSection = canvas.closest('.hero');
      if (heroSection) heroObs.observe(heroSection);
    }
  }

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
