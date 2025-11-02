/* =========================================================
   scroll-reveal.js — IntersectionObserver + delays + stagger
   Requiere el CSS de sections.css (clases .reveal / .is-visible)
   ========================================================= */

(() => {
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Si el usuario prefiere menos movimiento: muestra todo y salimos.
  if (REDUCED) {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('is-visible');
      el.setAttribute('data-revealed', 'true');
      // Si hay stagger, marca los hijos también
      const sel = el.dataset.stagger;
      if (sel) {
        el.querySelectorAll(sel).forEach(it => {
          it.classList.add('reveal', 'is-visible');
          it.setAttribute('data-revealed', 'true');
          it.style.transitionDelay = '0ms';
        });
      }
    });
    return;
  }

  const OBS = new IntersectionObserver(onIntersect, {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.15
  });

  document.querySelectorAll('.reveal').forEach(el => {
    // Evita dobles observadores si re-ejecutas el script
    if (!el.__observed) {
      el.__observed = true;
      OBS.observe(el);
    }
  });

  function onIntersect(entries) {
    for (const entry of entries) {
      const el = entry.target;
      const once = el.dataset.once !== 'false'; // por defecto true

      if (entry.isIntersecting) {
        revealElement(el);
        if (once) OBS.unobserve(el);
      } else if (!once) {
        // Reversible: vuelve a estado inicial al salir
        hideElement(el);
      }
    }
  }

  function revealElement(el) {
    // No reveles dos veces si ya está visible (y es "once")
    if (el.getAttribute('data-revealed') === 'true' && el.dataset.once !== 'false') return;

    const delay = toMS(el.dataset.delay, 0);
    const staggerSel = el.dataset.stagger || null;
    const staggerStep = toMS(el.dataset.staggerStep, 60);

    // Aplica delay al propio bloque
    if (delay > 0) el.style.transitionDelay = `${delay}ms`;
    schedule(() => {
      el.classList.add('is-visible');
      el.setAttribute('data-revealed', 'true');
    }, delay);

    // Stagger interno (si se pide)
    if (staggerSel) {
      const items = el.querySelectorAll(staggerSel);
      items.forEach((it, i) => {
        // Garantiza que tengan el estado inicial .reveal
        if (!it.classList.contains('reveal')) it.classList.add('reveal');
        const d = delay + i * staggerStep;
        it.style.transitionDelay = `${d}ms`;
        schedule(() => {
          it.classList.add('is-visible');
          it.setAttribute('data-revealed', 'true');
        }, d);
      });
    }
  }

  function hideElement(el) {
    el.classList.remove('is-visible');
    el.setAttribute('data-revealed', 'false');
    el.style.transitionDelay = '';
    const sel = el.dataset.stagger;
    if (sel) {
      el.querySelectorAll(sel).forEach(it => {
        it.classList.remove('is-visible');
        it.setAttribute('data-revealed', 'false');
        it.style.transitionDelay = '';
      });
    }
  }

  function toMS(val, fallback) {
    if (!val) return fallback;
    const n = parseInt(val, 10);
    return Number.isFinite(n) ? n : fallback;
    }

  function schedule(fn, ms) {
    if (ms <= 16) {
      // ~sin retraso: usa rAF para frame limpio
      requestAnimationFrame(fn);
    } else {
      setTimeout(() => requestAnimationFrame(fn), ms);
    }
  }

  // Revela lo que ya esté visible al cargar
  window.addEventListener('load', () => {
    document.querySelectorAll('.reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
      if (inView) revealElement(el);
    });
  });
})();
