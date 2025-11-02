// assets/js/scroll-reveal.js
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 👉 Dispara pronto: cuando la parte superior entra, con margen inferior negativo
  // para adelantar el momento de revelado (mejor si el usuario scrollea rápido).
  const OBSERVER_OPTS = {
    root: null,
    rootMargin: '0px 0px -55%', // más negativo = más pronto
    threshold: 0.01
  };

  const io = new IntersectionObserver(onIntersect, OBSERVER_OPTS);

  // recoge todos los elementos marcados con .reveal
  const targets = Array.from(document.querySelectorAll('.reveal'));
  targets.forEach(el => {
    // estado inicial (si no hay reduce-motion, aplicamos estado "oculto")
    if (!prefersReduced) {
      el.classList.add('is-hidden');
      // si hay stagger, marcamos hijos
      const sel = el.getAttribute('data-stagger');
      if (sel) {
        const kids = el.querySelectorAll(sel);
        kids.forEach(k => k.classList.add('is-hidden-child'));
      }
    }
    io.observe(el);
  });

  // Primer barrido por si ya hay elementos visibles al cargar
  // (evita "saltos" o que se queden sin animar cuando están en primer pantallazo)
  requestAnimationFrame(() => {
    targets.forEach(el => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh * 0.9) {
        // forzamos check manual
        revealElement(el);
      }
    });
  });

  function onIntersect(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        revealElement(entry.target);
        io.unobserve(entry.target); // solo una vez
      }
    }
  }

  function revealElement(el) {
    if (prefersReduced) {
      el.classList.add('reveal-in');
      return;
    }

    const delay = parseInt(el.getAttribute('data-delay') || '0', 10) || 0;
    const sel = el.getAttribute('data-stagger');
    const step = parseInt(el.getAttribute('data-stagger-step') || '80', 10) || 80;

    // Revelado principal
    window.setTimeout(() => {
      el.classList.add('reveal-in');
      el.classList.remove('is-hidden');

      // Stagger interno
      if (sel) {
        const kids = Array.from(el.querySelectorAll(sel));
        kids.forEach((k, i) => {
          window.setTimeout(() => {
            k.classList.add('reveal-in-child');
            k.classList.remove('is-hidden-child');
          }, i * step);
        });
      }
    }, delay);
  }
})();
