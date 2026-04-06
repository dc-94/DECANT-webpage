import AdminNavbar from '../components/layout/AdminNavbar';

export default function AdminClientes() {
  return (
    <div className="min-h-screen bg-extra-black font-poppins text-brand-white flex flex-col">
      <AdminNavbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 text-dark-grey">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest mb-4 text-brand-white">
          Base de Clientes
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-light-blue">
          Módulo en construcción...
        </p>
      </main>
    </div>
  );
}