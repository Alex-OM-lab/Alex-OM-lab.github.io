/* ===== Carrusel de artículos (15 ítems) =====
   - Flechas con estilo “anterior”, posicionadas fuera del carrusel
   - Dots, drag/swipe, autoplay suave
*/

(function(){
  const $ = sel => document.querySelector(sel);

  // 15 ítems de ejemplo (coherentes con tu mapa)
  const CUBE_ITEMS = [
    // Página 1
    {img:'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', title:'DevSecOps y CI/CD seguro', meta:'Teoría · DevSecOps · 9 min', desc:'Shift-left, escaneo SAST/DAST y firmas de artefactos.'},
    {img:'https://images.unsplash.com/photo-1529257414772-1960b0f4f8a4?q=80&w=1200&auto=format&fit=crop', title:'Práctica: Active Directory y GPO', meta:'Portafolio · Sistemas · 8 min', desc:'Despliegue, OU, políticas y hardening básico.'},
    {img:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop', title:'Virtualización y Cloud — conceptos clave', meta:'Teoría · Cloud · 7 min', desc:'Hipervisores, contenedores y aprovisionamiento.'},
    {img:'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=1200&auto=format&fit=crop', title:'Principios de seguridad en redes', meta:'Teoría · Ciberseguridad · 7 min', desc:'Defensa en profundidad, segmentación y controles perimetrales.'},
    {img:'https://images.unsplash.com/photo-1526481280698-8fcc13fd6a62?q=80&w=1200&auto=format&fit=crop', title:'Sistemas de archivos y permisos', meta:'Teoría · Sistemas · 6 min', desc:'ACL, modos Unix, jerarquías y buenas prácticas.'},

    // Página 2
    {img:'https://images.unsplash.com/photo-1532619675605-1ede6e88d07b?q=80&w=1200&auto=format&fit=crop', title:'Documentación técnica y compliance', meta:'Teoría · Normativa · 5 min', desc:'Plantillas, evidencias y trazabilidad.'},
    {img:'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?q=80&w=1200&auto=format&fit=crop', title:'Hardening de sistemas Linux y Windows', meta:'Teoría · Ciberseguridad · 8 min', desc:'Checklist de endurecimiento y auditoría básica.'},
    {img:'https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=1200&auto=format&fit=crop', title:'SIEM con Wazuh (práctica)', meta:'Portafolio · Ciberseguridad · 9 min', desc:'Ingesta, reglas y casos de uso básicos.'},
    {img:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop', title:'Tipos de kernels y arquitecturas', meta:'Teoría · Sistemas · 7 min', desc:'Monolíticos, microkernels y arquitecturas híbridas.'},
    {img:'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop', title:'Redes y comunicaciones — fundamentos', meta:'Teoría · Redes · 9 min', desc:'Modelo OSI/TCP, direccionamiento y diagnóstico básico.'},

    // Página 3
    {img:'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=1200&auto=format&fit=crop', title:'Gestión de servidores', meta:'Teoría · Sistemas · 8 min', desc:'Automatización, backups y monitoreo.'},
    {img:'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop', title:'Bases de datos relacionales', meta:'Teoría · BBDD · 10 min', desc:'Normalización, índices y patrones de modelo.'},
    {img:'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop', title:'Programación y scripting', meta:'Teoría · Dev · 6 min', desc:'PowerShell, Bash y Python para automatización.'},
    {img:'https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=1200&auto=format&fit=crop', title:'Respuesta a incidentes', meta:'Teoría · Ciberseguridad · 8 min', desc:'Clasificación, contención, erradicación y lecciones aprendidas.'},
    {img:'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', title:'Cumplimiento ENS / ISO / RGPD', meta:'Teoría · Normativa · 9 min', desc:'Gobierno, riesgos y evidencias auditables.'}
  ];

  // Construcción DOM
  const viewport = document.getElementById('cubeViewport') || document.querySelector('.cube-viewport');
  const track = document.getElementById('cubeTrack') || document.querySelector('.cube-track');
  const dotsWrap = document.getElementById('cubeDots') || document.querySelector('.cube-dots');
  const btnPrev = document.getElementById('cubePrev') || document.querySelector('.cube-btn.prev');
  const btnNext = document.getElementById('cubeNext') || document.querySelector('.cube-btn.next');

  if(!viewport || !track) return;

  // Pintar tarjetas
  track.innerHTML = '';
  CUBE_ITEMS.forEach(item=>{
    const card = document.createElement('article');
    card.className = 'cube-card';
    card.innerHTML = `
      <img class="cube-img" src="${item.img}" alt="" loading="lazy">
      <div class="cube-body">
        <h4 class="cube-title">${item.title}</h4>
        <div class="cube-meta">${item.meta}</div>
        <p class="cube-desc">${item.desc}</p>
        <button class="cube-more" type="button">Ver más</button>
      </div>
    `;
    track.appendChild(card);
  });

  // Lógica del carrusel
  const state = {
    index: 0,
    perView: 4,
    dragging: false,
    startX: 0,
    startTx: 0,
    autoplay: true,
    timer: null
  };

  function recompute(){
    const w = viewport.clientWidth;
    const cardW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cube-card-w')) || 320;
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cube-gap')) || 18;
    state.perView = Math.max(1, Math.floor((w + gap) / (cardW + gap)));
    const maxIndex = Math.max(0, CUBE_ITEMS.length - state.perView);
    if(state.index > maxIndex) state.index = maxIndex;
    update();
    updateDots();
    updateBtns();
  }

  function update(){
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cube-gap')) || 18;
    const cards = track.children;
    if(!cards.length) return;
    const cardW = cards[0].getBoundingClientRect().width;
    const x = -(state.index * (cardW + gap));
    track.style.transform = `translate3d(${x}px,0,0)`;
  }

  function goTo(idx){
    const maxIndex = Math.max(0, CUBE_ITEMS.length - state.perView);
    state.index = Math.max(0, Math.min(maxIndex, idx));
    update();
    updateDots();
    updateBtns();
  }

  function next(){ goTo(state.index + 1); }
  function prev(){ goTo(state.index - 1); }

  function updateBtns(){
    const maxIndex = Math.max(0, CUBE_ITEMS.length - state.perView);
    if(btnPrev) btnPrev.disabled = (state.index <= 0);
    if(btnNext) btnNext.disabled = (state.index >= maxIndex);
  }

  // Dots
  function buildDots(){
    if(!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const pages = Math.max(1, CUBE_ITEMS.length - state.perView + 1);
    for(let i=0;i<pages;i++){
      const d = document.createElement('span');
      d.className = 'cube-dot';
      d.addEventListener('click', ()=> goTo(i));
      dotsWrap.appendChild(d);
    }
  }
  function updateDots(){
    if(!dotsWrap) return;
    const dots = dotsWrap.querySelectorAll('.cube-dot');
    dots.forEach((d, i)=> d.classList.toggle('is-active', i===state.index));
  }

  // Drag/Swipe
  function onDown(e){
    state.dragging = true;
    track.classList.add('is-dragging');
    state.startX = (e.touches ? e.touches[0].clientX : e.clientX);
    const m = getComputedStyle(track).transform;
    const tx = m !== 'none' ? parseFloat(m.split(',')[4]) : 0;
    state.startTx = tx || 0;
  }
  function onMove(e){
    if(!state.dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = x - state.startX;
    track.style.transform = `translate3d(${state.startTx + dx}px,0,0)`;
  }
  function onUp(e){
    if(!state.dragging) return;
    state.dragging = false;
    track.classList.remove('is-dragging');
    const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
    const dx = x - state.startX;
    const threshold = 50;
    if(dx < -threshold) next();
    else if(dx > threshold) prev();
    else update(); // snap back
  }

  // Autoplay
  function startAuto(){
    if(state.timer || !state.autoplay) return;
    state.timer = setInterval(()=>{
      const maxIndex = Math.max(0, CUBE_ITEMS.length - state.perView);
      if(state.index >= maxIndex) goTo(0);
      else next();
    }, 6000);
  }
  function stopAuto(){
    if(state.timer){ clearInterval(state.timer); state.timer = null; }
  }

  // Eventos
  window.addEventListener('resize', recompute);
  if(btnNext) btnNext.addEventListener('click', ()=>{ stopAuto(); next(); startAuto(); });
  if(btnPrev) btnPrev.addEventListener('click', ()=>{ stopAuto(); prev(); startAuto(); });

  viewport.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  viewport.addEventListener('touchstart', onDown, {passive:true});
  window.addEventListener('touchmove', onMove, {passive:true});
  window.addEventListener('touchend', onUp);

  // Init
  buildDots();
  recompute();
  startAuto();
})();
