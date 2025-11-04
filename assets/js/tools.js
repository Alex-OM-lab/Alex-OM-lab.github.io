/* =========================
   Herramientas & Lenguajes
   (render 2 columnas, chips largos)
   ========================= */

(function(){
  const toolsData = [
    { name: 'Nginx / Apache', so: 'Linux' },
    { name: 'AD / GPO',       so: 'Windows' },
    { name: 'Wazuh',          so: 'Linux' },
    { name: 'ELK',            so: 'Linux' },
    { name: 'OpenVAS',        so: 'Linux' },
    { name: 'Burp Suite',     so: 'Multi' },
    { name: 'Metasploit',     so: 'Linux' },
    { name: 'Docker',         so: 'Multi' },
    { name: 'Volatility',     so: 'Linux' },
    { name: 'Autopsy',        so: 'Multi' },
    { name: 'GNS3',           so: 'Multi' },
  ];

  const langsData = [
    { name:'Python',     level:'alto',       pct: 95 },
    { name:'PHP',        level:'alto',       pct: 92 },
    { name:'PowerShell', level:'medio',      pct: 60 },
    { name:'Bash',       level:'medio',      pct: 62 },
    { name:'SQL',        level:'medio-alto', pct: 78 },
    { name:'HTML',       level:'medio',      pct: 60 },
    { name:'CSS',        level:'medio',      pct: 58 },
    { name:'JavaScript', level:'medio',      pct: 64 },
  ];

  function mk(tag, cls, txt){
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (txt) el.textContent = txt;
    return el;
  }

  function badgeClass(so){
    if (!so) return 'mul';
    const v = so.toLowerCase();
    if (v.includes('win')) return 'win';
    if (v.includes('lin')) return 'lnx';
    return 'mul';
  }

  function renderTools(listEl){
    listEl.innerHTML = '';
    toolsData.forEach(t=>{
      const chip = mk('div','tool-chip');

      const left = mk('div','tool-left');
      const ttl  = mk('p','tool-title', t.name);
      left.appendChild(ttl);

      const right = mk('div','tool-right');
      const badge = mk('span', 'badge-so ' + badgeClass(t.so), t.so || 'Multi');
      right.appendChild(badge);

      chip.append(left,right);
      listEl.appendChild(chip);
    });
  }

  function renderLangs(listEl){
    listEl.innerHTML = '';
    langsData.forEach(l=>{
      const chip = mk('div','tool-chip');

      const left = mk('div','tool-left');
      const ttl  = mk('p','tool-title', l.name);
      left.appendChild(ttl);

      const right = mk('div','tool-right');
      const level = mk('div','level');
      const lb    = mk('span','level-badge', l.level);
      const bar   = mk('div','level-bar');
      const fill  = mk('div','level-fill');
      fill.style.width = Math.max(4, Math.min(100, l.pct)) + '%';
      bar.appendChild(fill);
      level.append(lb, bar);
      right.appendChild(level);

      chip.append(left, right);
      listEl.appendChild(chip);
    });
  }

  function init(){
    const toolsList = document.getElementById('toolsList');
    const langsList = document.getElementById('langsList');
    if (!toolsList || !langsList) return;
    renderTools(toolsList);
    renderLangs(langsList);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
