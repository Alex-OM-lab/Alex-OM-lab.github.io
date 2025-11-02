/* =========================================================
   Scroll Reveal (minimal-pro) — Alejandro OM
   - Usa IntersectionObserver para revelar .reveal al entrar en viewport
   - Respeta prefers-reduced-motion
   - Soporta data attributes:
       data-reveal="fade-up|fade-in|zoom-in|slide-left|slide-right"
       data-reveal-delay="200"           (ms)
       data-reveal-once="false"          (por defecto: true)
     En contenedores:
       data-stagger="100"                (ms, aplica a hijos .reveal)
   - Añade la clase .is-visible cuando toca (tu CSS maneja la transición)
   ========================================================= */

(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Si el usuario prefiere menos movimiento → mostrar todo sin animar
  if (prefersReduced) {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('is-visible');
        el.style.transition = 'none';
        el.style.animation = 'none';
      });
    });
    return;
  }

  // 1) Preproceso: aplicar "stagger" a grupos
  //    Un contenedor con [data-stagger="120"] añade retrasos crecientes a sus hijos .reveal
  function applyStagger() {
    const groups = document.querySelectorAll('[data-stagger]');
    groups.forEach(group => {
      const step = parseInt(group.getAttribute('data-stagger'), 10) || 0;
      if (!step) return;
      const children = group.querySelectorAll('.reveal');
      children.forEach((el, i) => {
        const hasOwnDelay = el.hasAttribute('data-reveal-delay');
        if (!hasOwnDelay) el.setAttribute('data-reveal-delay', String(i * step));
      });
    });
  }

  // 2) Observador principal
  function initObserver() {
    const options = {
      root: null,
      rootMargin: '0px 0px -10% 0px', // Revela un poco antes del centro inferior
      threshold: 0.15
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        const revealOnce = el.getAttribute('data-reveal-once');
        const once = revealOnce == null ? true : (revealOnce !== 'false'); // por defecto true
        const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);

        if (entry.isIntersecting) {
          if (delay > 0) {
            // Evita dobles timeouts en reentradas
            if (el.__rvTo) clearTimeout(el.__rvTo);
            el.__rvTo = setTimeout(() => {
              el.classList.add('is-visible');
              el.__rvTo = null;
            }, delay);
          } else {
            el.classList.add('is-visible');
          }
          if (once) io.unobserve(el);
        } else {
          // Si once=false, permite ocultar al salir para reanimar en nueva entrada
          if (!once) {
            if (el.__rvTo) { clearTimeout(el.__rvTo); el.__rvTo = null; }
            el.classList.remove('is-visible');
          }
        }
      });
    }, options);

    // Observar todos los elementos .reveal
    document.querySelectorAll('.reveal').forEach(el => {
      // Marcar el tipo de animación como data-reveal (ya está en el HTML)
      // El CSS decidirá el "from" según data-reveal + .reveal, y el "to" al añadir .is-visible
      io.observe(el);
    });
  }

  // 3) Init en DOM listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyStagger();
      initObserver();
    });
  } else {
    applyStagger();
    initObserver();
  }

})();
