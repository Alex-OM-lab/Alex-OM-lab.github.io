// /assets/js/graph-data.js
// ======================================================
// Mapa con L0: "Teoría" y "Portafolio"
// L1: "Sistemas" / "Ciberseguridad"
// L2: subcarpetas (listas)
// L3: títulos reales mediante GRAPH_GET_ITEMS(root, area, sub)
// ======================================================

window.GRAPH_TREE = [
  {
    raiz: "Teoría",
    areas: [
      {
        nombre: "Sistemas",
        subcarpetas: [
          "Fundamentos de Hardware y Sistemas Operativos",
          "Redes y Comunicaciones",
          "Administración de Servidores",
          "Bases de Datos",
          "Virtualización y Cloud",
          "Programación y Scripting",
          "Gestión y Mantenimiento",
          "Normativa, Documentación y Compliance"
        ]
      },
      {
        nombre: "Ciberseguridad",
        subcarpetas: [
          "Seguridad en Redes",
          "Seguridad en Sistemas",
          "DevSecOps y CI/CD",
          "Análisis Forense",
          "Pentesting y Auditorías",
          "Respuesta ante Incidentes",
          "Análisis de Riesgos y Plan Director",
          "Normativa, ENS, ISO y RGPD"
        ]
      }
    ]
  },
  {
    raiz: "Portafolio",
    areas: [
      {
        nombre: "Sistemas",
        subcarpetas: [
          "Instalación y Configuración de Sistemas Operativos",
          "Administración de Redes LAN y WAN",
          "Gestión de Servidores (AD, GPO, Backup)",
          "Administración de Bases de Datos (SQL/Oracle/PostgreSQL)",
          "Virtualización y Entornos de Pruebas",
          "Implantación de Aplicaciones Web"
        ]
      },
      {
        nombre: "Ciberseguridad",
        subcarpetas: [
          "Auditorías de Red y Pentesting",
          "Análisis Forense Digital",
          "Respuesta ante Incidentes (SIEM, Wazuh, Graylog)",
          "DevSecOps y Automatización",
          "Planes de Seguridad y Análisis de Riesgos",
          "Cumplimiento Normativo (ENS, ISO 27001, RGPD)"
        ]
      }
    ]
  }
];

// ======================================================
// Ítems L3 por camino (root > area > sub)
// Amplía/edita libremente estos arrays.
// Si falta alguno, se generan placeholders.
// ======================================================
window.GRAPH_ITEMS = {
  "Teoría": {
    "Sistemas": {
      "Fundamentos de Hardware y Sistemas Operativos": [
        "Tipos de kernels y arquitecturas",
        "Procesos, hilos y planificación",
        "Sistemas de archivos y permisos"
      ],
      "Redes y Comunicaciones": [
        "Modelo OSI vs TCP/IP",
        "Subnetting y VLANs",
        "Protocolos clave: ARP, DHCP, DNS, BGP"
      ],
      "Administración de Servidores": [
        "Servicios en Linux vs Windows",
        "Automatización de tareas de sistema",
        "Políticas de actualización y parcheo"
      ],
      "Bases de Datos": [
        "Modelado relacional y normalización",
        "Índices y planes de ejecución",
        "Backups lógicos vs físicos"
      ],
      "Virtualización y Cloud": [
        "Hypervisores tipo 1 y 2",
        "Conceptos IaaS/PaaS/SaaS",
        "Redes y seguridad en cloud"
      ],
      "Programación y Scripting": [
        "Bash avanzado: pipes y redirecciones",
        "PowerShell para administración",
        "Buenas prácticas de scripting"
      ],
      "Gestión y Mantenimiento": [
        "Inventario y CMDB",
        "Monitorización (métricas/logs/trazas)",
        "Gestión de cambios (ITIL)"
      ],
      "Normativa, Documentación y Compliance": [
        "Plantillas técnicas efectivas",
        "Evidencias y auditorías internas",
        "Ciclo de vida de documentación"
      ]
    },
    "Ciberseguridad": {
      "Seguridad en Redes": [
        "Segmentación y Zero Trust",
        "IDS/IPS y listas de control",
        "TLS, VPN y túneles seguros"
      ],
      "Seguridad en Sistemas": [
        "Hardening Linux/Windows",
        "Gestión de credenciales y secretos",
        "Registro y auditoría del sistema"
      ],
      "DevSecOps y CI/CD": [
        "Shift-left y SAST/DAST",
        "Firmado de artefactos",
        "SBOM y políticas de supply chain"
      ],
      "Análisis Forense": [
        "Adquisición: disco/memoria",
        "Cadena de custodia",
        "Herramientas: Autopsy/Volatility"
      ],
      "Pentesting y Auditorías": [
        "Metodología OSSTMM/OWASP",
        "Escaneo y enumeración",
        "Informe técnico y ejecutivo"
      ],
      "Respuesta ante Incidentes": [
        "Playbooks y niveles de severidad",
        "Coordinación y comunicación",
        "Post-mortem y lecciones aprendidas"
      ],
      "Análisis de Riesgos y Plan Director": [
        "MAGERIT y ISO 27005",
        "Cálculo y apetito de riesgo",
        "Roadmap y KPIs de seguridad"
      ],
      "Normativa, ENS, ISO y RGPD": [
        "Controles ENS (medidas básicas/medias/altas)",
        "ISO 27001: anexos y controles",
        "RGPD: bases legales y Dpia"
      ]
    }
  },

  "Portafolio": {
    "Sistemas": {
      "Instalación y Configuración de Sistemas Operativos": [
        "Lab: Windows Server + Ubuntu",
        "Unattended installs y preseed",
        "Post-config: NTP, SSH, RDP"
      ],
      "Administración de Redes LAN y WAN": [
        "Lab: VLANs y Trunking",
        "DHCP/DNS redundantes",
        "Routing estático y dinámico"
      ],
      "Gestión de Servidores (AD, GPO, Backup)": [
        "Lab: Dominio AD y OU",
        "Políticas de seguridad (GPO)",
        "Estrategia de backup 3-2-1"
      ],
      "Administración de Bases de Datos (SQL/Oracle/PostgreSQL)": [
        "Lab: réplica y HA",
        "Optimización de consultas",
        "Copias y restauraciones point-in-time"
      ],
      "Virtualización y Entornos de Pruebas": [
        "Lab: Proxmox/VMware",
        "Snapshots y clonación",
        "Redes virtuales aisladas"
      ],
      "Implantación de Aplicaciones Web": [
        "Lab: Nginx+PHP-FPM",
        "TLS y seguridad básica",
        "CI/CD simple con hooks"
      ]
    },
    "Ciberseguridad": {
      "Auditorías de Red y Pentesting": [
        "Lab: Nmap completo",
        "Enumeración de servicios",
        "Explotación controlada en entorno"
      ],
      "Análisis Forense Digital": [
        "Lab: timeline forense",
        "Búsqueda de IoC",
        "Informe con evidencias"
      ],
      "Respuesta ante Incidentes (SIEM, Wazuh, Graylog)": [
        "Lab: ingestión de logs",
        "Alertas y dashboards",
        "Playbook de triage"
      ],
      "DevSecOps y Automatización": [
        "Lab: Ansible hardening",
        "Pipeline con SAST/DAST",
        "Policies y gates"
      ],
      "Planes de Seguridad y Análisis de Riesgos": [
        "Mapa de activos",
        "Matriz de riesgos",
        "Plan director y seguimiento"
      ],
      "Cumplimiento Normativo (ENS, ISO 27001, RGPD)": [
        "Gap analysis ENS/ISO",
        "Plan de medidas",
        "Evidencias y auditoría"
      ]
    }
  }
};

// ======================================================
// Helper público: devuelve items (L3) por camino exacto.
// Si falta, devuelve el primer grupo disponible o placeholders.
// ======================================================
window.GRAPH_GET_ITEMS = function(rootName, areaName, subName){
  const R = window.GRAPH_ITEMS?.[rootName]?.[areaName]?.[subName];
  if (Array.isArray(R) && R.length) return R;

  // Alternativa: primer grupo existente bajo root/area
  const altArea = window.GRAPH_ITEMS?.[rootName]?.[areaName];
  if (altArea && typeof altArea === 'object') {
    const first = Object.values(altArea).find(a => Array.isArray(a) && a.length);
    if (first) return first;
  }

  // Último recurso: placeholders
  return Array.from({length: 6}, (_,i)=> `Artículo ${i+1} — ${subName}`);
};

// Fallback legacy por compatibilidad
window.GRAPH_MAKE_SIX = function(name){
  return Array.from({length: 6}, (_,i)=> `Artículo ${i+1} — ${name}`);
};

