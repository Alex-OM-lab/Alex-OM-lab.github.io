 /* ========= Datos del NAV ========= */
  const twelve = base => Array.from({length:12}, (_,i)=>({label:`${base} · Artículo ${i+1}`, href:"#"}));

  const NAV_TREE = [
    { label:"Teoría y Casos Curiosos", children:[
      { label:"Ciberseguridad", href:"#", children:[
        { label:"Análisis Forense", href:"#", children: twelve("Teoría · Forense") },
        { label:"Respuesta a Incidentes", href:"#", children: twelve("Teoría · Incidentes") }
      ]},
      { label:"Sistemas", href:"#", children:[
        { label:"Redes", href:"#", children: twelve("Teoría · Redes") },
        { label:"Conceptos", href:"#", children: twelve("Teoría · Conceptos") }
      ]}
    ]},

    { label:"Portafolio", sticky:true, children:[
      { label:"Ciberseguridad", href:"/portafolio/Ciberseguridad/", children:[
        { label:"Análisis Forense", href:"#", children: twelve("Análisis Forense") },
        { label:"DevSecOps", href:"#", children: twelve("DevSecOps") },
        { label:"Documentación e informes", href:"#", children: twelve("Docs e informes") },
        { label:"Puesta en producción segura", href:"#", children: twelve("Producción segura") },
        { label:"Respuesta a Incidentes", href:"#", children: twelve("Respuesta a Incidentes") },
        { label:"Seguridad en redes", href:"#", children: twelve("Seguridad en redes") },
        { label:"Seguridad de sistemas", href:"#", children: twelve("Seguridad de sistemas") }
      ]},
      { label:"Sistemas", href:"/portafolio/sistemas/", children:[
        { label:"Linux", href:"#", children: twelve("Linux") },
        { label:"Windows", href:"#", children: twelve("Windows") },
        { label:"Automatización", href:"#", children: twelve("Automatización") }
      ]}
    ]},

    { label:"Laboratorio", href:"/Laboratorio/", children:[
      { label:"TryHackMe", href:"#", children: twelve("THM") },
      { label:"HackTheBox", href:"#", children: twelve("HTB") }
    ]},

    { label:"Contacto", href:"/contacto/" }
  ];
