// /assets/js/graph.js
const SiteGraph = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  const G = {
    svg: null,
    root: null,
    stage: null,
    state: { sel0:null, sel1:null, sel2:null },

    // layout base
    colX: [120, 460, 940, 1300],
    nodeW: [220, 240, 280, 260],
    nodeH: 56,
    vGap : 22,

    // pan/zoom
    tx: 0, ty: 0, scale: 1,
    minScale: 0.6,
    maxScale: 2.2,

    // capas
    layers: null,
    colsNodes: [[],[],[],[]],
    _glowReady: false,
    _glow: null,

    // data
    TREE: null,
  };

  /* ======== Utils ======== */
  function makeSix(name){ return Array.from({length:6}, (_,i)=>`Artículo ${i+1} — ${name}`); }
  function clearGroup(g){ while(g.firstChild) g.removeChild(g.firstChild); }
  function applyTransform(){ G.root.setAttribute('transform', `translate(${G.tx},${G.ty}) scale(${G.scale})`); }

  function screenToSvgPoint(clientX, clientY){
    const pt = G.svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const ctm = G.svg.getScreenCTM();
    return pt.matrixTransform(ctm.inverse());
  }
  function screenToRootPoint(clientX, clientY){
    const pt = G.svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const ctm = G.root.getScreenCTM();
    return pt.matrixTransform(ctm.inverse());
  }

  /* ======== Capas ======== */
  function ensureLayers(){
    if (G.layers) return;
    const mk = id => { const g=document.createElementNS(NS,'g'); g.setAttribute('id',id); G.root.appendChild(g); return g; };

    // Orden: enlaces detrás, nodos encima, UI al final
    const links01 = mk('links01');
    const links12 = mk('links12');
    const links23 = mk('links23');
    const col0 = mk('col0');
    const col1 = mk('col1');
    const col2 = mk('col2');
    const col3 = mk('col3');
    const ui   = mk('uiLayer');

    G.layers = { cols:[col0,col1,col2,col3], links:[links01,links12,links23], ui };
    G.colsNodes = [[],[],[],[]];
  }
  function clearFrom(level){
    for (let i=level; i<4; i++){ clearGroup(G.layers.cols[i]); G.colsNodes[i] = []; }
    if (level<=1) clearGroup(G.layers.links[0]);
    if (level<=2) clearGroup(G.layers.links[1]);
    if (level<=3) clearGroup(G.layers.links[2]);
  }

  /* ======== Dibujo ======== */
  function drawNode({level,x,y,w,h,title,sub,onClick,delay=0}){
    const g = document.createElementNS(NS,'g');
    g.classList.add('node'); g.dataset.lvl = String(level);
    g.setAttribute('transform', `translate(${x},${y})`);

    g.addEventListener('mouseenter', ()=> g.classList.add('hovered'));
    g.addEventListener('mouseleave', ()=> g.classList.remove('hovered'));
    if(onClick) g.addEventListener('click', onClick);

    const inner = document.createElementNS(NS,'g');
    inner.classList.add('node-in');
    g.appendChild(inner);

    const r = document.createElementNS(NS,'rect');
    r.setAttribute('width', w); r.setAttribute('height', h);
    inner.appendChild(r);

    const t = document.createElementNS(NS,'text');
    t.setAttribute('x', 14); t.setAttribute('y', 22); t.setAttribute('class','title'); t.textContent = title;
    inner.appendChild(t);

    if(sub){
      const s = document.createElementNS(NS,'text');
      s.setAttribute('x', 14); s.setAttribute('y', 40); s.setAttribute('class','sub'); s.textContent = sub;
      inner.appendChild(s);
    }

    const bkg = document.createElementNS(NS,'rect');
    bkg.setAttribute('x', w-34); bkg.setAttribute('y', 8);
    bkg.setAttribute('width', 22); bkg.setAttribute('height', 16);
    bkg.setAttribute('rx','6');
    bkg.setAttribute('fill', level===0?'var(--accent)':'#ffd79a');
    inner.appendChild(bkg);

    const bt = document.createElementNS(NS,'text');
    bt.setAttribute('x', w-23); bt.setAttribute('y', 20); bt.setAttribute('class','badge'); bt.textContent = level;
    inner.appendChild(bt);

    G.layers.cols[level].appendChild(g);

    requestAnimationFrame(()=>{ setTimeout(()=> g.classList.add('is-in'), delay); });

    return {x,y,w,h, el:g};
  }

  function drawLink(from, to, level, delay=0){
    const path = document.createElementNS(NS,'path');
    const x1 = from.x + from.w, y1 = from.y + from.h/2;
    const x2 = to.x,           y2 = to.y + to.h/2;
    const dx = Math.max(40, (x2 - x1)/2);
    path.setAttribute('d', `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`);
    path.setAttribute('class', `link l${level}`);
    G.layers.links[level-1].appendChild(path);
    setTimeout(()=> path.classList.add('draw'), delay);
  }

  /* ======== Render incremental ======== */
  const H = 900;
  function layoutY(count){
    const total = count*G.nodeH + (count-1)*G.vGap;
    const y0=(H-total)/2; return ix => y0 + ix*(G.nodeH+G.vGap);
  }

  function renderL0(){
    clearFrom(0);
    const roots = G.TREE.map(r=>r.raiz);
    const yAt = layoutY(roots.length);
    G.colsNodes[0] = roots.map((txt,ix)=>{
      return drawNode({
        level:0, x:G.colX[0], y:yAt(ix), w:G.nodeW[0], h:G.nodeH, title:txt,
        onClick:()=>{ G.state.sel0 = ix; G.state.sel1 = null; G.state.sel2 = null; renderFrom(1); },
        delay: 40 + ix*40
      });
    });
  }

  function renderL1(){
    clearFrom(1);
    if (G.state.sel0==null) return;
    const areas = G.TREE[G.state.sel0].areas.map(a=>a.nombre);
    const yAt = layoutY(areas.length);
    const left = G.colsNodes[0][G.state.sel0];
    G.colsNodes[1] = areas.map((txt,ix)=>{
      const box = drawNode({
        level:1, x:G.colX[1], y:yAt(ix), w:G.nodeW[1], h:G.nodeH, title:txt,
        onClick:()=>{ G.state.sel1 = ix; G.state.sel2 = null; renderFrom(2); },
        delay: 60 + ix*40
      });
      drawLink(left, box, 1, 50 + ix*40);
      return box;
    });
  }

  function renderL2(){
    clearFrom(2);
    if (G.state.sel0==null || G.state.sel1==null) return;
    const subs = G.TREE[G.state.sel0].areas[G.state.sel1].subcarpetas;
    const yAt = layoutY(subs.length);
    const left = G.colsNodes[1][G.state.sel1];
    G.colsNodes[2] = subs.map((txt,ix)=>{
      const box = drawNode({
        level:2, x:G.colX[2], y:yAt(ix), w:G.nodeW[2], h:G.nodeH, title:txt,
        onClick:()=>{ G.state.sel2 = ix; renderFrom(3); },
        delay: 70 + ix*35
      });
      drawLink(left, box, 2, 60 + ix*35);
      return box;
    });
  }

  function renderL3(){
    clearFrom(3);
    if (G.state.sel0==null || G.state.sel1==null || G.state.sel2==null) return;
    const subs = G.TREE[G.state.sel0].areas[G.state.sel1].subcarpetas;
    const items = makeSix(subs[G.state.sel2]);
    const yAt = layoutY(items.length);
    const left = G.colsNodes[2][G.state.sel2];
    G.colsNodes[3] = items.map((txt,ix)=>{
      const box = drawNode({
        level:3, x:G.colX[3], y:yAt(ix), w:G.nodeW[3], h:G.nodeH, title:txt, sub:"↗",
        onClick:()=>{/* navegación futura */},
        delay: 80 + ix*30
      });
      drawLink(left, box, 3, 70 + ix*30);
      return box;
    });
  }

  function renderFrom(level){
    ensureLayers();
    if (level<=1) renderL1();
    if (level<=2) renderL2();
    if (level<=3) renderL3();
    applyTransform();
  }

  function renderInit(){
    ensureLayers();
    renderL0();
    applyTransform();
    ensureGlow();
  }

  /* ======== Glow sutil cursor ======== */
  function ensureGlow(){
    if (G._glowReady) return;
    const defs = document.createElementNS(NS,'defs');
    const grad = document.createElementNS(NS,'radialGradient');
    grad.setAttribute('id','glowGrad');
    grad.setAttribute('cx','50%'); grad.setAttribute('cy','50%'); grad.setAttribute('r','50%');
    const s1=document.createElementNS(NS,'stop'); s1.setAttribute('offset','0%');   s1.setAttribute('stop-color','rgba(255,159,26,.16)');
    const s2=document.createElementNS(NS,'stop'); s2.setAttribute('offset','60%');  s2.setAttribute('stop-color','rgba(255,159,26,.06)');
    const s3=document.createElementNS(NS,'stop'); s3.setAttribute('offset','100%'); s3.setAttribute('stop-color','rgba(255,159,26,0)');
    grad.append(s1,s2,s3); defs.appendChild(grad); G.svg.prepend(defs);

    const c = document.createElementNS(NS,'circle');
    c.setAttribute('id','cursorGlow');
    c.setAttribute('r','120');
    c.setAttribute('fill','url(#glowGrad)');
    c.setAttribute('opacity','0');
    c.style.mixBlendMode = 'screen';
    c.style.pointerEvents = 'none';
    G.layers.ui.appendChild(c);
    G._glow = c; G._glowReady = true;

    G.stage.addEventListener('mousemove', (e)=>{
      const p = screenToRootPoint(e.clientX, e.clientY);
      G._glow.setAttribute('cx', p.x); G._glow.setAttribute('cy', p.y);
      if (G._glow.getAttribute('opacity') !== '1') G._glow.setAttribute('opacity','1');
    });
    G.stage.addEventListener('mouseleave', ()=> G._glow.setAttribute('opacity','0'));
  }

  /* ======== Pan & Zoom ======== */
  function enablePanZoom(){
    let dragging = false, start, startTx, startTy;

    G.svg.addEventListener('mousedown', (e)=>{
      if (e.target.closest('.node')) return; // no pan si clic en un nodo
      dragging = true;
      G.stage.classList.add('is-panning');
      start = screenToSvgPoint(e.clientX, e.clientY);
      startTx = G.tx; startTy = G.ty;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e)=>{
      if(!dragging) return;
      const pt = screenToSvgPoint(e.clientX, e.clientY);
      G.tx = startTx + (pt.x - start.x);
      G.ty = startTy + (pt.y - start.y);
      applyTransform();
    });

    window.addEventListener('mouseup', ()=>{
      dragging = false;
      G.stage.classList.remove('is-panning');
    });

    G.stage.addEventListener('wheel', (e)=>{
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = (e.ctrlKey ? 1.08 : 1.04);
      const scaleTarget = delta > 0 ? G.scale * zoomFactor : G.scale / zoomFactor;
      const newScale = Math.max(G.minScale, Math.min(G.maxScale, scaleTarget));
      if(newScale === G.scale) return;

      const p1 = screenToSvgPoint(e.clientX, e.clientY);
      const k  = newScale / G.scale;
      G.tx = p1.x - k*(p1.x - G.tx);
      G.ty = p1.y - k*(p1.y - G.ty);
      G.scale = newScale;
      applyTransform();
    }, { passive:false });

    G.stage.addEventListener('dblclick', ()=>{
      G.scale = 1; G.tx = 0; G.ty = 0; applyTransform();
    });
  }

  /* ======== API ======== */
  function init({ tree, stageId, svgId, rootId }){
    G.TREE = tree;
    G.stage = document.getElementById(stageId);
    G.svg   = document.getElementById(svgId);
    G.root  = document.getElementById(rootId);
    renderInit();
    enablePanZoom();

    // Si cambias el tamaño del contenedor y quieres re-centrar, rehaz layout base:
    window.addEventListener('resize', () => {
      // Mantén incremental: no borres todo; re-render desde el nivel seleccionado.
      // Si quieres “full recalculado” usa renderInit();
      applyTransform();
    });
  }

  return { init };
})();
