import AdminNavbar from '../components/layout/AdminNavbar';

export default function AdminVentas() {
  return (
    <div className="min-h-screen bg-extra-black font-poppins text-brand-white flex flex-col">
      <AdminNavbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 text-dark-grey">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1" d="M9 14l6-6m-4 0h4v4M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest mb-4 text-brand-white">
          Ventas y Órdenes
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-light-blue">
          Módulo en construcción...
        </p>
      </main>
    </div>
  );
}