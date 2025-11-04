/* ====== Tools & Languages data + render ======
   Renderiza dos columnas:
   - Herramientas: chip con badge de SO (linux/windows/multi)
   - Lenguajes: chip con medidor de nivel (% y etiqueta)
   ============================================= */

const TOOLS_DATA = [
  { name: "Nginx", os: "linux" },
  { name: "Apache", os: "linux" },
  { name: "AD / GPO", os: "windows" },
  { name: "Wazuh", os: "linux" },
  { name: "ELK", os: "linux" },
  { name: "OpenVAS", os: "linux" },
  { name: "Burp Suite", os: "multi" },
  { name: "Metasploit", os: "linux" },
  { name: "Docker", os: "multi" },
  { name: "Ansible", os: "linux" },
  { name: "Terraform", os: "multi" },
  { name: "Volatility", os: "linux" },
  { name: "Autopsy", os: "multi" },
  { name: "GNS3", os: "multi" },
];

const LANGS_DATA = [
  { name: "Python", level: 90, label: "alto" },
  { name: "PHP", level: 85, label: "alto" },
  { name: "Bash", level: 75, label: "medio-alto" },
  { name: "PowerShell", level: 65, label: "medio" },
  { name: "HTML", level: 60, label: "medio" },
  { name: "CSS", level: 60, label: "medio" },
  { name: "SQL", level: 70, label: "medio-alto" },
];

function renderTools() {
  const toolsBox = document.getElementById("toolsList");
  const langsBox = document.getElementById("langsList");
  if (!toolsBox || !langsBox) return;

  // Herramientas
  toolsBox.innerHTML = TOOLS_DATA.map(t => {
    const os = (t.os || "multi").toLowerCase();
    const osLabel = os === "linux" ? "Linux" : os === "windows" ? "Windows" : "Multi";
    return `
      <span class="tool-chip">
        ${t.name}
        <span class="badge ${os}">${osLabel}</span>
      </span>
    `;
  }).join("");

  // Lenguajes con medidor
  langsBox.innerHTML = LANGS_DATA.map(l => {
    const pct = Math.max(0, Math.min(100, l.level|0));
    const label = l.label || `${pct}%`;
    return `
      <span class="tool-chip level" style="--pct:${pct}%;" data-label="${label}">
        ${l.name}
      </span>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", renderTools);
