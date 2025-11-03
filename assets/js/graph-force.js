// Force Graph (canvas puro, sin dependencias) — lee window.GRAPH_TREE
(() => {
  const STAGE_ID = 'forceGraph';
  const CANVAS_ID = 'forceCanvas';
  const TREE = (typeof window !== 'undefined') ? window.GRAPH_TREE : null;
  if (!TREE || !Array.isArray(TREE) || !TREE.length) return;

  const stage = document.getElementById(STAGE_ID);
  const canvas = document.getElementById(CANVAS_ID);
  if (!stage || !canvas) return;

  /* ---------- Utils/Theme ---------- */
  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const ctx = canvas.getContext('2d');
  const COLORS = {
    bg: '#0c1323',
    text: getCSS('--text', '#e9eef6'),
    mut: getCSS('--muted', '#a8b2c2'),
    l0: getCSS('--accent', '#ff9f1a'),
    l1: '#ffd79a',
    l2: '#8fd6ff',
    l3: '#9be2b0',
    link: 'rgba(255,255,255,0.12)'
  };
  function getCSS(varName, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v || fallback;
  }

  /* ---------- Convertimos GRAPH_TREE a nodos/enlaces ---------- */
  const nodes = []; // {id, label, level, fx?, fy?}
  const links = []; // {source, target}

  // helper para IDs únicos legibles
  const id = (...parts) => parts.join('::');

  TREE.forEach((root, i0) => {
    const n0 = { id: id('L0', i0), label: root.raiz, level: 0 };
    nodes.push(n0);

    (root.areas || []).forEach((area, i1) => {
      const n1 = { id: id('L1', i0, i1), label: area.nombre, level: 1 };
      nodes.push(n1); links.push({ source: n0.id, target: n1.id });

      (area.subcarpetas || []).forEach((sub, i2) => {
        const n2 = { id: id('L2', i0, i1, i2), label: sub, level: 2 };
        nodes.push(n2); links.push({ source: n1.id, target: n2.id });

        // generamos 4-6 items hoja usando helper si existe
        const maker = window.GRAPH_MAKE_SIX || ((name)=>Array.from({length:6},(_,k)=>`Artículo ${k+1} — ${name}`));
        const leaves = maker(sub).slice(0,6);
        leaves.forEach((name, i3) => {
          const n3 = { id: id('L3', i0, i1, i2, i3), label: name, level: 3 };
          nodes.push(n3); links.push({ source: n2.id, target: n3.id });
        });
      });
    });
  });

  /* ---------- Layout inicial por columnas (coherente con tu SVG) ---------- */
  const COLS = 4;
  function layoutInitial(w, h) {
    const colX = [0.12, 0.37, 0.63, 0.86].map(p => p * w);
    const perCol = [[],[],[],[]];
    nodes.forEach(n => perCol[n.level].push(n));

    for (let c=0; c<COLS; c++) {
      const list = perCol[c];
      const gap = 62;
      const totalH = (list.length - 1) * gap;
      const y0 = (h - totalH) / 2;
      list.forEach((n, i) => {
        n.x = colX[c] + (Math.random()-0.5)*20;
        n.y = y0 + i*gap + (Math.random()-0.5)*18;
      });
    }
  }

  /* ---------- Simulación por fuerzas (sencilla) ---------- */
  const sim = {
    alpha: 1,
    alphaMin: 0.03,
    alphaDecay: 0.015, // más grande = se asienta antes
    velocityDecay: 0.22,
    kLink: 0.08,
    linkDist: [0, 130, 120, 90], // por nivel destino
    charge: -1400,               // repulsión
    center: 0.02,                // fuerza a centro
  };

  function stepForces(w, h) {
    // decaimiento de alpha
    sim.alpha = Math.max(sim.alphaMin, sim.alpha * (1 - sim.alphaDecay));

    // enfriamiento de velocidades
    nodes.forEach(n => {
      n.vx = (n.vx || 0) * (1 - sim.velocityDecay);
      n.vy = (n.vy || 0) * (1 - sim.velocityDecay);
    });

    // springs (enlaces)
    links.forEach(l => {
      const a = nodeById[l.source];
      const b = nodeById[l.target];
      const dx = (b.x - a.x), dy = (b.y - a.y);
      const dist = Math.max(1, Math.hypot(dx, dy));
      const wanted = sim.linkDist[b.level] || 110;
      const diff = (dist - wanted);
      const force = sim.kLink * diff * sim.alpha;

      const fx = force * (dx / dist);
      const fy = force * (dy / dist);

      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    });

    // repulsión (simple O(n^2), ok para ~200 nodos)
    const k = sim.charge * sim.alpha / 100000;
    for (let i=0; i<nodes.length; i++) {
      for (let j=i+1; j<nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx*dx + dy*dy;
        if (d2 < 1) d2 = 1;
        const inv = 1 / d2;
        const f = k * inv;
        a.vx -= f * dx; a.vy -= f * dy;
        b.vx += f * dx; b.vy += f * dy;
      }
    }

    // fuerza a centro
    const cx = w/2, cy = h/2;
    nodes.forEach(n => {
      n.vx += (cx - n.x) * sim.center * sim.alpha;
      n.vy += (cy - n.y) * sim.center * sim.alpha;
    });

    // integración
    nodes.forEach(n => {
      if (n.fx != null) n.x = n.fx; else n.x += n.vx || 0;
      if (n.fy != null) n.y = n.fy; else n.y += n.vy || 0;
    });
  }

  /* ---------- Pan & Zoom ---------- */
  let view = { x: 0, y: 0, k: 1 }; // translate + scale
  function applyTransform(x, y) {
    return { x: (x*view.k + view.x), y: (y*view.k + view.y) };
  }
  function invertTransform(x, y) {
    return { x: (x - view.x)/view.k, y: (y - view.y)/view.k };
  }

  let draggingCanvas = false, dragStart, viewStart;
  stage.addEventListener('mousedown', (e) => {
    // si no estamos arrastrando nodo, arrastramos el lienzo
    draggingCanvas = true;
    stage.classList.add('is-dragging');
    dragStart = { x: e.clientX, y: e.clientY };
    viewStart = { ...view };
  });
  window.addEventListener('mousemove', (e) => {
    if (!draggingCanvas) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    view.x = viewStart.x + dx;
    view.y = viewStart.y + dy;
  });
  window.addEventListener('mouseup', () => {
    draggingCanvas = false;
    stage.classList.remove('is-dragging');
  });
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * DPR;
    const my = (e.clientY - rect.top) * DPR;

    const world = invertTransform(mx, my);
    const factor = (e.deltaY < 0) ? 1.1 : 0.9;
    const nextK = clamp(view.k * factor, 0.6, 2.2);

    view.x = mx - world.x * nextK;
    view.y = my - world.y * nextK;
    view.k = nextK;
  }, { passive: false });

  /* ---------- Drag de nodo ---------- */
  let draggingNode = null;
  stage.addEventListener('pointerdown', (e) => {
    const picked = pickNode(e);
    if (picked) {
      draggingNode = picked;
      const p = clientToWorld(e);
      draggingNode.fx = p.x;
      draggingNode.fy = p.y;
      e.stopPropagation();
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!draggingNode) return;
    const p = clientToWorld(e);
    draggingNode.fx = p.x;
    draggingNode.fy = p.y;
    sim.alpha = 1; // reactivar
  });
  window.addEventListener('pointerup', () => {
    if (draggingNode) {
      draggingNode.fx = null;
      draggingNode.fy = null;
      draggingNode = null;
    }
  });

  function clientToWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * DPR;
    const y = (e.clientY - rect.top) * DPR;
    return invertTransform(x, y);
  }

  /* ---------- Picking ---------- */
  const nodeRadius = (lvl) => (lvl === 0 ? 20 : lvl === 1 ? 16 : lvl === 2 ? 13 : 9);
  function pickNode(e) {
    const p = clientToWorld(e);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const r = nodeRadius(n.level) + 4; // tolerancia
      if ((p.x - n.x) ** 2 + (p.y - n.y) ** 2 <= r * r) return n;
    }
    return null;
  }

  /* ---------- Render ---------- */
  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  let hoverNode = null;

  stage.addEventListener('mousemove', (e) => {
    hoverNode = pickNode(e);
  });

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(width * DPR));
    canvas.height = Math.max(1, Math.floor(height * DPR));

    // primera vez: layout inicial centrado
    if (!resize._done) {
      layoutInitial(canvas.width, canvas.height);
      resize._done = true;
    }
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    // física
    stepForces(canvas.width, canvas.height);

    // pintar
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // links
    ctx.lineWidth = 1 * view.k;
    links.forEach(l => {
      const a = nodeById[l.source], b = nodeById[l.target];
      const A = applyTransform(a.x, a.y);
      const B = applyTransform(b.x, b.y);

      ctx.strokeStyle = COLORS.link;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    });

    // nodos
    nodes.forEach(n => {
      const p = applyTransform(n.x, n.y);
      const r = nodeRadius(n.level) * view.k;

      // halo en hover
      if (hoverNode === n) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,159,26,0.08)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = [COLORS.l0, COLORS.l1, COLORS.l2, COLORS.l3][n.level] || COLORS.text;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // etiquetas (no saturar en zoom out)
      if (view.k > 0.8) {
        ctx.font = `${Math.max(10, 11 * view.k)}px "Inter", system-ui, -apple-system, Segoe UI, Roboto`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.text;
        ctx.globalAlpha = 0.92;
        ctx.fillText(n.label, p.x + r + 8, p.y);
        ctx.globalAlpha = 1;
      }
    });

    ctx.restore();
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
})();
