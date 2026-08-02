import { useState, useEffect } from 'react';

// =========================================
// BASE DE DATOS DE TIPS POR CATEGORÍA
// =========================================
const TIPS_DATA = {
  vinos: [
    {
      subtitulo: "El Ritual Decant",
      titulo: "Guía de Degustación",
      contenido: "Una buena cata involucra tres sentidos. Primero, la vista: observa el color y la densidad de las lágrimas. Segundo, la nariz: oxigena la copa y busca los aromas primarios (fruta) y terciarios (madera). Por último, la boca: evalúa la acidez, los taninos y el final que deja en tu paladar."
    },
    {
      subtitulo: "Servicio Perfecto",
      titulo: "Temperaturas Ideales",
      contenido: "La temperatura lo cambia todo. Sirve los espumantes muy fríos (6-8°C), los blancos y rosados fríos (8-12°C) para resaltar su acidez, y los tintos ligeramente frescos (16-18°C). Un tinto demasiado caliente resaltará el alcohol y esconderá la fruta."
    },
    {
      subtitulo: "Armonía en la mesa",
      titulo: "El arte del Maridaje",
      contenido: "Puedes maridar por similitud (un vino ligero con un plato suave) o por contraste (un vino dulce con un queso azul salado). La regla de oro: el vino nunca debe tapar el sabor de la comida, ni la comida opacar al vino. Ambos deben elevarse."
    }
  ],
  cafe: [
    {
      subtitulo: "El Ritual Decant",
      titulo: "Café de Especialidad",
      contenido: "¿Qué lo hace especial? Es un café que ha obtenido más de 80 puntos sobre 100 en catas profesionales. Significa trazabilidad total: sabemos de qué finca viene, a qué altura se cultivó y qué proceso tuvo. Es un producto artesanal, libre de defectos."
    },
    {
      subtitulo: "Extracción Perfecta",
      titulo: "Prensa vs. Italiana",
      contenido: "En la Prensa Francesa (infusión), usa molienda gruesa, agua a 92°C y deja reposar 4 minutos para un cuerpo sedoso. En la Cafetera Italiana o Moka (presión), usa molienda media-fina, agua pre-calentada en la base y fuego bajo para evitar quemar el café, logrando un sabor intenso."
    }
  ],
  oliva: [
    {
      subtitulo: "El Ritual Decant",
      titulo: "Variedades de Oliva",
      contenido: "No todo el aceite de oliva es igual. La variedad Arbequina ofrece notas dulces y frutadas (ideal para postres o pescados blancos). La Picual es intensa, picante y con notas a tomate (perfecta para carnes). La Frantoio aporta un equilibrio herbáceo exquisito."
    },
    {
      subtitulo: "Oro Líquido",
      titulo: "Beneficios en la Salud",
      contenido: "El Aceite de Oliva Virgen Extra (AOVE) es el pilar de la dieta mediterránea. Es rico en ácido oleico (Omega 9) y polifenoles, potentes antioxidantes naturales que protegen tu salud cardiovascular y reducen la inflamación celular."
    },
    {
      subtitulo: "Armonía en la mesa",
      titulo: "Tips de Maridaje",
      contenido: "Trata al AOVE como un condimento estrella. Usa aceites suaves (Arbequina) para no enmascarar pescados o mayonesas. Usa aceites medios para pastas y verduras asadas. Reserva los intensos (Picual) para rociar sobre carnes rojas, quesos curados o tostadas con ajo."
    }
  ]
};

export default function DynamicGuide({ categoria }) {
  const [tipActivo, setTipActivo] = useState(null);

  useEffect(() => {
    if (!categoria) return;

    const catFiltro = categoria.toLowerCase();
    let poolDeTips = [];

    if (catFiltro.includes('caf') || catFiltro.includes('deli')) {
      poolDeTips = TIPS_DATA.cafe;
    } else if (catFiltro.includes('oliva') || catFiltro.includes('aceite')) {
      poolDeTips = TIPS_DATA.oliva;
    } else {
      poolDeTips = TIPS_DATA.vinos;
    }

    const randomTip = poolDeTips[Math.floor(Math.random() * poolDeTips.length)];
    setTipActivo(randomTip);
    
  }, [categoria]);

  if (!tipActivo) return null;

  return (
    <section className="bg-dark-blue py-24 md:py-32 px-6 relative overflow-hidden text-brand-white">
      
      {/* Luz decorativa sutil en el fondo (Naranja) */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <div className="max-w-[85rem] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* COLUMNA IZQUIERDA: Títulos (Centrado en móvil, Derecha en Desktop) */}
        <div className="lg:col-span-5 flex flex-col lg:border-r border-brand-white/10 lg:pr-16 text-center lg:text-right">
          <div className="mb-6 flex justify-center lg:justify-end text-brand-orange opacity-90">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <span className="font-poppins text-[10px] md:text-xs uppercase tracking-[0.3em] text-light-blue font-black mb-4 block">
            {tipActivo.subtitulo}
          </span>
          
          <h2 className="font-playfair italic text-4xl md:text-5xl lg:text-6xl text-brand-white leading-tight">
            {tipActivo.titulo}
          </h2>
        </div>

        {/* COLUMNA DERECHA: Párrafo con Letra Capitular (Drop Cap) */}
        <div className="lg:col-span-7 lg:pl-4">
          <p className="font-poppins text-sm md:text-base leading-loose text-brand-white/80">
            {tipActivo.contenido}
          </p>
        </div>

      </div>
    </section>
  );
}