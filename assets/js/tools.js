/* ============================================
   Tools UI — Render + Medidores + Paginación
   (versión con fixes: pager único + SO múltiples)
   ============================================ */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- Datos (ajústalos cuando quieras) ----
  const TOOLS = [
    { name: "Ansible", os: "linux", notes: "Automatización" },
    { name: "Docker", os: "multi", notes: "Contenedores" },
    { name: "Kali / Nmap", os: "linux", notes: "Pentest" },
    { name: "Burp Suite", os: "windows/linux", notes: "AppSec" },
    { name: "Metasploit", os: "linux", notes: "Red Team" },
    { name: "OpenVAS", os: "linux", notes: "Vuln Mgmt" },
    { name: "Wireshark", os: "windows/linux", notes: "Redes" },
    { name: "pfSense", os: "linux", notes: "Firewall" },
    { name: "Proxmox", os: "linux", notes: "Virtualización" },
    { name: "VMware/ESXi", os: "windows", notes: "Virtualización" },
    { name: "Azure AD", os: "windows", notes: "IAM" },
    { name: "Git/GitHub", os: "multi", notes: "VC / CI" },
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
    const toolsList = $("#toolsList");
    const langsList = $("#langsList");

    if (toolsList) renderTools(toolsList, TOOLS);
    if (langsList) renderLangs(langsList, LANGS);

    normalizeMeters();

    // Paginación solo para Herramientas
    if (toolsList) {
      const card = toolsList.closest(".tools-card") || toolsList.parentElement;
      const footer = $("#toolsFooter", card) || $(".card-footer", card) || card;
      enablePaging(toolsList, { perPage: 8, footerEl: footer });
    }
  });

  /* ---------- Render ---------- */

  function renderTools(container, data) {
    container.innerHTML = data
      .map((t) => {
        const osBadges = parseOs(t.os)
          .map((o) => `<span class="badge os ${o.cls}"></span>`)
          .join("");
        const rightChip = t.notes ? `<span class="badge">${escapeHtml(t.notes)}</span>` : "";
        return `
          <button class="tool-btn" type="button" aria-label="${escapeHtml(t.name)}">
            <span class="tool-slot--left">${osBadges}</span>
            <span class="tool-name">${escapeHtml(t.name)}</span>
            <span class="tool-slot--right">${rightChip}</span>
          </button>`;
      })
      .join("");
  }

  function renderLangs(container, data) {
    container.innerHTML = data
      .map(
        (l) => `
      <div class="tool-btn" data-level="${escapeHtml(l.level)}">
        <span class="tool-slot--left"></span>
        <span class="tool-name">${escapeHtml(l.name)}</span>
        <span class="tool-slot--right">
          <span class="level">
            <span class="level-label badge">${labelLevel(l.level)}</span>
            <span class="meter" aria-hidden="true"><i></i></span>
          </span>
        </span>
      </div>`
      )
      .join("");
  }

  /* ---------- Medidores ---------- */

  function normalizeMeters() {
    $$('.tool-btn[data-level]').forEach((btn) => {
      const lvl = (btn.getAttribute("data-level") || "").toLowerCase().trim();
      const bar = $(".meter i", btn);
      if (!bar) return;
      let w = 50;
      if (lvl === "alto") w = 90;
      else if (lvl === "medio-alto" || lvl === "medio alto" || lvl === "medioalto") w = 75; // FIX typo 7\n5
      else if (lvl === "medio") w = 55;
      bar.style.width = w + "%";
    });
  }

  /* ---------- Paginación (Herramientas) ---------- */

  function enablePaging(listEl, { perPage = 8, footerEl = null } = {}) {
    const items = $$(".tool-btn", listEl);
    // Limpia cualquier paginador/flechas previos en el footer para evitar duplicados
    if (footerEl) {
      $$(".tools-pager", footerEl).forEach((n) => n.remove());
      // por si el HTML tenía flechas sueltas
      $$(".tools-arrow", footerEl).forEach((n) => n.remove());
    }

    if (items.length <= perPage) {
      // No hace falta paginar: asegúrate de que se vean todos y no haya controles
      items.forEach((el) => (el.style.display = ""));
      return;
    }

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

    const host = footerEl || listEl.parentElement || listEl;
    host.appendChild(pager);

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
      dotEls.forEach((d, i) => d.classList.toggle("is-active", i === page));
      prev.disabled = page === 0;
      next.disabled = page === pages.length - 1;
    }
  }

  /* ---------- Helpers ---------- */

  function parseOs(input) {
    // Devuelve array de {cls:'win'|'lnx'|'mul', label:'Windows'|...}
    if (!input) return [];
    const raw = String(input)
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[|]/g, "/"); // por si alguien usa |

    // si trae varios (/, ,)
    const parts = raw.split(/[\/,]+/).filter(Boolean);
    const uniq = Array.from(new Set(parts.length ? parts : [raw]));

    return uniq.map((p) => {
      if (p === "win" || p === "windows") return { cls: "win", label: "Windows" };
      if (p === "lnx" || p === "linux") return { cls: "lnx", label: "Linux" };
      if (p === "multi" || p === "mul" || p === "cross" || p === "crossplatform") return { cls: "mul", label: "Multi" };
      // fallback: intenta detectar palabras clave
      if (p.includes("win")) return { cls: "win", label: "Windows" };
      if (p.includes("lin")) return { cls: "lnx", label: "Linux" };
      return { cls: "mul", label: "Multi" };
    });
  }

  function labelLevel(level) {
    const l = (level || "").toLowerCase();
    if (l === "alto") return "Alto";
    if (l === "medio-alto" || l === "medio alto" || l === "medioalto") return "Medio-alto";
    return "Medio";
  }

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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
