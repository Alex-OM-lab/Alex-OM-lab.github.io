/* ============================================
   Tools UI — Render + Medidores + Paginación
   (pager arriba derecha + chips de SO a la derecha)
   ============================================ */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- Datos (ajústalos cuando quieras) ----
  const TOOLS = [
    { name: "Ansible", os: "linux" },
    { name: "Docker", os: "multi" },
    { name: "Kali / Nmap", os: "linux" },
    { name: "Burp Suite", os: "windows/linux" },
    { name: "Metasploit", os: "linux" },
    { name: "OpenVAS", os: "linux" },
    { name: "Wireshark", os: "windows/linux" },
    { name: "pfSense", os: "linux" },
    { name: "Git/GitHub", os: "multi" },
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

    // Paginación solo para Herramientas (arriba derecha)
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
      .map((l) => {
        const lvl = (l.level || "").toLowerCase();
        return `
          <button class="tool-btn" type="button" data-level="${escapeHtml(l.level)}" aria-label="${escapeHtml(l.name)} ${escapeHtml(l.level)}">
            <span class="tool-slot--left"></span>
            <span class="tool-name">${escapeHtml(l.name)}</span>
            <span class="tool-slot--right level">
              <span class="level-label">${escapeHtml(l.level)}</span>
              <span class="meter" aria-hidden="true"><i></i></span>
            </span>
          </button>`;
      })
      .join("");
  }

  /* ---------- 3 niveles fijos para barras ---------- */
  function normalizeMeters() {
    $$('.tool-btn[data-level]').forEach((btn) => {
      const lvl = (btn.getAttribute("data-level") || "").toLowerCase().trim();
      const bar = $(".meter i", btn);
      if (!bar) return;
      let w = 33;
      if (lvl === "alto") w = 100;
      else if (lvl === "medio-alto" || lvl === "medio alto" || lvl === "medioalto" || lvl === "medio") w = 66;
      else if (lvl === "basico" || lvl === "básico") w = 33;

      // seguridad para no desbordar
      w = Math.max(0, Math.min(100, w));
      bar.style.width = w + "%";
    });
  }

  /* ---------- Paginación ARRIBA-DERECHA (Herramientas) ---------- */
  function enablePagingTopRight(listEl, { perPage = 8, cardEl = null } = {}) {
    const items = $$(".tool-btn", listEl);

    // limpiar cualquier paginador previo en la tarjeta
    if (cardEl) {
      $$(".tools-pager", cardEl).forEach((n) => n.remove());
    }

    if (items.length <= perPage) {
      items.forEach((el) => (el.style.display = ""));
      return;
    }

    const pages = chunk(items, perPage);
    let page = 0;

    // Controles
    const pager = document.createElement("div");
    pager.className = "tools-pager topright"; // <- CSS lo colocará arriba derecha

    const prev = mkArrow("‹");
    const next = mkArrow("›");
    const dots = document.createElement("div");
    dots.className = "tools-dots";

    pager.appendChild(prev);
    pager.appendChild(dots);
    pager.appendChild(next);

    const dotEls = pages.map((_, i) => {
      const d = document.createElement("div");
      d.className = "tools-dot";
      d.addEventListener("click", () => render(i));
      dots.appendChild(d);
      return d;
    });

    prev.addEventListener("click", () => render(page - 1));
    next.addEventListener("click", () => render(page + 1));

    // Insertar pager en la tarjeta contenedora
    if (cardEl) cardEl.appendChild(pager);

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
    // Devuelve array de {cls:'win'|'lnx'|'mul', label:'Windows'|...}
    if (!input) return [];
    const raw = String(input)
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[|]/g, "/");

    const parts = raw.split(/[\/,]+/).filter(Boolean);
    const uniq = Array.from(new Set(parts.length ? parts : [raw]));
    return uniq.map((p) => {
      if (p.includes("win")) return { cls: "win", label: "Windows" };
      if (p.includes("lin")) return { cls: "lnx", label: "Linux" };
      return { cls: "mul", label: "Multi" };
    });
  }

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const chunk = (arr, n) => arr.reduce((a, _, i) => (i % n ? a : [...a, arr.slice(i, i + n)]), []);
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
