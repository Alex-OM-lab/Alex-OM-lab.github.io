// ======== Carrusel "cubos" — versión compacta, accesible y responsive ========
// - 5/3/2/1 ítems visibles según ancho (coincide con CSS)
// - Autoplay opcional (data-autoplay, data-interval)
// - Mezcla opcional (data-shuffle)
// - Pausa en hover/focus, flechas + dots, soporte teclado

(function(){
  const wrap = document.querySelector('.cube-carousel');
  if (!wrap) return;

  /* ---------- Datos (placeholders basados en tu mapa) ---------- */
  const ARTICLES = [
    // TEORÍA / SISTEMAS
    { title:'Tipos de kernels y arquitecturas', img:'https://picsum.photos/seed/t-s-1/960/600', meta:'Teoría · Sistemas · 7 min', excerpt:'Conceptos clave sobre kernels monolíticos, microkernels y arquitecturas híbridas.', url:'#' },
    { title:'Procesos, hilos y planificación', img:'https://picsum.photos/seed/t-s-2/960/600', meta:'Teoría · Sistemas · 8 min', excerpt:'Estados, algoritmos de planificación y sincronización básica.', url:'#' },
    { title:'Sistemas de archivos y permisos', img:'https://picsum.photos/seed/t-s-3/960/600', meta:'Teoría · Sistemas · 6 min', excerpt:'ACL, modos Unix, jerarquías y buenas prácticas de organización.', url:'#' },
    { title:'Redes y Comunicaciones — fundamentos', img:'https://picsum.photos/seed/t-s-4/960/600', meta:'Teoría · Redes · 9 min', excerpt:'Modelo OSI/TCP, direccionamiento y diagnóstico básico.', url:'#' },
    { title:'Diseño de Bases de Datos relacionales', img:'https://picsum.photos/seed/t-s-5/960/600', meta:'Teoría · BBDD · 10 min', excerpt:'Normalización, claves y patrones de modelado.', url:'#' },
    { title:'Virtualización y Cloud — conceptos clave', img:'https://picsum.photos/seed/t-s-6/960/600', meta:'Teoría · Cloud · 7 min', excerpt:'Hipervisores, contenedores y aprovisionamiento.', url:'#' },
    { title:'Scripting con Bash y PowerShell', img:'https://picsum.photos/seed/t-s-7/960/600', meta:'Teoría · Scripting · 6 min', excerpt:'Automatización segura y estructuras esenciales.', url:'#' },
    { title:'Documentación técnica y compliance', img:'https://picsum.photos/seed/t-s-8/960/600', meta:'Teoría · Normativa · 5 min', excerpt:'Plantillas, evidencias y trazabilidad.', url:'#' },

    // TEORÍA / CIBERSEGURIDAD
    { title:'Principios de seguridad en redes', img:'https://picsum.photos/seed/t-c-1/960/600', meta:'Teoría · Ciberseguridad · 7 min', excerpt:'Defensa en profundidad, segmentación y controles perimetrales.', url:'#' },
    { title:'Hardening de sistemas Linux y Windows', img:'https://picsum.photos/seed/t-c-2/960/600', meta:'Teoría · Ciberseguridad · 8 min', excerpt:'Checklist de endurecimiento y auditoría básica.', url:'#' },
    { title:'DevSecOps y CI/CD seguro', img:'https://picsum.photos/seed/t-c-3/960/600', meta:'Teoría · DevSecOps · 9 min', excerpt:'Shift-left, escaneo SAST/DAST y firmas de artefactos.', url:'#' },
    { title:'Introducción al análisis forense', img:'https://picsum.photos/seed/t-c-4/960/600', meta:'Teoría · Forense · 6 min', excerpt:'Cadena de custodia, adquisición y triage.', url:'#' },

    // PORTAFOLIO / SISTEMAS (prácticas)
    { title:'Práctica: Active Directory y GPO', img:'https://picsum.photos/seed/p-s-1/960/600', meta:'Portafolio · Sistemas', excerpt:'Despliegue, OU, políticas y hardening básico.', url:'#' },
    { title:'Práctica: VLANs y DHCP en laboratorio', img:'https://picsum.photos/seed/p-s-2/960/600', meta:'Portafolio · Redes', excerpt:'Topología, tagging y troubleshooting.', url:'#' },

    // PORTAFOLIO / CIBERSEGURIDAD (prácticas)
    { title:'Práctica: SIEM con Wazuh', img:'https://picsum.photos/seed/p-c-1/960/600', meta:'Portafolio · Ciberseguridad', excerpt:'Ingesta, reglas y casos de uso básicos.', url:'#' },
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
    const vw = viewport.clientWidth;
    const itemW = (vw - gap*(vis-1)) / vis;
    const x = -(itemW + gap) * vis * page;
    track.style.transform = `translate3d(${x}px,0,0)`;
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

  wrap.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); next(); }
  });

  window.addEventListener('resize', ()=>{
    const old = vis;
    computePages();
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
