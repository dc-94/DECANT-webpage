import MainNavbar from "../components/layout/MainNavbar";
import ProductCard from "../components/public/ProductCard"; 
import { useCatalog } from "../context/CatalogContext"; 

export default function Home() {
  const { productos } = useCatalog(); 

  // Tomamos los primeros 10 para que se vean dos filas completas en web
  const productosDestacados = productos.slice(0, 10);

  return (
    <div className="min-h-screen bg-transparent">
      <MainNavbar />

      <header className="relative w-full h-screen flex items-center justify-center border-b border-light-blue/10">
         <h1 className="text-brand-white text-6xl z-10 font-black tracking-widest italic">DECANT.</h1>
      </header>
      
      <section className="max-w-[90rem] mx-auto px-4 md:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-light-blue mb-4">Selección Exclusiva</h2>
          <h3 className="text-3xl font-light text-brand-white">Últimos Ingresos a la Cava</h3>
        </div>

        {/* 🚀 LA NUEVA GRILLA MINIMALISTA 🚀 */}
        {/* 2 en móvil, 3 en tablet, 5 en web. Mucho gap (espacio) entre ellas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
          {productosDestacados.map(prod => (
            <ProductCard key={prod.id} producto={prod} />
          ))}
        </div>
        
      </section>
    </div>
  );
}