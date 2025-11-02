 /* ========= Utilidades NAV (panel lateral nivel 3 con paginación) ========= */
  function chunkArray(arr, size){ const out=[]; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }

  function renderSidePage(sideEl, state){
    const listEl = sideEl.querySelector('.side-list');
    listEl.innerHTML = '';

    const current = state.pages[state.page] || [];
    current.forEach(a => {
      const li = document.createElement('li');
      li.appendChild(a.cloneNode(true));
      listEl.appendChild(li);
    });

    let pager = sideEl.querySelector('.pager');
    if (!pager) { pager = document.createElement('div'); pager.className = 'pager'; sideEl.appendChild(pager); }
    pager.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = 'pager-btn prev'; prev.title = 'Página anterior';
    prev.disabled = state.page === 0; prev.dataset.page = state.page > 0 ? (state.page) : '';

    const next = document.createElement('button');
    next.className = 'pager-btn next'; next.title = 'Página siguiente';
    next.disabled = state.page >= state.pages.length - 1; next.dataset.page = state.page < state.pages.length - 1 ? (state.page + 2) : '';

    const info = document.createElement('span');
    info.className = 'pager-info';
    info.textContent = `Página ${state.page + 1} de ${state.pages.length}`;

    [prev, next].forEach(b=>{
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => {
        const folder = b.closest('.nav-folder');
        if (folder) setOpen(folder, true);
      });
    });

    prev.addEventListener('click', () => { if (state.page > 0) { state.page--; renderSidePage(sideEl, state); }});
    next.addEventListener('click', () => { if (state.page < state.pages.length - 1) { state.page++; renderSidePage(sideEl, state); }});

    pager.append(info, prev, next);
  }

  function swapSideContent(sideEl, newTitle, newLinksArray) {
    const titleEl = sideEl.querySelector('.side-title');
    sideEl._pagesByKey = sideEl._pagesByKey || new Map();

    const perPage = 6;
    const pages = chunkArray(newLinksArray, perPage);

    const key = newTitle;
    const prevState = sideEl._pagesByKey.get(key) || { page: 0, pages: [] };
    const state = { page: Math.min(prevState.page, Math.max(pages.length - 1, 0)), pages };
    sideEl._pagesByKey.set(key, state);

    if (sideEl.dataset.key !== newTitle) {
      sideEl.classList.remove('swap-in'); sideEl.classList.add('swap-out');
      clearTimeout(sideEl._swapTimer);
      sideEl._swapTimer = setTimeout(() => {
        sideEl.dataset.key = newTitle;
        titleEl.textContent = newTitle;
        renderSidePage(sideEl, state);
        void sideEl.offsetWidth;
        sideEl.classList.remove('swap-out'); sideEl.classList.add('swap-in');
      }, 120);
    } else {
      renderSidePage(sideEl, state);
    }
  }

  function positionSideAligned(sideEl, anchorEl, subEl){
    const listEl   = subEl.querySelector(':scope > ul');
    const subRect  = subEl.getBoundingClientRect();
    const listRect = listEl.getBoundingClientRect();
    const aRect    = anchorEl.getBoundingClientRect();
    const sideH    = sideEl.getBoundingClientRect().height;

    const desiredTop = aRect.top - subRect.top;
    const minTop     = listRect.top - subRect.top;
    const maxTop     = (listRect.bottom - subRect.top) - sideH;

    let top;
    if (maxTop < minTop) top = minTop; else top = Math.min(Math.max(desiredTop, minTop), maxTop);
    sideEl.style.top = `${top}px`;
  }

  /* ========= Render del NAV ========= */
  function createNode(node){
    if(!node.children){
      const a=document.createElement('a');
      a.className='nav-link'; a.href=node.href||'#'; a.textContent=node.label;
      return a;
    }

    const wrap=document.createElement('div');
    wrap.className='nav-folder'; wrap.setAttribute('aria-open','false');
    if (node.label === "Portafolio") wrap.dataset.sticky = "true";

    const btn=document.createElement('button');
    btn.className='nav-btn'; btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-haspopup','true');
    const labelHTML = node.href ? `<a href="${node.href}" class="nav-btn-link">${node.label}</a>` : `<span>${node.label}</span>`;
    btn.innerHTML=`<span class="ico-folder"></span>${labelHTML}<span class="caret"></span>`;
    wrap.appendChild(btn);

    const sub=document.createElement('div'); sub.className='sub';
    const ul=document.createElement('ul'); sub.appendChild(ul);

    let side = null;
    if (wrap.dataset.sticky === "true") {
      side = document.createElement('div');
      side.className = 'side';
      side.innerHTML = `<div class="side-title">Selecciona una subcarpeta…</div><ul class="side-list"></ul>`;
      sub.appendChild(side);
    }

    node.children.forEach(childLvl1=>{
      const liLvl1=document.createElement('li');

      const link1=document.createElement('a');
      link1.href=childLvl1.href||'#';
      link1.innerHTML=`<span>${childLvl1.label}</span><span style="opacity:.6">›</span>`;
      liLvl1.appendChild(link1);

      const ulLvl2=document.createElement('ul'); ulLvl2.className='nested';

      childLvl1.children?.forEach(childLvl2=>{
        const liLvl2=document.createElement('li');
        const link2=document.createElement('a');
        link2.href=childLvl2.href||'#';
        link2.innerHTML=`<span>${childLvl2.label}</span><span style="opacity:.6">›</span>`;
        liLvl2.appendChild(link2);

        const hiddenLvl3=document.createElement('ul'); hiddenLvl3.style.display='none';
        childLvl2.children?.forEach(a3=>{
          const li3=document.createElement('li');
          const a=document.createElement('a');
          a.href=a3.href||'#'; a.textContent=a3.label;
          li3.appendChild(a); hiddenLvl3.appendChild(li3);
        });
        liLvl2.appendChild(hiddenLvl3);

        if (wrap.dataset.sticky === "true") {
          link2.addEventListener('mouseenter', ()=>{
            const linksLvl3 = Array.from(hiddenLvl3.querySelectorAll('a'));
            const newTitle  = `${childLvl1.label} / ${childLvl2.label}`;

            positionSideAligned(side, link2, sub);
            swapSideContent(side, newTitle, linksLvl3);
            wrap.setAttribute('data-panel','show');
            setTimeout(()=> positionSideAligned(side, link2, sub), 0);
          });

          link2.addEventListener('mouseenter', ()=>{
            liLvl2.classList.add('focus2');
            liLvl2.parentElement.querySelectorAll(':scope > li.focus2')
              .forEach(sib => { if (sib !== liLvl2) sib.classList.remove('focus2'); });
          });
          liLvl2.addEventListener('mouseleave', ()=> liLvl2.classList.remove('focus2'));
          link2.addEventListener('focus', ()=> liLvl2.classList.add('focus2'));
          link2.addEventListener('blur' , ()=> liLvl2.classList.remove('focus2'));
        }

        ulLvl2.appendChild(liLvl2);
      });

      liLvl1.appendChild(ulLvl2);
      ul.appendChild(liLvl1);

      link1.addEventListener('mouseenter', ()=>{ liLvl1.classList.add('open'); });
    });

    btn.addEventListener('click', e=>{
      e.preventDefault();
      const open = wrap.getAttribute('aria-open')==='true';
      setOpen(wrap, !open);
    });

    btn.addEventListener('keydown', e=>{
      if(e.key==='Escape') setOpen(wrap,false,true);
      if(e.key==='ArrowDown'){ setOpen(wrap,true); ul.querySelector('a')?.focus(); }
    });

    wrap.appendChild(sub);
    return wrap;
  }

  function setOpen(folder, open, resetInternos=false){
    folder.setAttribute('aria-open', open?'true':'false');
    folder.querySelector('.nav-btn').setAttribute('aria-expanded', open?'true':'false');

    if(open){
      document.querySelectorAll('.nav-folder').forEach(f=>{
        if(f!==folder){
          f.setAttribute('aria-open','false');
          f.querySelector('.nav-btn').setAttribute('aria-expanded','false');
          f.removeAttribute('data-panel');
        }
      });
    } else if (resetInternos){
      folder.removeAttribute('data-panel');
      folder.querySelectorAll(':scope .sub > ul > li').forEach(li=>li.classList.remove('open'));
    }
  }

  function renderNav(tree){
    const nav = document.getElementById('nav');
    tree.forEach(node => nav.appendChild(createNode(node)));

    const timers = new WeakMap();
    document.querySelectorAll('.nav-folder').forEach(folder=>{
      folder.addEventListener('mouseenter', ()=>{
        const t = timers.get(folder); if(t) clearTimeout(t);
        setOpen(folder, true);
      });
      folder.addEventListener('mouseleave', ()=>{
        const t = setTimeout(()=> setOpen(folder,false,true), 220);
        timers.set(folder,t);
      });
    });

    document.addEventListener('click', (e)=>{
      if (e.target.closest('.pager-btn')) return;
      const anyOpen = document.querySelector('.nav-folder[aria-open="true"]');
      if(anyOpen && !anyOpen.contains(e.target)) setOpen(anyOpen,false,true);
    });

    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('.pager-btn');
      if (!btn) return;
      const folder = btn.closest('.nav-folder');
      if (folder) setOpen(folder, true);
    });
  }
 renderNav(NAV_TREE);

