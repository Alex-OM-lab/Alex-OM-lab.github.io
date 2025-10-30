// Dispara un glitch fuerte al terminar el typing y luego glitch suave cada 6s.
// No toca tu script de typing: detecta cuando #lead recibe la clase .show.

(function(){
  const title   = document.getElementById('heroTitle');
  const nameEl  = document.getElementById('typeName');
  const lead    = document.getElementById('lead');

  if(!title || !nameEl) return;

  // Mantener data-text sincronizado con lo que va escribiendo tu typing
  const syncDataText = () => title.setAttribute('data-text', nameEl.textContent || '');
  syncDataText();
  const syncTimer = setInterval(syncDataText, 120);

  // Helper para lanzar un ciclo y limpiar la clase al terminar
  const runOnce = (cls, ms) => {
    title.classList.add(cls);
    setTimeout(() => title.classList.remove(cls), ms + 20);
  };

  // Cuando el typing termina (tu código añade .show a #lead):
  const onTypingDone = () => {
    // 1) Glitch FUERTE inmediato
    runOnce('is-glitch-strong', 600);

    // 2) Bucle SUAVE cada 6s
    setInterval(() => runOnce('is-glitch-soft', 380), 6000);

    // Ya no hace falta seguir sincronizando
    clearInterval(syncTimer);
  };

  // Si por hot reload ya está hecho:
  if (lead && lead.classList.contains('show')) {
    onTypingDone();
    return;
  }

  // Observa #lead hasta que reciba .show (termina typing)
  if (lead) {
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'attributes' && lead.classList.contains('show')) {
          mo.disconnect();
          onTypingDone();
          break;
        }
      }
    });
    mo.observe(lead, { attributes:true, attributeFilter:['class'] });
  }
})();
