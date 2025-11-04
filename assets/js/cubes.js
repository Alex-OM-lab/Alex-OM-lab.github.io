  // ======== Carrusel "cubos" — versión compacta, accesible y responsive ========
// - 5/3/2/1 ítems visibles según ancho (coincide con CSS)
// - Autoplay opcional (data-autoplay, data-interval)
// - Mezcla opcional (data-shuffle)
// - Pausa en hover/focus, flechas + dots, soporte teclado

(function(){
  const wrap = document.querySelector('.cube-carousel');
  if (!wrap) return;

  /* ---------- Datos de ejemplo (puedes reemplazar por los tuyos) ---------- */
  const ARTICLES = [
    { title:'Artículo 1: Placeholder', img:'https://picsum.photos/seed/a1/960/600', meta:'Guía • 7 min', excerpt:'Texto ficticio para probar el layout.', url:'#' },
    { title:'Artículo 2: Placeholder', img:'https://picsum.photos/seed/a2/960/600', meta:'Tutorial • 5 min', excerpt:'Texto ficticio para probar el layout.', url:'#' },
    { title:'Artículo 3: Placeholder', img:'https://picsum.photos/seed/a3/960/600', meta:'Análisis • 9 min', excerpt:'Texto ficticio para probar el layout.', url:'#' },
    { title:'Artículo 4: Placeholder', img:'https://picsum.photos/seed/a4/960/600', meta:'Caso práctico • 6 min', excerpt:'Texto ficticio para probar el layout.', url:'#' },
    { title:'Artículo 5: Placeholder', img:'https://picsum.photos/seed/a5/960/600', meta:'Referencia • 4 min', excerpt:'Texto ficticio para probar el layout.', url:'#' },
    { title:'Artículo 6: Placeholder', img:'https://picsum.photos/seed/a6/960/600', meta:'Guía • 8 min', excerpt:'Texto ficticio para probar el layout.', url:'#' },
    { title:'Artículo 7: Placeholder', img:'https://picsum.photos/seed/a7/960/600', meta:'Tutorial • 5 min', excerpt:'Texto ficticio para probar el layout.', url:'#' },
    { title:'Artículo 8: Placeholder', img:'https://picsum.photos/seed/a8/960/600', meta:'Análisis • 10 min', excerpt:'Texto ficticio para probar el layout.', url:'#' },
  ];

  /* ---------- Opciones ---------- */
  const autoplay   = wrap.getAttribute('data-autoplay') === 'true';
  const intervalMs = parseInt(wrap.getAttribute('data-interval') || '4000', 10);
  const shuffle    = wrap.getAttribute('data-shuffle') === 'true';

  const viewport = wrap.querySelector('.cube-viewport');
  const track    = wrap.querySelector('.cube-track');
  const prevBtn  = wrap.querySelector('#cubePrev');
  const nextBtn  = wrap.querySelector('#cubeNext');
  const dotsWrap = wrap.querySelector('#cubeDots');

  if (!viewport || !track) return;

  /* ---------- Utilidades ---------- */
  function shuffled(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function visibleCount(){
    const w = window.innerWidth;
    if (w <= 520)  return 1;
    if (w <= 720)  return 2;
    if (w <= 1020) return 3;
    return 5;
  }

  /* ---------- Render ---------- */
  const data = shuffle ? shuffled(ARTICLES) : ARTICLES.slice();

  function renderItems(){
    track.innerHTML = '';
    data.forEach((it, idx)=>{
      const item = document.createElement('article');
      item.className = 'cube';
      item.setAttribute('role','listitem');

      const media = document.createElement('div');
      media.className = 'cube-media';
      if (it.img){
        const img = document.createElement('img');
        img.src = it.img; img.alt = it.title || 'Artículo';
        media.appendChild(img);
      }
      const body = document.createElement('div');
      body.className = 'cube-body';

      const h = document.createElement('h4');
      h.className = 'cube-title';
      h.textContent = it.title || `Artículo ${idx+1}`;

      const meta = document.createElement('div');
      meta.className = 'cube-meta';
      meta.textContent = it.meta || '—';

      const p = document.createElement('p');
      p.className = 'cube-meta';
      p.textContent = it.excerpt || 'Resumen breve del contenido.';

      const a = document.createElement('a');
      a.className = 'cube-link';
      a.href = it.url || '#';
      a.textContent = 'Ver más';

      body.append(h, meta, p, a);
      item.append(media, body);
      track.appendChild(item);
    });
  }

  /* ---------- Estado y navegación ---------- */
  let vis = visibleCount();
  let page = 0;
  let pages = 1;
  let timer = null;

  function computePages(){
    vis = visibleCount();
    pages = Math.max(1, Math.ceil(data.length / vis));
    page = Math.min(page, pages - 1);
  }

  function updateDots(){
    dotsWrap.innerHTML = '';
    for(let i=0;i<pages;i++){
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'cube-dot' + (i===page ? ' is-active' : '');
      d.setAttribute('aria-label', `Ir a página ${i+1}`);
      d.addEventListener('click', ()=> goTo(i));
      dotsWrap.appendChild(d);
    }
  }

  function translate(){
    const gap = 14; // coincide con CSS
    // ancho de un item = (viewportWidth - gaps) / visibles
    const vw = viewport.clientWidth;
    const itemW = (vw - gap*(vis-1)) / vis;
    const x = -(itemW + gap) * vis * page;
    track.style.transform = `translate3d(${x}px,0,0)`;
    // aria-live simple
    wrap.setAttribute('aria-live','polite');
  }

  function goTo(n){
    page = (n + pages) % pages;
    updateDots();
    translate();
  }

  function next(){ goTo(page + 1); }
  function prev(){ goTo(page - 1); }

  /* ---------- Autoplay ---------- */
  function start(){
    if (!autoplay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stop();
    timer = setInterval(next, intervalMs);
  }
  function stop(){ if (timer) { clearInterval(timer); timer = null; } }

  /* ---------- Eventos ---------- */
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  wrap.addEventListener('mouseenter', stop);
  wrap.addEventListener('mouseleave', start);
  wrap.addEventListener('focusin',  stop);
  wrap.addEventListener('focusout', start);

  // Teclado en el carrusel
  wrap.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); next(); }
  });

  window.addEventListener('resize', ()=>{
    const old = vis;
    computePages();
    // si cambió el nº de visibles, recalculamos dots y posición
    if (old !== vis){
      updateDots();
      translate();
    } else {
      translate();
    }
  });

  /* ---------- Init ---------- */
  renderItems();
  computePages();
  updateDots();
  translate();
  start();
})();
