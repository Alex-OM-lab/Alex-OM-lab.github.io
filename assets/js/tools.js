/* ===========================================================
   Herramientas y Lenguajes — LÓGICA DE INTERFAZ
   =========================================================== */
(function () {
  "use strict";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const root = $("#tools-pro");
  if (!root) return;

  const els = {
    toolsCard: $("#toolsCard", root),
    langsCard: $("#langsCard", root),
    langsBody: $("#langsBody", root),

    list: $("#toolsList", root),
    pagerDots: $("#pagerDots", root),
    pageCounter: $("#pageCounter", root),
    prevBtn: $("#prevBtn", root),
    nextBtn: $("#nextBtn", root),
    resultCount: $("#resultCount", root),

    searchBox: $("#searchBox", root),
    searchInput: $("#searchInput", root),
    clearBtn: $("#clearBtn", root),
    tagButtons: $$(".tag", root),
  };

  const TOOLS_SRC = [
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

  const ICONS = {
    default: "fa-solid fa-cube",
    linux: "fa-brands fa-linux",
    windows: "fa-brands fa-windows",
    multi: "fa-solid fa-layer-group",
    "Ansible": "fa-brands fa-redhat",
    "Docker": "fa-brands fa-docker",
    "Kali / Nmap": "fa-solid fa-magnifying-glass",
    "Burp Suite": "fa-solid fa-bug",
    "Metasploit": "fa-solid fa-skull-crossbones",
    "OpenVAS": "fa-solid fa-shield-halved",
    "Wireshark": "fa-solid fa-wave-square",
    "pfSense": "fa-solid fa-network-wired",
    "Proxmox": "fa-solid fa-server",
    "VMware/ESXi": "fa-solid fa-diagram-project",
    "Azure AD": "fa-solid fa-cloud",
    "Git/GitHub": "fa-brands fa-git-alt",
  };

  const normalizeOS = (raw) => {
    const s = String(raw || "").toLowerCase();
    const hasWin = /win/.test(s);
    const hasLin = /lin/.test(s);
    if (hasWin && hasLin) return "multi";
    if (hasWin) return "windows";
    if (hasLin) return "linux";
    return "multi";
  };

  const TOOLS = TOOLS_SRC.map(t => ({ name: t.name, os: normalizeOS(t.os) }));

  const state = {
    page: 0,
    perPage: Math.max(1, $$(".row", els.langsBody).length),
    query: "",
    os: new Set(),
    selected: new Set(),
  };

  function renderTools(withEntrance = false) {
    const filtered = applyFilters(TOOLS);
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
    state.page = Math.min(state.page, totalPages - 1);

    const start = state.page * state.perPage;
    const items = filtered.slice(start, start + state.perPage);

    els.list.innerHTML = items.map(t => {
      const active = state.selected.has(t.name) ? "active" : "";
      const icon = ICONS[t.name] || ICONS.default;
      return `
        <div class="row ${active}" data-id="${escapeHtml(t.name)}"
             role="button" tabindex="0" aria-pressed="${active ? "true" : "false"}"
             title="${escapeHtml(t.name)}">
          <div class="left"><i class="${icon}"></i> ${escapeHtml(t.name)}</div>
          <div class="right">${chip(t.os)}</div>
        </div>`;
    }).join("");

    els.pagerDots.innerHTML = Array.from({ length: totalPages }, (_, i) =>
      `<span class="dot ${i === state.page ? "active" : ""}"></span>`
    ).join("");
    els.pageCounter.textContent = `${state.page + 1}/${totalPages}`;
    els.prevBtn.disabled = state.page === 0;
    els.nextBtn.disabled = state.page === totalPages - 1;

    els.resultCount.textContent = filtered.length;

    bindSelectableRows(els.list);

    if (withEntrance) {
      $$(".row", els.list).forEach((row, i) => {
        row.classList.add("page-enter");
        row.style.animationDelay = `${i * 40}ms`;
        row.addEventListener("animationend", () => {
          row.classList.remove("page-enter");
          row.style.animationDelay = "";
        }, { once: true });
      });
    }

    lockCardHeights();
  }

  function applyFilters(items) {
    let out = items;
    if (state.query) {
      const q = state.query;
      out = out.filter(t => t.name.toLowerCase().includes(q));
    }
    if (state.os.size) {
      out = out.filter(t => state.os.has(t.os));
    }
    return out;
  }

  function chip(os) {
    const map = {
      linux:   { cls: "chip linux",   label: "Linux",   icon: "fa-brands fa-linux",      tip: "Disponible en Linux" },
      windows: { cls: "chip windows", label: "Windows", icon: "fa-brands fa-windows",    tip: "Disponible en Windows" },
      multi:   { cls: "chip multi",   label: "Multi",   icon: "fa-solid fa-layer-group", tip: "Disponible en varios sistemas" },
    };
    const d = map[os] || map.multi;
    return `<span class="${d.cls}" data-tooltip="${d.tip}"><i class="${d.icon}"></i>${d.label}</span>`;
  }

  function bindSelectableRows(scope = root) {
    $$('.row[role="button"]', scope).forEach(row => {
      const pulse = () => {
        row.classList.add("pulse");
        const end = () => { row.classList.remove("pulse"); row.removeEventListener("animationend", end); };
        row.addEventListener("animationend", end);
      };
      row.addEventListener("click", () => {
        const id = row.dataset.id;
        if (state.selected.has(id)) state.selected.delete(id);
        else state.selected.add(id);
        row.classList.toggle("active");
        row.setAttribute("aria-pressed", state.selected.has(id) ? "true" : "false");
        pulse();
      });
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); row.click(); }
      });
    });
  }

  let lockedHeight = 0;
  function resetLock() {
    lockedHeight = 0;
    els.toolsCard?.style.setProperty("--locked-card-height", "auto");
    els.langsCard?.style.setProperty("--locked-card-height", "auto");
  }
  function lockCardHeights() {
    if (!els.toolsCard || !els.langsCard) return;
    els.toolsCard.style.setProperty("--locked-card-height", "auto");
    els.langsCard.style.setProperty("--locked-card-height", "auto");
    const h = Math.max(els.toolsCard.offsetHeight, els.langsCard.offsetHeight);
    lockedHeight = Math.max(lockedHeight, h);
    els.toolsCard.style.setProperty("--locked-card-height", lockedHeight + "px");
    els.langsCard.style.setProperty("--locked-card-height", lockedHeight + "px");
  }

  let searchTimer = null;
  els.searchInput?.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = (e.target.value || "").trim().toLowerCase();
      els.searchBox?.classList.toggle("has-text", !!state.query);
      state.page = 0;
      renderTools(true);
    }, 120);
  });
  els.clearBtn?.addEventListener("click", () => {
    if (!els.searchInput) return;
    els.searchInput.value = "";
    state.query = "";
    els.searchBox?.classList.remove("has-text");
    state.page = 0;
    renderTools(true);
  });
  els.tagButtons.forEach(tag => {
    tag.addEventListener("click", () => {
      const val = (tag.dataset.os || "").trim();
      if (!val) return;
      if (tag.classList.toggle("on")) state.os.add(val);
      else state.os.delete(val);
      state.page = 0;
      renderTools(true);
    });
  });
  els.prevBtn?.addEventListener("click", () => {
    if (state.page > 0) { state.page--; renderTools(true); }
  });
  els.nextBtn?.addEventListener("click", () => {
    const tp = Math.max(1, Math.ceil(applyFilters(TOOLS).length / state.perPage));
    if (state.page < tp - 1) { state.page++; renderTools(true); }
  });

  window.addEventListener("resize", () => {
    resetLock();
    renderTools(false);
    requestAnimationFrame(lockCardHeights);
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.addEventListener("load", () => {
    renderTools(true);
    requestAnimationFrame(lockCardHeights);
  });
})();
