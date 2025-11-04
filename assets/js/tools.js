/* ============================================
   Tools UI — versión con barra de 3 niveles (Bajo / Medio / Alto)
   ============================================ */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- Datos ----
  const TOOLS = [
    { name: "Ansible", os: "linux" },
    { name: "Docker", os: "multi" },
    { name: "Kali / Nmap", os: "linux" },
    { name: "Burp Suite", os: "windows/linux" },
    { name: "Metasploit", os: "linux" },
    { name: "OpenVAS", os: "linux" },
    { name: "Wireshark", os: "windows/linux" },
    { name: "pfSense", os: "linux" },
    { name: "Proxmox", os: "linux" },
    { name: "VMware/ESXi", os: "windows" },
    { name: "Azure AD", os: "windows" },
    { name: "Git/GitHub", os: "multi" },
  ];

  const LANGS = [
    { name: "Bash", level: "alto" },
    { name: "PowerShell", level: "medio" },
    { name: "SQL", level: "medio" },
    { name: "Python", level: "bajo" },
    { name: "HTML/CSS", level: "medio" },
    { name: "JavaScript", level: "medio" },
    { name: "YAML/Ansible", level: "alto" },
  ];

  document.addEventListener("DOMContentLoaded", () => {
    const toolsList = $("#toolsList");
    const langsList = $("#langsList");

    if (toolsList) renderTools(toolsList, TOOLS);
    if (langsList) renderLangs(langsList, LANGS);

    if (langsList) renderLevelBars(langsList);

    if (toolsList) {
      const card = toolsList.closest(".tools-card") || toolsList.parentElement;
      enablePagingTopRight(toolsList, { perPage: 8, cardEl: card });
    }
  });

  /* ---------- Render ---------- */

  function renderTools(container, data) {
    container.innerHTML = data
      .map((t) => {
        const osBadges = parseOs(t.os)
          .map((o) => `<span class="badge os ${o.cls}"></span>`)
          .join("");
        return `
          <button class="tool-btn" type="button" aria-label="${escapeHtml(t.name)}">
            <span class="tool-slot--left"></span>
            <span class="tool-name">${escapeHtml(t.name)}</span>
            <span class="tool-slot--right">${osBadges}</span>
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
            <div class="level-bar" data-level="${escapeHtml(l.level)}">
              <span class="bar-segment"></span>
              <span class="bar-segment"></span>
              <span class="bar-segment"></span>
            </div>
          </span>
        </div>`
      )
      .join("");
  }

  /* ---------- Nueva barra de 3 niveles ---------- */
  function renderLevelBars(root) {
    $$(".level-bar", root).forEach((bar) => {
      const level = (bar.getAttribute("data-level") || "").toLowerCase();
      const segments = $$(".bar-segment", bar);

      // Resetea
      segments.forEach((s) => s.classList.remove("active"));

      // Asigna número de segmentos activos
      let activeCount = 1;
      if (level === "medio") activeCount = 2;
      if (level === "alto") activeCount = 3;

      segments.forEach((s, i) => {
        if (i < activeCount) s.classList.add("active");
      });
    });
  }

  /* ---------- Paginación ARRIBA-DERECHA (Herramientas) ---------- */
  function enablePagingTopRight(listEl, { perPage = 8, cardEl = null } = {}) {
    const items = $$(".tool-btn", listEl);
    if (cardEl) $$(".tools-pager", cardEl).forEach((n) => n.remove());
    if (items.length <= perPage) {
      items.forEach((el) => (el.style.display = ""));
      return;
    }
    const pages = chunk(items, perPage);
    let page = 0;
    const pager = document.createElement("div");
    pager.className = "tools-pager topright";
    const prev = mkArrow("‹");
    const next = mkArrow("›");
    const dots = document.createElement("div");
    dots.className = "tools-dots";
    pager.append(prev, dots, next);
    const host = cardEl || listEl.parentElement || listEl;
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
      items.forEach((el) => (el.style.display = "none"));
      pages[page].forEach((el) => (el.style.display = ""));
      dotEls.forEach((d, i) => d.classList.toggle("is-active", i === page));
      prev.disabled = page === 0;
      next.disabled = page === pages.length - 1;
    }
  }

  /* ---------- Helpers ---------- */

  function parseOs(input) {
    if (!input) return [];
    const raw = String(input).toLowerCase().replace(/\s+/g, "").replace(/[|]/g, "/");
    const parts = raw.split(/[\/,]+/).filter(Boolean);
    const uniq = Array.from(new Set(parts.length ? parts : [raw]));
    return uniq.map((p) => {
      if (p.includes("win")) return { cls: "win", label: "Windows" };
      if (p.includes("lin")) return { cls: "lnx", label: "Linux" };
      return { cls: "mul", label: "Multi" };
    });
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
