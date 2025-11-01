/* ===== Footer año ===== */
(function(){ const y=document.getElementById('y'); if(y) y.textContent=new Date().getFullYear(); })();

/* ===== Typing + cursores + arranque del glitch ===== */
(function(){
  const nameText = "Alejandro Orcajada Meseguer";
  const roleText = "Administrador de Sistemas y Ciberseguridad";
  const speed = 44;

  const elName   = document.getElementById('typeName');
  const elRole   = document.getElementById('typeRole');
  const curName  = document.getElementById('cursorName');
  const curRole  = document.getElementById('cursorRole');
  const lead     = document.getElementById('lead');

  let i=0, j=0;

  const delayBeforeName = 700; // deja parpadear 2 veces antes de escribir
  setTimeout(typeName, delayBeforeName);

  function typeName(){
    if(!elName) return;
    if(i < nameText.length){
      elName.textContent += nameText.charAt(i++);
      setTimeout(typeName, speed);
    }else{
      setTimeout(()=>{
        curName?.classList.add('off');
        curRole?.classList.remove('off');
        typeRole();
      }, 500);
    }
  }

  function typeRole(){
    if(!elRole) return;
    if(j < roleText.length){
      elRole.textContent += roleText.charAt(j++);
      setTimeout(typeRole, speed);
    }else{
      curRole?.classList.add('off');
      lead?.classList.add('show');
      setTimeout(()=>{ startCyberTitleGlitch(); }, 1000);
    }
  }
})();

/* ===== Glitch ===== */
const GLITCH_CFG = {
  bandMin: 2, bandMax: 10,
  strong: { dur: 200, amp: 26, skew: 5.5, baseDX: 0,  baseDY: -4 },   // pulso fuerte (una vez al final)
  small:  { dur: 120, amp: 7,  skew: 1.2, baseDX: 6,  baseDY: 0  },   // pulsos suaves
  smallAttenuation: 0.25,
  gapProb: 0.08, bigTearProb: 0.14, bigTearAmp: 32,
  pxDownscale: 0.75, chromaShift: 0.7
};

function pulse(kind='strong'){
  const h1 = document.getElementById('heroTitle');
  const canvas = document.getElementById('glitchCanvas');
  if(!h1 || !canvas) return;

  const r = h1.getBoundingClientRect();
  const W = Math.max(1, Math.ceil(r.width));
  const H = Math.max(1, Math.ceil(r.height));
  canvas.width=W; canvas.height=H;
  const ctx = canvas.getContext('2d');

  // Snapshot con leve aberración RGB
  const off = document.createElement('canvas'); off.width=W; off.height=H;
  const octx = off.getContext('2d');
  const cs = getComputedStyle(h1);
  octx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  octx.textBaseline='top'; octx.textAlign='left';
  const txt = h1.textContent.trim() || ' ';
  octx.fillStyle='#00e6f6'; octx.fillText(txt, -GLITCH_CFG.chromaShift, 0);
  octx.fillStyle='#ff2a6d'; octx.fillText(txt,  GLITCH_CFG.chromaShift, 0);
  octx.fillStyle=cs.color || '#ff9f1a'; octx.fillText(txt, 0, 0);

  // Versión pixelada
  const scale = GLITCH_CFG.pxDownscale;
  const lowW = Math.max(1, Math.round(W*scale));
  const lowH = Math.max(1, Math.round(H*scale));
  const low = document.createElement('canvas'); low.width=lowW; low.height=lowH;
  const lctx = low.getContext('2d'); lctx.imageSmoothingEnabled=false;
  lctx.drawImage(off, 0,0, lowW,lowH);

  canvas.style.display='block';
  h1.style.visibility='hidden';

  const base = GLITCH_CFG[kind];
  const att  = (kind==='small') ? GLITCH_CFG.smallAttenuation : 1;
  const cfg = { dur:base.dur, amp:base.amp*att, skew:base.skew*att, baseDX:base.baseDX, baseDY:base.baseDY };

  const t0 = performance.now();
  function frame(t){
    const k = Math.min(1, (t - t0) / cfg.dur);
    ctx.clearRect(0,0,W,H);
    ctx.imageSmoothingEnabled=false;

    let y=0, band=0;
    while(y<H){
      const bh = Math.min(H-y, randInt(GLITCH_CFG.bandMin, GLITCH_CFG.bandMax));
      const dir = (band++ % 2 === 0) ? -1 : 1;

      if(Math.random() < GLITCH_CFG.gapProb){ y+=bh; continue; }

      const baseAmp = cfg.amp * (1-k);
      let dx = Math.round(baseAmp * (0.3 + Math.random()*0.6)) * dir;
      if(Math.random() < GLITCH_CFG.bigTearProb){
        dx += Math.round(GLITCH_CFG.bigTearAmp * (0.5 + Math.random()*0.5)) * dir;
      }
      const dy = Math.tan((cfg.skew*(1-k)) * Math.PI/180) * dir;

      const sy = Math.round((y/H)*lowH);
      const sh = Math.max(1, Math.round((bh/H)*lowH));
      ctx.drawImage(low, 0,sy,lowW,sh,  cfg.baseDX+dx, Math.round(cfg.baseDY+y+dy),  W,bh);

      y += bh;
    }
    if(k<1) requestAnimationFrame(frame);
    else { canvas.style.display='none'; h1.style.visibility='visible'; }
  }
  requestAnimationFrame(frame);
}

/* Secuencia: fuerte al comienzo → pequeños cada X segundos en bucle */
async function startCyberTitleGlitch(){
  while(true){
    pulse('strong');                        // 1) fuerte (solo al ciclo de inicio)
    await wait(4000); pulse('small');       // 2) suave a los 4s
    await wait(6000); pulse('small');       // 3) a los 6s
    await wait(5000); pulse('small');       // 4) a los 5s
    await wait(6000); pulse('small');       // 5) a los 6s
    await wait(5000); pulse('small');       // 6) a los 5s
    await wait(3000);                       // pausa 3s y repite
  }
}

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function randInt(min,max){ return min + Math.floor(Math.random()*(max-min+1)); }
