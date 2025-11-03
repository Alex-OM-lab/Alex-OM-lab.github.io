// /assets/js/graph.js — Versión PRO (Paso 2)
// - Columnas auto + despliegue radial en expansión
// - Ruta activa resaltada con atenuación del resto
// - Zoom-to-fit al abrir rama
// - Mini-mapa opcional
const SiteGraph = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  const G = {
    svg:null, root:null, stage:null,
    layers:null, colsNodes:[[],[],[],[]],
    state:{ sel0:null, sel1:null, sel2:null },
    // layout dinámico
    colX:[120, 460, 940, 1300],
    nodeW:[230, 250, 280, 260],
    nodeH:56, vGap:22,
    // pan/zoom
    tx:0, ty:0, scale:1, minScale:0.6, maxScale:2.0,
    // data
    TREE:null,
    // UI
    bcEl:null,
    // expansión/colapso
    expanded: { l0:true, l1:false, l2:false }, // qué niveles muestran hijos
    // partículas (del Paso 1)
    _ambient:null,
    // mini-mapa
    mm:{ enabled:false, el:null, ctx:null, w:160, h:100 }
  };

  /* ===== Utils ===== */
  function clear(g){ while(g.firstChild) g.removeChild(g.firstChild); }
  function applyTransform(){ G.root.setAttribute('transform', `translate(${G.tx},${G.ty}) scale(${G.scale})`); }
  function ptSvg(x,y){ const p=G.svg.createSVGPoint(); p.x=x; p.y=y; return p; }
  function screenToRoot(x,y){ const p=ptSvg(x,y); const m=G.root.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : {x,y}; }

  function relayoutColumns(){
    const bb = G.svg.getBoundingClientRect();
    const L = 4;
    const marginX = 120;
    const usable = Math.max(1000, bb.width - marginX*2);
    const step = usable / (L-1);
    G.colX = Array.from({length:L}, (_,i)=> marginX + i*step);
    G.nodeW = [230, 250, 280, 260].map(w=> Math.min(w, step*0.70));
  }

  function ensureLayers(){
    if (G.layers) return;
    const mk = id => { const g=document.createElementNS(NS,'g'); g.setAttribute('id',id); G.root.appendChild(g); return g; };
    const links01 = mk('links01'), links12 = mk('links12'), links23 = mk('links23');
    const col0=mk('col0'), col1=mk('col1'), col2=mk('col2'), col3=mk('col3');
    const ui=mk('uiLayer');
    G.layers = { cols:[col0,col1,col2,col3], links:[links01,links12,links23], ui };
    G.colsNodes=[[],[],[],[]];
  }
  function clearFrom(level){
    for(let i=level;i<4;i++){ clear(G.layers.cols[i]); G.colsNodes[i]=[]; }
    if(level<=1) clear(G.layers.links[0]);
    if(level<=2) clear(G.layers.links[1]);
    if(level<=3) clear(G.layers.links[2]);
  }

  /* ===== Dibujo ===== */
  function drawNode({level,x,y,w,h,title,sub,onClick,delay=0}){
    const g = document.createElementNS(NS,'g');
    g.classList.add('node'); g.dataset.lvl=String(level);
    g.setAttribute('transform', `translate(${x},${y})`);
    g.addEventListener('mouseenter', ()=> g.classList.add('hovered'));
    g.addEventListener('mouseleave', ()=> g.classList.remove('hovered'));
    if(onClick) g.addEventListener('click', onClick);

    const inner = document.createElementNS(NS,'g'); inner.classList.add('node-in'); g.appendChild(inner);

    const r = document.createElementNS(NS,'rect');
    r.setAttribute('width', w); r.setAttribute('height', h);
    inner.appendChild(r);

    const t = document.createElementNS(NS,'text');
    t.setAttribute('x', 14); t.setAttribute('y', 22); t.setAttribute('class','title'); t.textContent=title;
    inner.appendChild(t);

    if(sub){
      const s = document.createElementNS(NS,'text');
      s.setAttribute('x', 14); s.setAttribute('y', 40); s.setAttribute('class','sub'); s.textContent=sub;
      inner.appendChild(s);
    }

    const bkg = document.createElementNS(NS,'rect');
    bkg.setAttribute('x', w-34); bkg.setAttribute('y', 8);
    bkg.setAttribute('width', 22); bkg.setAttribute('height', 16);
    bkg.setAttribute('rx', '6');
    bkg.setAttribute('fill', level===0?'var(--accent)':'#ffd79a');
    inner.appendChild(bkg);

    const bt = document.createElementNS(NS,'text');
    bt.setAttribute('x', w-23); bt.setAttribute('y', 20); bt.setAttribute('class','badge'); bt.textContent=level;
    inner.appendChild(bt);

    G.layers.cols[level].appendChild(g);
    requestAnimationFrame(()=> setTimeout(()=> g.classList.add('is-in'), delay));
    return {x,y,w,h, el:g, inner};
  }

  function drawLink(from,to,level,delay=0){
    const path = document.createElementNS(NS,'path');
    const x1=from.x+from.w, y1=from.y+from.h/2;
    const x2=to.x,           y2=to.y+to.h/2;
    const dx = Math.max(60, (x2-x1)/2);
    path.setAttribute('d', `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`);
    path.setAttribute('class', `link l${level}`);
    G.layers.links[level-1].appendChild(path);
    setTimeout(()=> path.classList.add('draw'), delay);
    return path;
  }

  function layoutY(count){
    const H = G.svg.getBoundingClientRect().height || 640;
    const total = count*G.nodeH + Math.max(0,(count-1))*G.vGap;
    const y0 = Math.max(30, (H-total)/2);
    return ix => y0 + ix*(G.nodeH+G.vGap);
  }

  /* ===== Radial placement helper ===== */
  function radialChildren(parent, count, level){
    // punto base: centro del rect padre en X de su columna siguiente
    const px = parent.x + parent.w/2;
    const baseX = G.colX[level]; // columna destino del nivel
    const cx = (px + baseX) / 1.0; // acercamos al target
    const cy = parent.y + parent.h/2;
    const R = Math.max(70, Math.min(160, (G.colX[level]- (parent.x+parent.w)) * 0.45));
    const span = Math.min(Math.PI*0.9, 0.6 + count*0.14); // abrir más si hay muchos
    const start = -span/2;
    return Array.from({length:count}, (_,i)=>{
      const a = start + (span/(Math.max(1,count-1))) * i;
      const x = cx + Math.cos(a)*R - G.nodeW[level]/2;
      const y = cy + Math.sin(a)*R - G.nodeH/2;
      return {x, y};
    });
  }

  /* ===== Render Lx ===== */
  function renderL0(){
    clearFrom(0);
    if(!G.TREE?.length) return;
    const roots = G.TREE.map(r=>r.raiz);
    const yAt = layoutY(roots.length);
    G.colsNodes[0] = roots.map((txt,i)=>{
      const box = drawNode({
        level:0, x:G.colX[0], y:yAt(i), w:G.nodeW[0], h:G.nodeH, title:txt,
        onClick:()=>{ G.state.sel0=i; G.state.sel1=null; G.state.sel2=null; updateBreadcrumb(); renderFrom(1); highlightActive(); zoomToPath(); },
        delay:40+i*40
      });
      return box;
    });
  }

  function renderL1(){
    clearFrom(1);
    if(G.state.sel0==null) return;

    const areas = (G.TREE[G.state.sel0].areas||[]).map(a=>a.nombre);
    const left = G.colsNodes[0][G.state.sel0];

    // Si colapsado, no pintes
    if (!G.expanded.l1) { return; }

    // Radial respecto a parent
    const pos = radialChildren(left, areas.length, 1);
    G.colsNodes[1] = areas.map((txt,i)=>{
      const p = pos[i];
      const box = drawNode({
        level:1, x:p.x, y:p.y, w:G.nodeW[1], h:G.nodeH, title:txt,
        onClick:()=>{ G.state.sel1=i; G.state.sel2=null; updateBreadcrumb(); renderFrom(2); highlightActive(); zoomToPath(); },
        delay:60+i*40
      });
      box._link = drawLink(left, box, 1, 60+i*40);
      return box;
    });
  }

  function renderL2(){
    clearFrom(2);
    if(G.state.sel0==null || G.state.sel1==null) return;

    const subs = (G.TREE[G.state.sel0].areas[G.state.sel1].subcarpetas||[]);
    const left = G.colsNodes[1][G.state.sel1];

    if (!G.expanded.l2) { return; }

    const pos = radialChildren(left, subs.length, 2);
    G.colsNodes[2] = subs.map((txt,i)=>{
      const p = pos[i];
      const box = drawNode({
        level:2, x:p.x, y:p.y, w:G.nodeW[2], h:G.nodeH, title:txt,
        onClick:()=>{ G.state.sel2=i; updateBreadcrumb(); renderFrom(3); highlightActive(); zoomToPath(); },
        delay:70+i*35
      });
      box._link = drawLink(left, box, 2, 70+i*35);
      return box;
    });
  }

  function renderL3(){
    clearFrom(3);
    if(G.state.sel0==null || G.state.sel1==null || G.state.sel2==null) return;
    const subs = (G.TREE[G.state.sel0].areas[G.state.sel1].subcarpetas||[]);
    const items = (window.GRAPH_MAKE_SIX ? window.GRAPH_MAKE_SIX(subs[G.state.sel2]) : []);
    const left = G.colsNodes[2][G.state.sel2];
    const yAt  = layoutY(items.length);
    // Para L3 lo dejamos “columnado” por claridad
    G.colsNodes[3] = items.map((txt,i)=>{
      const box = drawNode({
        level:3, x:G.colX[3], y:yAt(i), w:G.nodeW[3], h:G.nodeH, title:txt, sub:"↗",
        onClick:()=>{/* abrir enlace más adelante */},
        delay:80+i*30
      });
      box._link = drawLink(left, box, 3, 80+i*30);
      return box;
    });
  }

  function renderFrom(level){
    ensureLayers();
    if(level<=1) renderL1();
    if(level<=2) renderL2();
    if(level<=3) renderL3();
    applyTransform();
    updateMinimap();
  }

  function renderInit(){
    ensureLayers();
    relayoutColumns();
    renderL0();
    applyTransform();
    setupGlow();
    updateBreadcrumb();
    ensureAmbientParticles(); // Paso 1
    setupStageClicks();       // toggles
    updateMinimap(true);
  }

  /* ===== Breadcrumb (opcional) ===== */
  function updateBreadcrumb(){
    if(!G.bcEl) return;
    const parts=[];
    if(G.state.sel0!=null) parts.push({t:G.TREE[G.state.sel0].raiz, cb:()=>{G.state.sel1=null; G.state.sel2=null; renderFrom(1); highlightActive(); zoomToPath(); }});
    if(G.state.sel1!=null) parts.push({t:G.TREE[G.state.sel0].areas[G.state.sel1].nombre, cb:()=>{G.state.sel2=null; renderFrom(2); highlightActive(); zoomToPath(); }});
    if(G.state.sel2!=null){
      const name = G.TREE[G.state.sel0].areas[G.state.sel1].subcarpetas[G.state.sel2];
      parts.push({t:name, cb:()=>{ renderFrom(3); highlightActive(); zoomToPath(); }});
    }

    G.bcEl.innerHTML = '';
    if(parts.length===0){ G.bcEl.style.display='none'; return; }
    G.bcEl.style.display='flex';

    parts.forEach((p,ix)=>{
      const span=document.createElement('span'); span.className='crumb'; span.textContent=p.t;
      span.tabIndex=0; span.addEventListener('click', p.cb);
      G.bcEl.appendChild(span);
      if(ix<parts.length-1){ const sep=document.createElement('span'); sep.className='sep'; sep.textContent='›'; G.bcEl.appendChild(sep); }
    });
  }

  /* ===== Ruta activa + atenuado ===== */
  function highlightActive(){
    // limpiar
    G.root.querySelectorAll('.node').forEach(n=>n.classList.remove('active','active-path'));
    G.root.querySelectorAll('.link').forEach(n=>n.classList.remove('active','active-path'));
    G.stage.classList.remove('dim-others');

    // construir path
    const pathNodes = [];
    const pathLinks = [];

    if(G.state.sel0!=null){
      const n0 = G.colsNodes[0][G.state.sel0];
      if(n0){ n0.el.classList.add('active','active-path'); pathNodes.push(n0); }
    }
    if(G.state.sel1!=null){
      const n1 = G.colsNodes[1][G.state.sel1];
      if(n1){ n1.el.classList.add('active','active-path'); n1._link?.classList.add('active','active-path'); pathNodes.push(n1); pathLinks.push(n1._link); }
    }
    if(G.state.sel2!=null){
      const n2 = G.colsNodes[2][G.state.sel2];
      if(n2){ n2.el.classList.add('active','active-path'); n2._link?.classList.add('active','active-path'); pathNodes.push(n2); pathLinks.push(n2._link); }
    }

    // atenuar resto si hay al menos un nivel abierto
    if(pathNodes.length>0) G.stage.classList.add('dim-others');
  }

  /* ===== Zoom-to-fit de la rama visible ===== */
  function zoomToPath(){
    // calcula bbox de nodos activos (o toda la capa si no hay selección)
    const act = Array.from(G.root.querySelectorAll('.node.active-path')).map(n=>n.getBoundingClientRect());
    const ref = G.svg.getBoundingClientRect();
    let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity;

    const rects = act.length ? act : [G.root.getBoundingClientRect()];
    rects.forEach(r=>{
      x1 = Math.min(x1, r.left);  y1 = Math.min(y1, r.top);
      x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom);
    });
    // pasar a coords de root
    const p1 = screenToRoot(x1, y1);
    const p2 = screenToRoot(x2, y2);

    const pad = 40;
    const w = (p2.x - p1.x) + pad*2;
    const h = (p2.y - p1.y) + pad*2;

    const targetScale = Math.max(G.minScale, Math.min(G.maxScale, Math.min(ref.width / w, ref.height / h)));
    const cx = (p1.x + p2.x)/2;
    const cy = (p1.y + p2.y)/2;

    animateViewTo(targetScale, ref.width/2 - cx*targetScale, ref.height/2 - cy*targetScale);
  }

  function animateViewTo(s, tx, ty, ms=420){
    const s0=G.scale, tx0=G.tx, ty0=G.ty;
    const t0=performance.now();
    G.stage.classList.add('is-zooming');
    function ease(t){ return t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
    function frame(t){
      const k=Math.min(1, (t-t0)/ms);
      const e=ease(k);
      G.scale = s0 + (s - s0)*e;
      G.tx    = tx0 + (tx - tx0)*e;
      G.ty    = ty0 + (ty - ty0)*e;
      applyTransform();
      if(k<1) requestAnimationFrame(frame);
      else G.stage.classList.remove('is-zooming');
    }
    requestAnimationFrame(frame);
  }

  /* ===== Glow cursor (Paso 1) ===== */
  function setupGlow(){
    const defs = document.createElementNS(NS,'defs');
    const grad = document.createElementNS(NS,'radialGradient');
    grad.setAttribute('id','glowGrad'); grad.setAttribute('cx','50%'); grad.setAttribute('cy','50%'); grad.setAttribute('r','50%');
    const s1=document.createElementNS(NS,'stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','rgba(255,159,26,.14)');
    const s2=document.createElementNS(NS,'stop'); s2.setAttribute('offset','60%'); s2.setAttribute('stop-color','rgba(255,159,26,.06)');
    const s3=document.createElementNS(NS,'stop'); s3.setAttribute('offset','100%'); s3.setAttribute('stop-color','rgba(255,159,26,0)');
    grad.append(s1,s2,s3); defs.appendChild(grad); G.svg.prepend(defs);

    const c = document.createElementNS(NS,'circle');
    c.setAttribute('id','cursorGlow'); c.setAttribute('r','120'); c.setAttribute('fill','url(#glowGrad)'); c.setAttribute('opacity','0');
    c.style.mixBlendMode='screen'; c.style.pointerEvents='none';
    G.layers.ui.appendChild(c);

    G.stage.addEventListener('mousemove', (e)=>{
      const p = screenToRoot(e.clientX, e.clientY);
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      if(c.getAttribute('opacity')!=='1') c.setAttribute('opacity','1');
    });
    G.stage.addEventListener('mouseleave', ()=> c.setAttribute('opacity','0'));
  }

  /* ===== Pan/Zoom manual ===== */
  function enablePanZoom(){
    let dragging=false, start, startTx, startTy;

    G.svg.addEventListener('mousedown', (e)=>{
      if(e.target.closest('.node')) return;
      dragging=true; G.stage.classList.add('is-panning');
      start = screenToRoot(e.clientX, e.clientY); startTx=G.tx; startTy=G.ty; e.preventDefault();
    });

    window.addEventListener('mousemove', (e)=>{
      if(!dragging) return;
      const p = screenToRoot(e.clientX, e.clientY);
      G.tx = startTx + (p.x - start.x);
      G.ty = startTy + (p.y - start.y);
      applyTransform();
    });
    window.addEventListener('mouseup', ()=>{ dragging=false; G.stage.classList.remove('is-panning'); });

    G.stage.addEventListener('wheel', (e)=>{
      e.preventDefault();
      const delta = -e.deltaY;
      const zf = (e.ctrlKey?1.08:1.04);
      const target = delta>0 ? G.scale*zf : G.scale/zf;
      const ns = Math.max(G.minScale, Math.min(G.maxScale, target));
      if(ns===G.scale) return;

      const p = screenToRoot(e.clientX, e.clientY);
      const k = ns/G.scale;
      G.tx = p.x - k*(p.x - G.tx);
      G.ty = p.y - k*(p.y - G.ty);
      G.scale = ns; applyTransform();
      updateMinimap();
    }, { passive:false });

    G.stage.addEventListener('dblclick', ()=>{ G.scale=1; G.tx=0; G.ty=0; applyTransform(); updateMinimap(); });
  }

  /* ===== Clicks de stage: toggle expand/collapse ===== */
  function setupStageClicks(){
    // Doble click en nodo L0 → alterna mostrar L1
    G.layers.cols[0].addEventListener('dblclick', ()=>{
      G.expanded.l1 = !G.expanded.l1; G.state.sel1=null; G.state.sel2=null;
      renderFrom(1); highlightActive(); zoomToPath();
    });
    // Doble click en L1 → alterna L2
    G.layers.cols[1].addEventListener('dblclick', ()=>{
      if(G.state.sel0==null) return;
      G.expanded.l2 = !G.expanded.l2; G.state.sel2=null;
      renderFrom(2); highlightActive(); zoomToPath();
    });
  }

  /* ===== Ambient Particles (Paso 1) ===== */
  function ensureAmbientParticles(){
    if (!G.stage || G._ambient) return;
    const cvs = document.createElement('canvas');
    cvs.className = 'ambient-canvas';
    G.stage.prepend(cvs);
    const ctx = cvs.getContext('2d');

    const P = { w:0,h:0,dpr:Math.max(1,Math.min(2,window.devicePixelRatio||1)), pts:[], tick:0 };
    function resize(){
      const r = G.stage.getBoundingClientRect();
      P.w = Math.floor(r.width); P.h = Math.floor(r.height);
      cvs.width = Math.floor(P.w * P.dpr); cvs.height = Math.floor(P.h * P.dpr);
      ctx.setTransform(P.dpr,0,0,P.dpr,0,0);
      const count = Math.round((P.w*P.h)/24000);
      P.pts = Array.from({length:count}, ()=>spawn());
    }
    function spawn(){
      return {
        x: Math.random()*P.w, y: Math.random()*P.h,
        r: 0.6 + Math.random()*1.8, a: 0.22 + Math.random()*0.38,
        vx: (-0.15 + Math.random()*0.3), vy: (-0.15 + Math.random()*0.3),
        c: (Math.random()<0.5) ? 'rgba(255,159,26,' : 'rgba(143,214,255,'
      };
    }
    function step(){
      ctx.clearRect(0,0,P.w,P.h); P.tick++;
      for(const p of P.pts){
        const wob = Math.sin((P.tick/120)+p.r)*0.15;
        p.x += p.vx*(0.6+wob); p.y += p.vy*(0.6+wob);
        if(p.x<-8) p.x=P.w+8; if(p.x>P.w+8) p.x=-8;
        if(p.y<-8) p.y=P.h+8; if(p.y>P.h+8) p.y=-8;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = p.c + p.a + ')'; ctx.fill();
      }
      requestAnimationFrame(step);
    }
    window.addEventListener('resize', resize);
    resize(); step();
    G._ambient = { cvs, ctx, resize };
  }

  /* ===== Mini-mapa (opcional) ===== */
  function ensureMinimap(){
    if (!G.mm.enabled) return;
    if (G.mm.el) return;
    const box = document.createElement('div');
    box.className = 'graph-minimap';
    const c = document.createElement('canvas');
    box.appendChild(c);
    G.stage.appendChild(box);
    G.mm.el = box; G.mm.ctx = c.getContext('2d');
    box.style.display = 'block';
  }
  function updateMinimap(force=false){
    if(!G.mm.enabled) return;
    ensureMinimap();
    const mmc = G.mm.ctx; if(!mmc) return;

    const rectStage = G.stage.getBoundingClientRect();
    const w = G.mm.w, h = G.mm.h;
    mmc.canvas.width = w; mmc.canvas.height = h;
    mmc.clearRect(0,0,w,h);

    // bounding del root en coords internas
    const bbox = G.root.getBBox();
    const sx = w / bbox.width;
    const sy = h / bbox.height;
    const s = Math.min(sx, sy);

    // dibujar nodos como rects
    mmc.save();
    mmc.translate((w - bbox.width*s)/2, (h - bbox.height*s)/2);
    mmc.scale(s, s);
    mmc.translate(-bbox.x, -bbox.y);

    // nodos
    G.root.querySelectorAll('.node').forEach(n=>{
      const b = n.getBBox();
      mmc.fillStyle = n.classList.contains('active-path') ? 'rgba(255,159,26,.85)' : 'rgba(255,255,255,.35)';
      mmc.fillRect(b.x, b.y, b.width, b.height);
    });

    // viewport
    const invScale = 1/G.scale;
    const vx = -G.tx*invScale, vy = -G.ty*invScale;
    const vw = rectStage.width*invScale, vh = rectStage.height*invScale;
    mmc.strokeStyle='rgba(255,159,26,.9)'; mmc.lineWidth=2*invScale;
    mmc.strokeRect(vx, vy, vw, vh);

    mmc.restore();
  }

  /* ===== API ===== */
  function init({ tree, stageId, svgId, rootId } = {}){
    G.TREE = tree || window.GRAPH_TREE || [];
    const _stage = stageId || 'graphStage';
    const _svg = svgId || 'graphSvg';
    const _root = rootId || 'graphRoot';

    G.stage = document.getElementById(_stage);
    G.svg   = document.getElementById(_svg);
    G.root  = document.getElementById(_root);
    G.bcEl  = document.getElementById('graphBc'); // opcional

    if(!G.stage || !G.svg || !G.root) return;
    ensureLayers();
    relayoutColumns();
    renderInit();
    enablePanZoom();

    window.addEventListener('resize', ()=>{ relayoutColumns(); renderFrom(1); applyTransform(); updateMinimap(); });
  }

  if (typeof window!=='undefined'){
    window.addEventListener('DOMContentLoaded', ()=>{
      const ok = document.getElementById('graphStage') && document.getElementById('graphSvg') && document.getElementById('graphRoot');
      if(ok && (window.GRAPH_TREE?.length)) init();
    });
  }

  return { init };
})();

