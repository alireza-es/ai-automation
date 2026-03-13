/* ===== Navigation scroll effect ===== */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ===== Mobile hamburger ===== */
const hamburger = document.getElementById('hamburger');
hamburger?.addEventListener('click', () => {
  nav.classList.toggle('menu-open');
});

/* ===== Smooth close menu on link click ===== */
document.querySelectorAll('.nav__links a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('menu-open'));
});

/* ===== Scroll reveal ===== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
  '.feature-card, .step, .testimonial-card, .pricing-card, .section-header'
).forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

/* ===== Animated stat counters ===== */
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.stat__num').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const step = 16;
      const increment = target / (duration / step);
      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + increment, target);
        el.textContent = Math.floor(current);
        if (current >= target) clearInterval(timer);
      }, step);
    });
    counterObserver.unobserve(entry.target);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.feature-card__stats').forEach(el => {
  counterObserver.observe(el);
});

/* ===== Hero chat animation ===== */
const typingText = document.getElementById('typing-text');
const mockupTasks = document.getElementById('mockup-tasks');
const taskLoading = document.getElementById('task-loading');

const response = "On it! Reading your inbox now…";

function typeMessage(text, el, cb) {
  let i = 0;
  el.textContent = '';
  const timer = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(timer);
      cb?.();
    }
  }, 40);
}

function runChatAnimation() {
  setTimeout(() => {
    typeMessage(response, typingText, () => {
      setTimeout(() => {
        if (mockupTasks) mockupTasks.style.display = 'flex';
        setTimeout(() => {
          if (taskLoading) {
            taskLoading.innerHTML = `
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path d="M3 8l3.5 3.5L13 4" stroke="#3ECFCF" stroke-width="2" stroke-linecap="round" fill="none"/>
              </svg>
              7 Notion tasks created ✓`;
            taskLoading.classList.remove('mockup__task--loading');
            taskLoading.classList.add('mockup__task--done');
          }
        }, 2500);
      }, 600);
    });
  }, 1400);
}

runChatAnimation();

/* ===== Pricing toggle ===== */
const billingToggle = document.getElementById('billing-toggle');
billingToggle?.addEventListener('change', () => {
  const isAnnual = billingToggle.checked;
  document.querySelectorAll('.pricing-card__amount').forEach(el => {
    const monthly = el.dataset.monthly;
    const annual = el.dataset.annual;
    if (monthly === undefined) return;
    const target = isAnnual ? parseInt(annual) : parseInt(monthly);
    animateNum(el, target);
  });
});

function animateNum(el, target) {
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const duration = 400;
  const step = 16;
  const diff = target - start;
  let elapsed = 0;
  const timer = setInterval(() => {
    elapsed += step;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + diff * ease);
    if (progress >= 1) clearInterval(timer);
  }, step);
}

/* ===== Subtle parallax on hero orbs ===== */
document.addEventListener('mousemove', (e) => {
  const { clientX: x, clientY: y } = e;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (x - cx) / cx;
  const dy = (y - cy) / cy;

  document.querySelectorAll('.hero__orb').forEach((orb, i) => {
    const factor = (i + 1) * 12;
    orb.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
  });
}, { passive: true });

/* ===== Active nav link highlighting ===== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${entry.target.id}`) {
          link.style.color = 'var(--text)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(sec => sectionObserver.observe(sec));
