/* ============================================
   Tools UI
   - Consistencia de niveles (medidor)
   - Paginación en "Herramientas" (2+ páginas)
   ============================================ */

(function(){
  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    // 1) Normaliza medidores segun data-level
    normalizeMeters();

    // 2) Paginación en la lista de herramientas (columna izquierda)
    const toolsList = document.getElementById('toolsList') || $('[id="toolsList"]') || $('.tools-list'); // fallback
    if (toolsList) enablePaging(toolsList, { perPage: 8 });
  });

  function normalizeMeters(){
    $$('.tool-btn[data-level]').forEach(btn=>{
      const lvl = btn.getAttribute('data-level');
      const bar = $('.meter i', btn);
      if(!bar) return;
      let w = 50;
      if(lvl==='alto') w = 90;
      else if(lvl==='medio-alto') w = 75;
      else if(lvl==='medio') w = 55;
      bar.style.width = w + '%';
    });
  }

  /* ------------- PAGINACIÓN ------------- */

  function enablePaging(listEl,{perPage=8}={}){
    const items = $$('.tool-btn', listEl);
    if (items.length <= perPage) return; // no hace falta paginar

    const pages = chunk(items, perPage);
    let page = 0;

    // Contenedor de paginación (flechas + dots)
    const pager = document.createElement('div');
    pager.className = 'tools-pager';
    const prev = mkArrow('‹'); prev.classList.add('tools-prev');
    const next = mkArrow('›'); next.classList.add('tools-next');
    const dots = document.createElement('div'); dots.className = 'tools-dots';

    pager.appendChild(prev);
    pager.appendChild(dots);
    pager.appendChild(next);

    // Inserta pager al final de la tarjeta (columna izquierda)
    const card = listEl.closest('.tools-card') || listEl.parentElement;
    card.appendChild(pager);

    // Crea dots
    const dotEls = pages.map((_,i)=>{
      const d = document.createElement('span');
      d.className = 'tools-dot' + (i===0 ? ' is-active':'');
      d.addEventListener('click', ()=>render(i));
      dots.appendChild(d);
      return d;
    });

    prev.addEventListener('click', ()=> render(page-1));
    next.addEventListener('click', ()=> render(page+1));

    render(0);

    function render(p){
      page = clamp(p, 0, pages.length-1);
      // Oculta todo
      items.forEach(it=> it.style.display='none');
      // Muestra los de la página actual
      pages[page].forEach(it=> it.style.display='flex');

      // Dots activos
      dotEls.forEach((d,i)=> d.classList.toggle('is-active', i===page));
      // Flechas
      prev.disabled = (page===0);
      next.disabled = (page===pages.length-1);
    }
  }

  /* Helpers */
  function chunk(arr, size){
    const out = [];
    for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size));
    return out;
  }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function mkArrow(txt){
    const b=document.createElement('button');
    b.type='button'; b.className='tools-arrow'; b.textContent=txt;
    return b;
  }
})();
