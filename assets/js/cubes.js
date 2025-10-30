  /* ========= Carrusel de cubos ========= */
  (function initCubeCarousel(){
    const root = document.querySelector('.cube-carousel');
    if(!root) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const autoplay = root.dataset.autoplay === 'true' && !prefersReduced;
    const intervalMs = parseInt(root.dataset.interval || '3200', 10);
    const shuffle = root.dataset.shuffle === 'true';

    const track = document.getElementById('cubeTrack');
    const dotsEl = document.getElementById('cubeDots');
    const btnPrev = document.getElementById('cubePrev');
    const btnNext = document.getElementById('cubeNext');

    const ITEMS = Array.from({length:12}).map((_,i)=>({
      id: i+1,
      titulo: `Artículo ${i+1}: Placeholder`,
      resumen: `Resumen breve del contenido ${i+1}. Texto ficticio para probar el layout.`,
      img: `assets/placeholder_${(i%6)+1}.jpg`,
      href: "#"
    }));

    if(shuffle) ITEMS.sort(()=>Math.random()-.5);

    const makeCube = (item) => {
      const li = document.createElement('article');
      li.className = 'cube';
      li.setAttribute('role','listitem');
      li.innerHTML = `
        <div class="cube-media"><img src="${item.img}" alt="Imagen del ${item.titulo}" loading="lazy"></div>
        <div class="cube-body">
          <h4 class="cube-title">${item.titulo}</h4>
          <div class="cube-meta">${item.resumen}</div>
          <a class="cube-link" href="${item.href}">Ver más</a>
        </div>`;
      return li;
    };

    const baseNodes = ITEMS.map(makeCube);
    const cloneNodes = ITEMS.map(makeCube);
    baseNodes.forEach(n=>track.appendChild(n));
    cloneNodes.forEach(n=>track.appendChild(n));

    track.setAttribute('role','list');

    ITEMS.forEach((_,idx)=>{
      const d = document.createElement('span');
      d.className = 'cube-dot' + (idx===0?' is-active':'');
      dotsEl.appendChild(d);
    });

    let index = 0;
    let timer = null;
    let itemWidth = () => (track.querySelector('.cube')?.getBoundingClientRect().width || 0) + 14;
    let max = ITEMS.length;

    const setActiveDot = (i)=>{
      const dots = Array.from(dotsEl.children);
      dots.forEach((el,ix)=> el.classList.toggle('is-active', ix === (i % max)));
    };

    const jumpIfNeeded = ()=>{
      if(index >= max){
        index = index % max;
        track.style.transition = 'none';
        track.style.transform = `translateX(${-index*itemWidth()}px)`;
        void track.offsetWidth;
        track.style.transition = '';
      } else if(index < 0){
        index = (index + max) % max + max;
        track.style.transition = 'none';
        track.style.transform = `translateX(${-index*itemWidth()}px)`;
        void track.offsetWidth;
        track.style.transition = '';
      }
    };

    const goTo = (i)=>{ index = i; track.style.transform = `translateX(${-index*itemWidth()}px)`; setActiveDot(index); };
    const next = ()=>{ goTo(index+1); };
    const prev = ()=>{ goTo(index-1); };

    const start = ()=>{ if(timer || !autoplay) return; timer = setInterval(()=>{ next(); jumpIfNeeded(); }, intervalMs); };
    const stop  = ()=>{ clearInterval(timer); timer = null; };

    root.addEventListener('mouseenter', ()=>{ stop(); });
    root.addEventListener('mouseleave', ()=>{ start(); });
    root.addEventListener('focusin', ()=>{ stop(); });
    root.addEventListener('focusout', ()=>{ start(); });

    btnNext.addEventListener('click', ()=>{ stop(); next(); jumpIfNeeded(); });
    btnPrev.addEventListener('click', ()=>{ stop(); prev(); jumpIfNeeded(); });

    let touchX = null, deltaX = 0, swiping = false;
    root.addEventListener('touchstart', (e)=>{ touchX = e.touches[0].clientX; deltaX = 0; swiping = true; stop(); }, {passive:true});
    root.addEventListener('touchmove', (e)=>{
      if(!swiping) return;
      deltaX = e.touches[0].clientX - touchX;
      track.style.transition = 'none';
      track.style.transform = `translateX(${-(index*itemWidth()) + deltaX}px)`;
    }, {passive:true});
    root.addEventListener('touchend', ()=>{
      track.style.transition = '';
      if(Math.abs(deltaX) > itemWidth()*0.25){ (deltaX < 0) ? next() : prev(); jumpIfNeeded(); } else { goTo(index); }
      swiping = false; start();
    });

    window.addEventListener('resize', ()=>{ goTo(index); });

    goTo(0);
    if(autoplay) start();
  })();
