/* =======================================
   Herramientas & Lenguajes – JS ligero
   - Ajusta barras por data-level
   - Mejoras de accesibilidad (focus)
   ======================================= */

(function(){
  const map = {
    'alto': 100,
    'medio-alto': 78,
    'medio': 56,
    'básico': 34,
    'basico': 34
  };

  document.querySelectorAll('.tool-btn[data-level]').forEach(btn=>{
    const lvl = (btn.getAttribute('data-level')||'').toLowerCase();
    const pct = map[lvl] ?? 0;
    const bar = btn.querySelector('.meter > i');
    if(bar){
      // Animación de entrada
      requestAnimationFrame(()=>{
        bar.style.inset = `0 ${Math.max(0,100-pct)}% 0 0`;
      });
    }
  });

  // accesibilidad: al tabular, aplicar pequeño foco visual
  document.querySelectorAll('.tool-btn').forEach(btn=>{
    btn.setAttribute('tabindex','0');
    btn.addEventListener('focus', ()=> btn.classList.add('hover'));
    btn.addEventListener('blur',  ()=> btn.classList.remove('hover'));
  });
})();
