/* Tabla "Ultra PRO v4" — encapsulada, no rompe nada más del sitio */
(function(){
  const root = document.getElementById('tools-pro');
  if(!root) return;

  /* ===== Datos ===== */
  const tools = [
    { name:"Ansible",     os:"linux",   icon:"fa-brands fa-redhat" },
    { name:"Docker",      os:"multi",   icon:"fa-brands fa-docker" },
    { name:"Kali / Nmap", os:"linux",   icon:"fa-solid fa-magnifying-glass" },
    { name:"Burp Suite",  os:"windows", icon:"fa-solid fa-bug" },
    { name:"Metasploit",  os:"linux",   icon:"fa-solid fa-skull-crossbones" },
    { name:"OpenVAS",     os:"linux",   icon:"fa-solid fa-shield-halved" },
    { name:"Wireshark",   os:"windows", icon:"fa-solid fa-wave-square" },
    { name:"pfSense",     os:"linux",   icon:"fa-solid fa-network-wired" },
    { name:"ZAP",         os:"multi",   icon:"fa-solid fa-bolt" },
    { name:"Terraform",   os:"linux",   icon:"fa-solid fa-cubes" },
    { name:"Podman",      os:"linux",   icon:"fa-solid fa-boxes-stacked" },
    { name:"Nessus",      os:"windows", icon:"fa-solid fa-spider" }
  ];

  /* ===== Estado / refs ===== */
  const state = {
    page: 0,
    perPage: root.querySelectorAll('#langsBody .row').length,
    query: '',
    os: new Set(),
    selected: new Set()
  };

  const list = root.querySelector('#toolsListNew');
  const dots = root.querySelector('#pagerDots');
  const counter = root.querySelector('#pageCounter');
  const prevBtn = root.querySelector('#prevBtn');
  const nextBtn = root.querySelector('#nextBtn');
  const toolsCard = root.querySelector('#toolsCard');
  const langsCard = root.querySelector('#langsCard');
  const resultCount = root.querySelector('#resultCount');
  const searchBox = root.querySelector('#searchBox');
  const searchInput = root.querySelector('#searchInput');
  const clearBtn = root.querySelector('#clearBtn');

  /* ===== Filtros ===== */
  let searchTimer = null;
  searchInput.addEventListener('input', e=>{
    clearTimeout(searchTimer);
    searchTimer = setTimeout(()=>{
      state.query = e.target.value.trim().toLowerCase();
      searchBox.classList.toggle('has-text', !!state.query);
      state.page = 0; render(true);
    }, 120);
  });
  clearBtn.addEventListener('click', ()=>{
    searchInput.value=''; state.query=''; searchBox.classList.remove('has-text'); state.page=0; render(true);
  });

  root.querySelectorAll('.tag').forEach(tag=>{
    tag.addEventListener('click', ()=>{
      const val = tag.dataset.os;
      if(tag.classList.toggle('on')) state.os.add(val);
      else state.os.delete(val);
      state.page = 0; render(true);
    });
  });

  function chip(os){
    const map = {
      linux:   { cls:'chip linux',   label:'Linux',   icon:'fa-brands fa-linux', tip:'Disponible en Linux' },
      windows: { cls:'chip windows', label:'Windows', icon:'fa-brands fa-windows', tip:'Disponible en Windows' },
      multi:   { cls:'chip multi',   label:'Multi',   icon:'fa-solid fa-layer-group', tip:'Disponible en varios sistemas' }
    };
    const d = map[os] || map.multi;
    return `<span class="${d.cls}" data-tooltip="${d.tip}"><i class="${d.icon}"></i>${d.label}</span>`;
  }

  function applyFilters(items){
    let out = items;
    if(state.query){ out = out.filter(t => t.name.toLowerCase().includes(state.query)); }
    if(state.os.size){ out = out.filter(t => state.os.has(t.os)); }
    return out;
  }

  // Selección + pulso
  function bindSelectableRows(scope=root){
    scope.querySelectorAll('.row[role="button"]').forEach(row=>{
      const pulseOnce = ()=>{
        row.classList.add('pulse');
        const handler = ()=>{ row.classList.remove('pulse'); row.removeEventListener('animationend', handler); };
        row.addEventListener('animationend', handler);
      };
      row.addEventListener('click', ()=>{
        const id = row.dataset.id;
        if(state.selected.has(id)) state.selected.delete(id); else state.selected.add(id);
        row.classList.toggle('active');
        row.setAttribute('aria-pressed', state.selected.has(id) ? 'true' : 'false');
        pulseOnce();
      });
      row.addEventListener('keydown', (e)=>{
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); row.click(); }
      });
    });
  }

  // ===== Altura estable =====
  let lockedHeight = 0;
  function lockHeights(){
    toolsCard.style.setProperty('--locked-card-height','auto');
    langsCard.style.setProperty('--locked-card-height','auto');
    const h = Math.max(toolsCard.offsetHeight, langsCard.offsetHeight);
    lockedHeight = Math.max(lockedHeight, h);
    toolsCard.style.setProperty('--locked-card-height', lockedHeight + 'px');
    langsCard.style.setProperty('--locked-card-height', lockedHeight + 'px');
  }
  function resetLock(){
    lockedHeight = 0;
    toolsCard.style.setProperty('--locked-card-height','auto');
    langsCard.style.setProperty('--locked-card-height','auto');
  }

  function render(withEntrance=false){
    const filtered = applyFilters(tools);
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
    state.page = Math.min(state.page, totalPages-1);

    const start = state.page * state.perPage;
    const items = filtered.slice(start, start + state.perPage);

    list.innerHTML = items.map(t => {
      const active = state.selected.has(t.name) ? 'active' : '';
      return `
      <div class="row ${active}" data-id="${t.name}" role="button" aria-pressed="${!!active}" tabindex="0" title="${t.name}">
        <div class="left"><i class="${t.icon}"></i> ${t.name}</div>
        <div class="right">${chip(t.os)}</div>
      </div>`;
    }).join('');

    dots.innerHTML = Array.from({length: totalPages}, (_,i)=>`<span class="dot ${i===state.page?'active':''}"></span>`).join('');
    counter.textContent = `${state.page+1}/${totalPages}`;
    resultCount.textContent = filtered.length;

    prevBtn.disabled = state.page===0;
    nextBtn.disabled = state.page===totalPages-1;

    bindSelectableRows(list);

    if(withEntrance){
      const rows = list.querySelectorAll('.row');
      rows.forEach((row, i)=>{
        row.classList.add('page-enter');
        row.style.animationDelay = `${i*40}ms`;
        row.addEventListener('animationend', ()=>{ row.classList.remove('page-enter'); row.style.animationDelay=''; }, {once:true});
      });
    }

    lockHeights();
  }

  // Recalcular lock cuando cambien filtros o tamaño de ventana
  function refitAfterChange(action){
    resetLock(); action();
    requestAnimationFrame(()=> lockHeights());
  }

  prevBtn.addEventListener('click', ()=>{ if(state.page>0){ state.page--; render(true); }});
  nextBtn.addEventListener('click', ()=>{
    const filtered = applyFilters(tools);
    const tp = Math.max(1, Math.ceil(filtered.length/state.perPage));
    if(state.page<tp-1){ state.page++; render(true); }
  });

  window.addEventListener('resize', ()=> refitAfterChange(()=>render(false)));

  // Primera carga
  window.addEventListener('load', ()=>{
    render(true);
    requestAnimationFrame(()=> lockHeights());
  });
})();
