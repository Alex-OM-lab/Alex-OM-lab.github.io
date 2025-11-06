// graph.js — Árbol abierto + límite 6/6 + iluminación por rama + botón “Encender panel”

const SiteGraph = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const MAX_L2 = 6; // máximo de carpetas (nivel 2) por cada área
  const MAX_L3 = 6; // máximo de artículos (nivel 3) por cada carpeta

  const G = {
    svg:null, root:null, stage:null,
    layers:null, colsNodes:[[],[],[],[]],
    state:{ sel0:null, sel1:null, sel2:null },
    prevSel:{ sel0:null, sel1:null, sel2:null },

    // mapas global->local
    mapL1:[], mapL2:[], mapL3:[],

    // Layout
    colX:[120, 460, 940, 1300],
    nodeW:[230, 250, 280, 260],
    nodeH:56, vGap:22, colStep:260,

    // pan/zoom
    tx:0, ty:0, scale:1, minScale:0.6, maxScale:2.0,

    // data
    TREE:null,

    // UI
    bcEl:null, searchUI:null, searchInput:null,

    // flags
    allOpen:true,
    _ambient:null,
  };

  /* ===== Helpers ===== */
  function clear(g){ while(g.firstChild) g.removeChild(g.firstChild); }
  function applyTransform(){ if (G.root) G.root.setAttribute('transform', `translate(${G.tx},${G.ty}) scale(${G.scale})`); }
  function ptSvg(x,y){ const p=G.svg.createSVGPoint(); p.x=x; p.y=y; return p; }
  function screenToRoot(x,y){ const p=ptSvg(x,y); const m=G.root.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : {x,y}; }
  const changedLevel = lvl => G.prevSel[`sel${lvl}`] !== G.state[`sel${lvl}`];

  function clampNodeWidth(level, wNeeded){
    const maxPerCol = Math.floor(G.colStep * 0.90);
    const minBase   = G.nodeW[level];
    return Math.max(minBase, Math.min(wNeeded, maxPerCol));
  }

  function relayoutColumns(){
    const bb = G.svg.getBoundingClientRect();
    const L = 4, marginX = 100;
    const usable = Math.max(900, bb.width - marginX*2);
    const step = usable / (L-1);
    G.colStep = step;
    G.colX = Array.from({length:L}, (_,i)=> marginX + i*step);
    G.nodeW = [230, 250, 280, 260].map(w=> Math.min(w, Math.floor(step*0.70)));
  }

  function ensureLayers(){
    if (G.layers) return;
    const mk = id => { const g=document.createElementNS(NS,'g'); g.setAttribute('id',id); G.root.appendChild(g); return g; };
    const links01 = mk('links01'), links12 = mk('links12'), links23 = mk('links23');
    const col0=mk('col0'), col1=mk('col1'), col2=mk('col2'), col3=mk('col3');
    const ui=mk('uiLayer');
    G.layers = { cols:[col0,col1,col2,col3], links:[links01,links12,links23], ui };
    G.colsNodes=[[],[],[],[]];
    G.mapL1=[]; G.mapL2=[]; G.mapL3=[];
  }

  function clearAll(){
    clear(G.layers.cols[0]); clear(G.layers.cols[1]); clear(G.layers.cols[2]); clear(G.layers.cols[3]);
    clear(G.layers.links[0]); clear(G.layers.links[1]); clear(G.layers.links[2]);
    G.colsNodes=[[],[],[],[]]; G.mapL1=[]; G.mapL2=[]; G.mapL3=[];
  }

  /* ====== Texto (wrap 2 líneas + elipsis + tooltip) ====== */
  const PAD_L = 14, PAD_R = 14, BADGE_BLOCK = 34, LINE_H = 18;
  function textLength(el){ return (el.getComputedTextLength ? el.getComputedTextLength() : el.getBBox().width) || 0; }
  function trimToWidth(str, el, maxW){ let s=str; el.textContent=s+'…'; while(textLength(el)>maxW && s.length>0){ s=s.slice(0,-1); el.textContent=s+'…'; } return el.textContent; }
  function wrapTitleToTwoLines(textEl, fullText, availW){
    textEl.textContent = '';
    const t1 = document.createElementNS(NS,'tspan');
    const t2 = document.createElementNS(NS,'tspan');
    t1.setAttribute('x', 14); t1.setAttribute('dy', 0);
    t2.setAttribute('x', 14); t2.setAttribute('dy', LINE_H);
    const words = fullText.split(/\s+/);
    let line1='', i=0;
    while(i<words.length){
      const test=(line1?line1+' ':'')+words[i];
      t1.textContent=test; textEl.appendChild(t1);
      if(textLength(textEl)<=availW){ line1=test; i++; textEl.removeChild(t1); }
      else { textEl.removeChild(t1); break; }
    }
    t1.textContent=line1||words[i++]||'';
    const rest=words.slice(i).join(' ');
    if(rest){
      t2.textContent=rest; textEl.appendChild(t1); textEl.appendChild(t2);
      if(textLength(textEl)>availW){
        const probe=document.createElementNS(NS,'text'); probe.setAttribute('class', textEl.getAttribute('class'));
        const p2=document.createElementNS(NS,'tspan'); p2.textContent=rest; probe.appendChild(p2); textEl.parentNode.appendChild(probe);
        trimToWidth(rest,p2,availW); t2.textContent=p2.textContent; probe.remove();
      }
    }else{ textEl.appendChild(t1); }
  }
  function fitNodeContent(g, level, titleEl, subEl, rectEl, badgeRect, badgeText){
    const baseW = parseFloat(rectEl.getAttribute('width')) || G.nodeW[level];
    const tryWidth = (w)=>{
      const availW = w - PAD_L - BADGE_BLOCK - PAD_R;
      wrapTitleToTwoLines(titleEl, titleEl.getAttribute('data-full') || titleEl.textContent, availW);
      const lines = titleEl.querySelectorAll('tspan'); let titleMax=0;
      lines.forEach(tspan=>{
        const probe=document.createElementNS(NS,'text'); probe.setAttribute('class', titleEl.getAttribute('class'));
        const p2=document.createElementNS(NS,'tspan'); p2.textContent=tspan.textContent; probe.appendChild(p2); titleEl.parentNode.appendChild(probe);
        titleMax=Math.max(titleMax,(probe.getComputedTextLength?probe.getComputedTextLength():probe.getBBox().width)||0); probe.remove();
      });
      const subW = subEl ? (subEl.getBBox().width||0) : 0;
      return PAD_L + Math.max(titleMax, subW) + BADGE_BLOCK + PAD_R;
    };
    let needed=Math.ceil(tryWidth(baseW));
    let finalW=clampNodeWidth(level, needed);
    if(finalW<needed){ const maxPerCol=Math.floor(G.colStep*0.90); needed=Math.ceil(tryWidth(maxPerCol)); finalW=clampNodeWidth(level, needed); }
    rectEl.setAttribute('width', finalW); badgeRect.setAttribute('x', finalW - BADGE_BLOCK); badgeText.setAttribute('x', finalW - (BADGE_BLOCK - 11));
    let tip=g.querySelector('title'); if(!tip){ tip=document.createElementNS(NS,'title'); g.appendChild(tip); }
    tip.textContent=titleEl.getAttribute('data-full')||titleEl.textContent;
  }

  /* ====== Dibujo ====== */
  function drawNode({level,x,y,w,h,title,sub,onClick,delay=0, parentEl=null}){
    const g = document.createElementNS(NS,'g');
    g.classList.add('node','sleep');
    g.dataset.lvl=String(level);
    g._parent = parentEl;               // referencia al padre para iluminar ramas
    g.setAttribute('transform',`translate(${x},${y})`);
    g.addEventListener('mouseenter',()=>g.classList.add('hovered'));
    g.addEventListener('mouseleave',()=>g.classList.remove('hovered'));
    if(onClick) g.addEventListener('click', onClick);

    const inner=document.createElementNS(NS,'g'); inner.classList.add('node-in'); g.appendChild(inner);

    const r=document.createElementNS(NS,'rect'); r.setAttribute('width',w); r.setAttribute('height',h); inner.appendChild(r);
    const t=document.createElementNS(NS,'text'); t.setAttribute('x',14); t.setAttribute('y',22); t.setAttribute('class','title'); t.setAttribute('data-full',title); t.textContent=title; inner.appendChild(t);
    let s=null; if(sub){ s=document.createElementNS(NS,'text'); s.setAttribute('x',14); s.setAttribute('y',40); s.setAttribute('class','sub'); s.textContent=sub; inner.appendChild(s); }

    const bkg=document.createElementNS(NS,'rect'); bkg.setAttribute('x',w-34); bkg.setAttribute('y',8); bkg.setAttribute('width',22); bkg.setAttribute('height',16); bkg.setAttribute('rx','6'); bkg.setAttribute('fill', level===0?'var(--accent)':'#ffd79a'); inner.appendChild(bkg);
    const bt=document.createElementNS(NS,'text'); bt.setAttribute('x',w-23); bt.setAttribute('y',20); bt.setAttribute('class','badge'); bt.textContent=level; inner.appendChild(bt);

    G.layers.cols[level].appendChild(g);
    fitNodeContent(g, level, t, s, r, bkg, bt);

    requestAnimationFrame(()=> setTimeout(()=> g.classList.add('is-in'), delay));

    return {x,y,w:parseFloat(r.getAttribute('width')),h, el:g, _parent: parentEl };
  }

  function drawLink(from,to,level,delay=0){
    const path=document.createElementNS(NS,'path');
    const x1=from.x+from.w, y1=from.y+from.h/2;
    const x2=to.x,           y2=to.y+to.h/2;
    const dx=Math.max(60,(x2-x1)/2);
    path.setAttribute('d',`M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`);
    path.setAttribute('class',`link l${level} sleep`);
    path._from = from.el; // referencia al nodo padre
    path.classList.add('flow');
    G.layers.links[level-1].appendChild(path);
    setTimeout(()=> path.classList.add('draw'), delay);
    return path;
  }

  function layoutY(count){
    const H=G.svg.getBoundingClientRect().height||640;
    const total=count*G.nodeH + Math.max(0,(count-1))*G.vGap;
    const y0=Math.max(30,(H-total)/2);
    return ix=> y0 + ix*(G.nodeH+G.vGap);
  }

  /* ===== Render: TODO ABIERTO con límites ===== */
  const STAGGER_BASE=30, STAGGER_STEP=30;

  function renderAllOpen(){
    clearAll();
    if(!G.TREE?.length) return;

    // Totales con límite por nivel
    const roots = G.TREE.map(r=>r.raiz);
    const totalAreas = G.TREE.reduce((acc,r)=> acc + (r.areas?.length||0), 0);
    const totalSubs  = G.TREE.reduce((acc,r)=> acc + (r.areas||[]).reduce((a,ar)=> a + Math.min(MAX_L2, (ar.subcarpetas?.length||0)),0), 0);
    const totalItems = G.TREE.reduce((acc,r)=> acc + (r.areas||[]).reduce((a,ar)=> a + (ar.subcarpetas||[]).slice(0,MAX_L2).reduce((b,sc)=>{
      const items = (window.GRAPH_MAKE_SIX ? window.GRAPH_MAKE_SIX(sc) : []);
      return b + Math.min(MAX_L3, items.length);
    },0),0), 0);

    const y0 = layoutY(roots.length);
    const y1 = layoutY(totalAreas);
    const y2 = layoutY(totalSubs);
    const y3 = layoutY(totalItems);

    let ix0=0, ix1=0, ix2=0, ix3=0;

    // --- Nivel 0 ---
    const L0 = G.colsNodes[0] = roots.map((txt,i)=>{
      const box=drawNode({
        level:0, x:G.colX[0], y:y0(ix0++), w:G.nodeW[0], h:G.nodeH, title:txt,
        onClick:()=>{ G.state.sel0=i; G.state.sel1=null; G.state.sel2=null; rememberSel(); updateBreadcrumb(); wakeBranch(true); routeVibes(); }
      });
      return box;
    });

    // --- Nivel 1 ---
    G.TREE.forEach((r,ri)=>{
      (r.areas||[]).forEach((a,aj)=>{
        const box=drawNode({
          level:1, x:G.colX[1], y:y1(ix1), w:G.nodeW[1], h:G.nodeH, title:a.nombre,
          parentEl: L0[ri].el,
          onClick:()=>{ G.state.sel0=ri; G.state.sel1=ix1; G.state.sel2=null; rememberSel(); updateBreadcrumb(); wakeBranch(true); routeVibes(); },
          delay: STAGGER_BASE + (ix1%10)*STAGGER_STEP
        });
        box._link = drawLink(L0[ri], box, 1, STAGGER_BASE + (ix1%10)*STAGGER_STEP);
        G.colsNodes[1].push(box);
        G.mapL1[ix1] = {root:ri, area:aj};
        ix1++;
      });
    });

    // --- Nivel 2 (capado a 6 por área) ---
    const L1 = G.colsNodes[1];
    let areaGlobal=0;
    G.TREE.forEach((r,ri)=>{
      (r.areas||[]).forEach((a,aj)=>{
        const left = L1[areaGlobal];
        (a.subcarpetas||[]).slice(0,MAX_L2).forEach((s,sk)=>{
          const box=drawNode({
            level:2, x:G.colX[2], y:y2(ix2), w:G.nodeW[2], h:G.nodeH, title:s,
            parentEl: left.el,
            onClick:()=>{ G.state.sel0=ri; G.state.sel1=areaGlobal; G.state.sel2=ix2; rememberSel(); updateBreadcrumb(); wakeBranch(true); routeVibes(); },
            delay: STAGGER_BASE + (ix2%10)*STAGGER_STEP
          });
          box._link = drawLink(left, box, 2, STAGGER_BASE + (ix2%10)*STAGGER_STEP);
          G.colsNodes[2].push(box);
          G.mapL2[ix2] = {root:ri, area:aj, sub:sk, areaGlobal};
          ix2++;
        });
        areaGlobal++;
      });
    });

    // --- Nivel 3 (capado a 6 por subcarpeta) ---
    const L2 = G.colsNodes[2];
    let subGlobal=0;
    G.TREE.forEach((r,ri)=>{
      (r.areas||[]).forEach((a,aj)=>{
        (a.subcarpetas||[]).slice(0,MAX_L2).forEach((s,sk)=>{
          const left = L2[subGlobal];
          const allItems = (window.GRAPH_MAKE_SIX ? window.GRAPH_MAKE_SIX(s) : []);
          allItems.slice(0,MAX_L3).forEach((txt,ti)=>{
            const box=drawNode({
              level:3, x:G.colX[3], y:y3(ix3), w:G.nodeW[3], h:G.nodeH, title:txt, sub:"↗",
              parentEl: left?.el || null,
              onClick:()=>{/* futuro: abrir enlace */},
              delay: STAGGER_BASE + (ix3%10)*STAGGER_STEP
            });
            if(left){
              box._link = drawLink(left, box, 3, STAGGER_BASE + (ix3%10)*STAGGER_STEP);
            }
            G.colsNodes[3].push(box);
            G.mapL3[ix3] = {root:ri, area:aj, sub:sk, item:ti, subGlobal};
            ix3++;
          });
          subGlobal++;
        });
      });
    });

    applySleepState();
    // mantener L0 visible
    G.colsNodes[0].forEach(b=> b?.el.classList.remove('sleep'));
  }

  /* ===== Dormir/Despertar con filtros por padre ===== */
  function applySleepState(){
    G.root.querySelectorAll('.node').forEach(n=>n.classList.add('sleep'));
    G.root.querySelectorAll('.link').forEach(l=>l.classList.add('sleep'));
    if (G.state.sel0 == null && G.colsNodes[0]?.length){
      G.colsNodes[0].forEach(b=> b?.el.classList.remove('sleep'));
    }
    wakeBranch(false);
  }

  function wakeBranch(withEffect=true){
    // apaga todo
    G.root.querySelectorAll('.node').forEach(n=>n.classList.add('sleep'));
    G.root.querySelectorAll('.link').forEach(l=>l.classList.add('sleep'));

    // siempre L0 visible
    G.colsNodes[0].forEach(b=> b?.el.classList.remove('sleep'));

    const actNodes=[], actLinks=[];
    const selL0 = G.colsNodes[0][G.state.sel0||0]?.el; // por si hay solo click en L1/L2

    if(G.state.sel0!=null){
      const n0 = G.colsNodes[0][G.state.sel0];
      if(n0){ actNodes.push(n0.el); }
      // áreas hijas de ese L0
      G.colsNodes[1].forEach(b=>{ if(b && b._parent===n0.el){ actNodes.push(b.el); if(b._link) actLinks.push(b._link); } });
    }

    if(G.state.sel1!=null){
      const a = G.colsNodes[1][G.state.sel1];
      if(a){ actNodes.push(a.el); if(a._link) actLinks.push(a._link); }
      // subcarpetas hijas de esa área
      G.colsNodes[2].forEach(b=>{ if(b && b._parent===a.el){ actNodes.push(b.el); if(b._link) actLinks.push(b._link); } });
    }

    if(G.state.sel2!=null){
      const s = G.colsNodes[2][G.state.sel2];
      if(s){ actNodes.push(s.el); if(s._link) actLinks.push(s._link); }
      // items hijos de esa subcarpeta
      G.colsNodes[3].forEach(b=>{ if(b && b._parent===s.el){ actNodes.push(b.el); if(b._link) actLinks.push(b._link); } });
    }

    actNodes.forEach(el=>{ el.classList.remove('sleep'); if(withEffect){ el.classList.add('wake'); setTimeout(()=> el.classList.remove('wake'), 420); } });
    actLinks.forEach(el=>{ el.classList.remove('sleep'); el.classList.add('breathe'); if(withEffect && (changedLevel(0)||changedLevel(1)||changedLevel(2))){ el.classList.add('pulse-once'); setTimeout(()=> el.classList.remove('pulse-once'), 900); } });
  }

  function rememberSel(){ G.prevSel = { sel0:G.state.sel0, sel1:G.state.sel1, sel2:G.state.sel2 }; }

  /* ===== Breadcrumb ===== */
  function updateBreadcrumb(initial=false){
    if(!G.bcEl) return;
    const parts=[];
    if(G.state.sel0!=null){
      const r = G.TREE[G.state.sel0];
      parts.push({t:r.raiz, cb:()=>{ G.state.sel1=null; G.state.sel2=null; rememberSel(); updateBreadcrumb(); wakeBranch(true); routeVibes(); }});
    }
    if(G.state.sel1!=null){
      const map = G.mapL1[G.state.sel1];
      const r = G.TREE[map.root];
      const a = r.areas[map.area];
      parts.push({t:a.nombre, cb:()=>{ G.state.sel2=null; rememberSel(); updateBreadcrumb(); wakeBranch(true); routeVibes(); }});
    }
    if(G.state.sel2!=null){
      const map = G.mapL2[G.state.sel2];
      const name = G.TREE[map.root].areas[map.area].subcarpetas[map.sub];
      parts.push({t:name, cb:()=>{ rememberSel(); updateBreadcrumb(); wakeBranch(true); routeVibes(); }});
    }

    G.bcEl.innerHTML=''; if(parts.length===0){ G.bcEl.style.display='none'; return; } G.bcEl.style.display='flex';
    parts.forEach((p,ix)=>{
      const span=document.createElement('span'); span.className='crumb'; span.textContent=p.t; span.tabIndex=0; span.addEventListener('click', p.cb);
      G.bcEl.appendChild(span);
      if(ix<parts.length-1){ const sep=document.createElement('span'); sep.className='sep'; sep.textContent='›'; G.bcEl.appendChild(sep); }
    });
    if(initial){ G.bcEl.classList.add('bc-in'); }
    else { G.bcEl.classList.remove('bc-in'); requestAnimationFrame(()=> requestAnimationFrame(()=> G.bcEl.classList.add('bc-in'))); }
  }

  /* ===== Ruta viva (solo sobre rama activa) ===== */
  function routeVibes(){
    G.root.querySelectorAll('.link.breathe').forEach(l=> l.classList.remove('breathe'));
    const actives=[];
    if(G.state.sel1!=null){ const a=G.colsNodes[1][G.state.sel1]; if(a?._link) actives.push(a._link); }
    if(G.state.sel2!=null){ const s=G.colsNodes[2][G.state.sel2]; if(s?._link) actives.push(s._link); }
    // items de la sub seleccionada
    if(G.state.sel2!=null){
      G.colsNodes[3].forEach(b=>{ if(b && b._parent===G.colsNodes[2][G.state.sel2].el && b._link) actives.push(b._link); });
    }
    actives.forEach(l=> l.classList.add('breathe'));
  }

  /* ===== Búsqueda (⌘/Ctrl+K) ===== */
  function buildSearchUI(){
    const box=document.createElement('div');
    box.className='graph-search';
    box.innerHTML=`<input id="graphSearchInput" placeholder="Buscar… (Esc para salir)" aria-label="Buscar">
                   <span class="hint">⌘/Ctrl + K</span>`;
    G.stage.appendChild(box);
    G.searchUI=box; G.searchInput=box.querySelector('#graphSearchInput');
    function openSearch(){ box.classList.add('show'); G.searchInput.value=''; G.searchInput.focus(); applySearch(''); }
    function closeSearch(){ box.classList.remove('show'); applySearch(''); G.stage.focus?.(); }
    window.addEventListener('keydown',(e)=>{
      const isMac=navigator.platform.toUpperCase().includes('MAC');
      const combo=isMac? e.metaKey&&e.key.toLowerCase()==='k' : e.ctrlKey&&e.key.toLowerCase()==='k';
      if(combo){ e.preventDefault(); openSearch(); }
      if(e.key==='Escape'){ if(box.classList.contains('show')){ e.preventDefault(); closeSearch(); } }
    });
    G.searchInput.addEventListener('input',(e)=> applySearch(e.target.value||''));
  }
  function applySearch(q){
    const term=(q||'').trim().toLowerCase();
    const nodes=[...G.root.querySelectorAll('.node')];
    const links=[...G.root.querySelectorAll('.link')];
    nodes.forEach(n=>{ n.classList.remove('search-hit','search-dim'); });
    links.forEach(l=>{ l.classList.remove('search-dim'); });
    if(!term){ applySleepState(); routeVibes(); return; }
    const hits=[]; nodes.forEach(n=>{
      const t=n.querySelector('.title'), s=n.querySelector('.sub');
      const txt=((t?.textContent||'')+' '+(s?.textContent||'')).toLowerCase();
      if(txt.includes(term)) hits.push(n);
    });
    nodes.forEach(n=>{ if(!hits.includes(n)) n.classList.add('search-dim'); });
    links.forEach(l=> l.classList.add('search-dim'));
    hits.forEach(n=> n.classList.add('search-hit'));
  }

  /* ===== Pan/Zoom ===== */
  function enablePanZoom(){
    let dragging=false, start, startTx, startTy;
    G.svg.addEventListener('mousedown',(e)=>{
      if (e.target.closest('.node')) return;
      dragging=true; G.stage.classList.add('is-panning');
      start=screenToRoot(e.clientX,e.clientY); startTx=G.tx; startTy=G.ty; e.preventDefault();
    });
    window.addEventListener('mousemove',(e)=>{
      if(!dragging) return;
      const p=screenToRoot(e.clientX,e.clientY);
      G.tx=startTx+(p.x-start.x); G.ty=startTy+(p.y-start.y);
      applyTransform();
    });
    window.addEventListener('mouseup',()=>{ dragging=false; G.stage.classList.remove('is-panning'); });
    G.stage.addEventListener('wheel',(e)=>{
      e.preventDefault();
      const delta=-e.deltaY; const zf=(e.ctrlKey?1.08:1.04);
      const target=delta>0?G.scale*zf:G.scale/zf;
      const ns=Math.max(G.minScale, Math.min(G.maxScale, target)); if(ns===G.scale) return;
      const p=screenToRoot(e.clientX,e.clientY); const k=ns/G.scale;
      G.tx=p.x - k*(p.x - G.tx); G.ty=p.y - k*(p.y - G.ty);
      G.scale=ns; applyTransform();
    },{ passive:false });
    G.stage.addEventListener('dblclick',()=>{ G.scale=1; G.tx=0; G.ty=0; applyTransform(); });
  }

  /* ===== Botón: Encender/Apagar panel ===== */
  function setupPanelToggle(){
    const btn=document.getElementById('graphThemeToggle'); if(!btn) return;
    const applyLabel=()=>{ btn.textContent = (G.stage.classList.contains('panel-on') ? 'Vista selectiva' : 'Encender panel'); };
    btn.addEventListener('click',()=>{
      G.stage.classList.toggle('panel-on');
      applyLabel();
    });
    applyLabel();
  }

  /* ===== Glow cursor ===== */
  function setupGlow(){
    const defs=document.createElementNS(NS,'defs');
    const grad=document.createElementNS(NS,'radialGradient');
    grad.setAttribute('id','glowGrad'); grad.setAttribute('cx','50%'); grad.setAttribute('cy','50%'); grad.setAttribute('r','50%');
    const s1=document.createElementNS(NS,'stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','rgba(255,159,26,.14)');
    const s2=document.createElementNS(NS,'stop'); s2.setAttribute('offset','60%'); s2.setAttribute('stop-color','rgba(255,159,26,.06)');
    const s3=document.createElementNS(NS,'stop'); s3.setAttribute('offset','100%'); s3.setAttribute('stop-color','rgba(255,159,26,0)');
    grad.append(s1,s2,s3); defs.appendChild(grad); G.svg.prepend(defs);
    const c=document.createElementNS(NS,'circle');
    c.setAttribute('id','cursorGlow'); c.setAttribute('r','120'); c.setAttribute('fill','url(#glowGrad)'); c.setAttribute('opacity','0');
    c.style.mixBlendMode='screen'; c.style.pointerEvents='none';
    G.layers.ui.appendChild(c);
    G.stage.addEventListener('mousemove',(e)=>{
      const p=screenToRoot(e.clientX,e.clientY);
      c.setAttribute('cx',p.x); c.setAttribute('cy',p.y);
      if(c.getAttribute('opacity')!=='1') c.setAttribute('opacity','1');
    });
    G.stage.addEventListener('mouseleave',()=> c.setAttribute('opacity','0'));
  }

  /* ===== Partículas ===== */
  function ensureAmbientParticles(){
    if (!G.stage || G._ambient) return;
    const cvs=document.createElement('canvas');
    cvs.className='ambient-canvas';
    if (G.stage.firstChild) G.stage.insertBefore(cvs, G.stage.firstChild); else G.stage.appendChild(cvs);
    const ctx=cvs.getContext('2d');
    const P={ w:0, h:0, dpr:Math.max(1, Math.min(2, window.devicePixelRatio||1)), pts:[], tick:0 };
    function colors(){ return document.body.classList.contains('theme-tech') ? ['rgba(0,230,118,','rgba(119,255,208,'] : ['rgba(255,159,26,','rgba(143,214,255,']; }
    function resize(){
      const r=G.stage.getBoundingClientRect();
      P.w=Math.floor(r.width); P.h=Math.floor(r.height);
      cvs.width=Math.floor(P.w*P.dpr); cvs.height=Math.floor(P.h*P.dpr);
      ctx.setTransform(P.dpr,0,0,P.dpr,0,0);
      const count=Math.round((P.w*P.h)/24000);
      const [c1,c2]=colors(); P.pts=Array.from({length:count}, ()=>spawn(c1,c2));
    }
    function spawn(c1,c2){ return { x:Math.random()*P.w, y:Math.random()*P.h, r:0.6+Math.random()*1.8, a:0.22+Math.random()*0.38, vx:(-0.15+Math.random()*0.3), vy:(-0.15+Math.random()*0.3), c:(Math.random()<0.5)?c1:c2 }; }
    function step(){
      ctx.clearRect(0,0,P.w,P.h); P.tick++;
      for(const p of P.pts){
        const wob=Math.sin((P.tick/120)+p.r)*0.15;
        p.x+=p.vx*(0.6+wob); p.y+=p.vy*(0.6+wob);
        if(p.x<-8) p.x=P.w+8; if(p.x>P.w+8) p.x=-8;
        if(p.y<-8) p.y=P.h+8; if(p.y>P.h+8) p.y=-8;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=p.c+p.a+')'; ctx.fill();
      }
      requestAnimationFrame(step);
    }
    window.addEventListener('resize',resize);
    window.addEventListener('graph-theme-change',resize);
    resize(); step(); G._ambient={ cvs, ctx, resize };
  }

  /* ===== API ===== */
  function init({ tree, stageId, svgId, rootId } = {}){
    G.TREE = tree || window.GRAPH_TREE || [];
    const _stage=stageId||'graphStage', _svg=svgId||'graphSvg', _root=rootId||'graphRoot';
    G.stage=document.getElementById(_stage); G.svg=document.getElementById(_svg); G.root=document.getElementById(_root); G.bcEl=document.getElementById('graphBc');
    if(!G.stage || !G.svg || !G.root) return;

    ensureLayers(); relayoutColumns(); renderAllOpen();
    applyTransform(); setupGlow(); ensureAmbientParticles(); buildSearchUI(); updateBreadcrumb(true);
    enablePanZoom(); setupPanelToggle();

    window.addEventListener('resize', ()=>{ relayoutColumns(); renderAllOpen(); applyTransform(); });
  }

  if (typeof window!=='undefined'){
    window.addEventListener('DOMContentLoaded', ()=>{
      const ok=document.getElementById('graphStage') && document.getElementById('graphSvg') && document.getElementById('graphRoot');
      if(ok && (window.GRAPH_TREE?.length)) init();
    });
  }

  return { init };
})();

