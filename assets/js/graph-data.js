// /assets/js/graph-data.js
// ======================================================
// Contenido del mapa (L0–L3) + helpers para items por camino
// ======================================================

window.GRAPH_TREE = [
  {
    raiz: "Formación_Alejandro_Orcajada",
    areas: [
      {
        nombre: "Teoría",
        subcarpetas: [
          "Sistemas",
          "Ciberseguridad"
        ]
      },
      {
        nombre: "Portafolio",
        subcarpetas: [
          "Sistemas",
          "Ciberseguridad"
        ]
      }
    ]
  }
];

// ======================================================
// Ítems (L3) conscientes del camino (root > área > sub)
// ======================================================
window.GRAPH_ITEMS = {
  "Formación_Alejandro_Orcajada": {
    "Teoría": {
      "Sistemas": [
        "Introducción a los Sistemas Operativos",
        "Gestión de Usuarios y Permisos",
        "Configuración de Redes Locales",
        "Administración de Servidores Windows y Linux",
        "Diseño de Bases de Datos Relacionales",
        "Scripts de Automatización con PowerShell y Bash",
        "Copias de Seguridad y Restauración de Datos",
        "Cumplimiento y Documentación Técnica"
      ],
      "Ciberseguridad": [
        "Principios de Seguridad en Redes",
        "Hardening de Sistemas Linux y Windows",
        "Integración de Seguridad en CI/CD",
        "Introducción al Análisis Forense",
        "Fases del Pentesting Ético",
        "Gestión de Incidentes de Seguridad",
        "Evaluación de Riesgos según MAGERIT",
        "Requisitos del ENS e ISO 27001"
      ]
    },
    "Portafolio": {
      "Sistemas": [
        "Práctica: Instalación de Windows Server y Ubuntu",
        "Práctica: Configuración de VLANs y DHCP",
        "Práctica: Active Directory y Políticas GPO",
        "Práctica: Creación y Optimización de una Base de Datos MySQL",
        "Práctica: Montaje de Servidores Web Apache y Nginx",
        "Práctica: Implementación de un Entorno Virtual Seguro"
      ],
      "Ciberseguridad": [
        "Práctica: Escaneo de Red con Nmap",
        "Práctica: Auditoría de Seguridad Web con OWASP ZAP",
        "Práctica: Simulación de Ataque con Metasploit",
        "Práctica: Análisis de Memoria RAM con Volatility",
        "Práctica: Implementación de un SIEM con Wazuh",
        "Práctica: Elaboración de un Plan de Seguridad ENS"
      ]
    }
  }
};

// ======================================================
// Helper público: devuelve items por camino exacto
// ======================================================
window.GRAPH_GET_ITEMS = function(rootName, areaName, subName){
  const R = window.GRAPH_ITEMS?.[rootName]?.[areaName]?.[subName];
  if (Array.isArray(R) && R.length) return R;

  // Fallbacks por si falta algo:
  const alt1 = window.GRAPH_ITEMS?.[rootName]?.[areaName];
  if (alt1 && typeof alt1 === 'object') {
    const first = Object.values(alt1).find(a => Array.isArray(a) && a.length);
    if (first) return first;
  }
  // Último recurso: 6 placeholders
  return Array.from({length: 6}, (_,i)=> `Artículo ${i+1} — ${subName}`);
};

// ======================================================
// Fallback legacy (si algún código antiguo lo invoca)
// ======================================================
window.GRAPH_MAKE_SIX = function(name){
  // No conoce el camino, así que devolvemos placeholders:
  return Array.from({length: 6}, (_,i)=> `Artículo ${i+1} — ${name}`);
};
