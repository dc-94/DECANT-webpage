import AdminNavbar from '../components/layout/AdminNavbar';

export default function LockedStorefront() {
  return (
    <div className="min-h-screen bg-neutral-white">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto pt-12 px-6">
        <header className="border-b border-dark-blue/10 pb-8 mb-12">
          <p className="font-poppins font-black text-[10px] uppercase tracking-[0.4em] text-light-blue mb-2">Configuración Visual</p>
          <h1 className="font-playfair italic text-6xl text-dark-blue">Locked Storefront</h1>
        </header>
        
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-dark-blue/5">
            <p className="font-poppins text-xs uppercase tracking-widest text-dark-blue/20">Módulos de edición de tienda...</p>
        </div>
      </main>
    </div>
  );
}