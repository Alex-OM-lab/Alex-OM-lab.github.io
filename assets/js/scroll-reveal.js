// assets/js/scroll-reveal.js
// Revelado temprano + delay por sección + stagger opcional + fallbacks
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Inyecta estilos mínimos para que funcione con .visible y con is-hidden/reveal-in
  (function injectStyles(){
    const style = document.createElement('style');
    style.setAttribute('data-scroll-reveal-styles','1');
    style.textContent = `
      .reveal.is-hidden { opacity:0; transform: translateY(10px); }
      .reveal.reveal-in,
      .reveal.visible { opacity:1; transform:none; transition: opacity .6s ease, transform .6s ease; }

      .is-hidden-child { opacity:0; transform: translateY(8px); }
      .reveal-in-child { opacity:1; transform:none; transition: opacity .45s cubic-bezier(.2,.9,.2,1), transform .45s cubic-bezier(.2,.9,.2,1); }
    `;
    document.head.appendChild(style);
  })();

  const targets = Array.from(document.querySelectorAll('.reveal'));
  if (targets.length === 0) return;

  // Si hay motion reducido, mostramos sin animar
  if (prefersReduced) {
    targets.forEach(el => el.classList.add('reveal-in','visible'));
    return;
  }

  // Fallback si no hay IO
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('reveal-in','visible'));
    return;
  }

  // Estado inicial: oculto y preparar hijos para stagger
  targets.forEach(el => {
    el.classList.add('is-hidden');
    const sel = el.getAttribute('data-stagger');
    if (sel) el.querySelectorAll(sel).forEach(k => k.classList.add('is-hidden-child'));
  });

  // Observador — dispara pronto (rootMargin bottom negativo)
  const OBSERVER_OPTS = {
    root: null,
    rootMargin: '0px 0px -55%',   // cuanto más negativo, antes revela
    threshold: 0.01
  };
  const io = new IntersectionObserver(onIntersect, OBSERVER_OPTS);
  targets.forEach(el => io.observe(el));

  // Primer barrido: si ya están cerca/visibles al cargar, revela sin esperar al IO
  requestAnimationFrame(() => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    targets.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.9) revealElement(el); // 90% del viewport
    });
  });

  function onIntersect(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        revealElement(entry.target);
        io.unobserve(entry.target);
      }
    }
  }

  function revealElement(el) {
    // ya revelado
    if (el.classList.contains('reveal-in') || el.classList.contains('visible')) return;

    const delay = parseInt(el.getAttribute('data-delay') || '0', 10) || 0;
    const sel   = el.getAttribute('data-stagger');
    const step  = parseInt(el.getAttribute('data-stagger-step') || '80', 10) || 80;

    window.setTimeout(() => {
      // Revelado principal (soporta ambos esquemas)
      el.classList.add('reveal-in', 'visible');
      el.classList.remove('is-hidden');

      // Stagger interno
      if (sel) {
        const kids = Array.from(el.querySelectorAll(sel));
        kids.forEach((k, i) => {
          window.setTimeout(() => {
            k.classList.add('reveal-in-child');
            k.classList.remove('is-hidden-child');
          }, i * step + 120); // pequeño offset para escalonar
        });
      }
    }, delay);
  }
})();
