/* ============================================
   Tools UI — Render + Medidores + Paginación
   ============================================ */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- Datos (edítalos a tu gusto) ----
  const TOOLS = [
    { name: "Ansible", os: "lnx", notes: "Automatización" },
    { name: "Docker", os: "mul", notes: "Contenedores" },
    { name: "Kali / Nmap", os: "lnx", notes: "Pentest" },
    { name: "Burp Suite", os: "mul", notes: "AppSec" },
    { name: "Metasploit", os: "lnx", notes: "Red Team" },
    { name: "OpenVAS", os: "lnx", notes: "Vuln Mgmt" },
    { name: "Wireshark", os: "mul", notes: "Redes" },
    { name: "pfSense", os: "lnx", notes: "Firewall" },
    { name: "Proxmox", os: "lnx", notes: "Virtualización" },
    { name: "VMware/ESXi", os: "win", notes: "Virtualización" },
    { name: "Azure AD", os: "win", notes: "IAM" },
    { name: "Git/GitHub", os: "mul", notes: "VC / CI" },
  ];

  const LANGS = [
    { name: "Bash", level: "alto" },
    { name: "PowerShell", level: "medio-alto" },
    { name: "SQL", level: "medio-alto" },
    { name: "Python", level: "medio" },
    { name: "YAML/Ansible", level: "medio-alto" },
    { name: "HTML/CSS", level: "medio" },
    { name: "JavaScript", level: "medio" },
  ];

  document.addEventListener("DOMContentLoaded", () => {
    // Render
    const toolsList = $("#toolsList");
    const langsList = $("#langsList");
    if (toolsList) renderTools(toolsList, TOOLS);
    if (langsList) renderLangs(langsList, LANGS);

    // Medidores
    normalizeMeters();

    // Paginación (si hay más de X herramientas)
    if (toolsList) enablePaging(toolsList, { perPage: 8 });
  });

  /* ---------- Render ---------- */

  function renderTools(container, data) {
    container.innerHTML = data
      .map(
        (t) => `
      <button class="tool-btn" type="button">
        <span class="tool-label">
          <span class="tool-name">${t.name}</span>
          <span class="badge ${mapOs(t.os)}">${labelOs(t.os)}</span>
        </span>
        <span class="badge">${t.notes || ""}</span>
      </button>`
      )
      .join("");
  }

  function renderLangs(container, data) {
    container.innerHTML = data
      .map(
        (l) => `
      <div class="tool-btn" data-level="${l.level}">
        <span class="tool-label">
          <span class="tool-name">${l.name}</span>
        </span>
        <span class="level">
          <span class="level-label">${labelLevel(l.level)}</span>
          <span class="meter" aria-hidden="true"><i></i></span>
        </span>
      </div>`
      )
      .join("");
  }

  function mapOs(os) {
    if (os === "lnx") return "lnx";
    if (os === "win") return "win";
    return "mul"; // multi-plataforma
  }
  function labelOs(os) {
    if (os === "lnx") return "Linux";
    if (os === "win") return "Windows";
    return "Multi";
  }
  function labelLevel(level) {
    if (level === "alto") return "Alto";
    if (level === "medio-alto") return "Medio-alto";
    return "Medio";
  }

  /* ---------- Medidores ---------- */

  function normalizeMeters() {
    $$('.tool-btn[data-level]').forEach((btn) => {
      const lvl = btn.getAttribute("data-level");
      const bar = $(".meter i", btn);
      if (!bar) return;
      let w = 50;
      if (lvl === "alto") w = 90;
      else if (lvl === "medio-alto") w = 75; // <-- FIX
      else if (lvl === "medio") w = 55;
      bar.style.width = w + "%";
    });
  }

  /* ---------- Paginación (solo para Herramientas) ---------- */

  function enablePaging(listEl, { perPage = 8 } = {}) {
    const items = $$(".tool-btn", listEl);
    if (items.length <= perPage) return; // no hace falta paginar

    const pages = chunk(items, perPage);
    let page = 0;

    // Controles
    const pager = document.createElement("div");
    pager.className = "tools-pager";
    const prev = mkArrow("‹");
    const next = mkArrow("›");
    const dots = document.createElement("div");
    dots.className = "tools-dots";

    pager.appendChild(prev);
    pager.appendChild(dots);
    pager.appendChild(next);

    const card = listEl.closest(".tools-card") || listEl.parentElement;
    card.appendChild(pager);

    const dotEls = pages.map((_, i) => {
      const d = document.createElement("span");
      d.className = "tools-dot" + (i === 0 ? " is-active" : "");
      d.addEventListener("click", () => render(i));
      dots.appendChild(d);
      return d;
    });

    prev.addEventListener("click", () => render(page - 1));
    next.addEventListener("click", () => render(page + 1));

    render(0);

    function render(p) {
      page = clamp(p, 0, pages.length - 1);
      // Oculta todo
      items.forEach((el) => (el.style.display = "none"));
      // Muestra solo la página actual
      pages[page].forEach((el) => (el.style.display = ""));
      // Estado de dots / flechas
      dotEls.forEach((d, i) =>
        d.classList.toggle("is-active", i === page)
      );
      prev.disabled = page === 0;
      next.disabled = page === pages.length - 1;
    }
  }

  /* ---------- Helpers ---------- */
  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function mkArrow(txt) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tools-arrow";
    b.textContent = txt;
    return b;
  }
})();
