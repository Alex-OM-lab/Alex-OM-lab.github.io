// /assets/js/graph-data.js
// ======================================================
// Estructura jerárquica que alimenta el mapa visual.
// Este archivo debe cargarse ANTES de graph.js
// ======================================================

window.GRAPH_TREE = [
  {
    raiz: "Teoría y datos curiosos",
    areas: [
      {
        nombre: "Ciberseguridad",
        subcarpetas: [
          "Análisis Forense",
          "DevSecOps",
          "Documentación e informes",
          "Puesta en producción segura",
          "Respuesta a incidentes",
          "Seguridad en redes",
          "Seguridad de sistemas"
        ]
      },
      {
        nombre: "Sistemas",
        subcarpetas: [
          "Administración de redes",
          "Backups y recuperación",
          "Bases de datos",
          "Gestión de sistemas",
          "Seguridad en sistemas",
          "Virtualización y conectividad"
        ]
      }
    ]
  },
  {
    raiz: "Portafolio",
    areas: [
      {
        nombre: "Ciberseguridad",
        subcarpetas: [
          "Análisis Forense",
          "DevSecOps",
          "Documentación e informes",
          "Puesta en producción segura",
          "Respuesta a incidentes",
          "Seguridad en redes",
          "Seguridad de sistemas"
        ]
      },
      {
        nombre: "Sistemas",
        subcarpetas: [
          "Administración de redes",
          "Backups y recuperación",
          "Bases de datos",
          "Gestión de sistemas",
          "Seguridad en sistemas",
          "Virtualización y conectividad"
        ]
      }
    ]
  }
];

// ------------------------------------------------------
// Función auxiliar opcional para generar artículos
// ------------------------------------------------------
window.GRAPH_MAKE_SIX = (name) =>
  Array.from({ length: 6 }, (_, i) => `Artículo ${i + 1} — ${name}`);

// ------------------------------------------------------
// Nota: No necesitas llamar a nada aquí.
// graph.js detectará automáticamente GRAPH_TREE
// y generará el mapa visual al cargar la página.
// ------------------------------------------------------
