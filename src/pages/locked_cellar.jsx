import { Link } from 'react-router-dom';
import AdminNavbar from '../components/layout/AdminNavbar';

const Icons = {
  Inventario: () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  ),
  Ventas: () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M9 14l6-6m-4 0h4v4M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
  ),
  Clientes: () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  ),
  Ajustes: () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  Storefront: () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  )
};

export default function LockedCellar() {
  const cards = [
    {
      titulo: 'Inventario',
      descripcion: 'Alta, baja y edición de productos. Control de stock y precios.',
      icono: <Icons.Inventario />,
      link: '/locked_cellar/inventario',
      color: 'hover:border-brand-orange hover:text-brand-orange'
    },
    {
      titulo: 'Ventas y Órdenes',
      descripcion: 'Registro de órdenes, confirmaciones y detalle de pagos.',
      icono: <Icons.Ventas />,
      link: '/locked_cellar/ventas',
      color: 'hover:border-brand-orange hover:text-brand-orange'
    },
    {
      titulo: 'Diseño Storefront',
      descripcion: 'Edición visual del inicio: banners, anuncios, carrusel y secciones.',
      icono: <Icons.Storefront />,
      link: '/locked_storefront', // El panel que acabamos de hacer
      color: 'hover:border-brand-orange hover:text-brand-orange'
    },
    {
      titulo: 'Base de Clientes',
      descripcion: 'Directorio de compradores y su historial de consumo.',
      icono: <Icons.Clientes />,
      link: '/locked_cellar/clientes',
      color: 'hover:border-brand-orange hover:text-brand-orange'
    },
    {
      titulo: 'Ajustes de Tienda',
      descripcion: 'Edición de Categorías, Subcategorías y Cepas del menú.',
      icono: <Icons.Ajustes />,
      link: '/locked_cellar/ajustes',
      color: 'hover:border-brand-orange hover:text-brand-orange'
    }
  ];

  return (
    <div className="min-h-screen bg-extra-black font-poppins text-brand-white">
      <AdminNavbar />
      
      <div className="p-6 md:p-12">
        <header className="max-w-6xl mx-auto mb-12 border-b border-light-blue/10 pb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest mb-2 text-brand-white">LOCKED CELLAR</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-dark-grey">Panel de Control Central</p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <Link key={idx} to={card.link} className={`group bg-[#111111] border border-light-blue/10 p-8 flex flex-col items-start transition-all duration-300 ${card.color}`}>
              <div className="mb-6 p-4 bg-[#1A1A1A] rounded-sm border border-light-blue/5 text-brand-white group-hover:scale-110 group-hover:text-inherit transition-all duration-300">
                {card.icono}
              </div>
              <h2 className="text-xl font-bold uppercase tracking-widest mb-3 text-brand-white group-hover:text-inherit transition-colors">
                {card.titulo}
              </h2>
              <p className="text-sm text-dark-grey leading-relaxed font-medium flex-1">
                {card.descripcion}
              </p>
              
              <div className="mt-8 pt-6 border-t border-light-blue/5 w-full flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-dark-grey group-hover:text-inherit transition-colors">Acceder</span>
                <span className="text-lg leading-none text-dark-grey group-hover:text-inherit group-hover:translate-x-2 transition-all">→</span>
              </div>
            </Link>
          ))}
        </main>
      </div>
    </div>
  );
}