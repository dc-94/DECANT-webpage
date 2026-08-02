import { Link } from 'react-router-dom';

export default function InfoClientePedido({ pedido, esRetiro }) {
  const formatWhatsApp = (phone) => phone ? phone.replace(/\D/g, '') : '';
  
  const nombreCompleto = `${pedido.formData?.nombre || 'Socio'} ${pedido.formData?.apellido || ''}`.trim();
  const direccionCompleta = !esRetiro 
    ? `${pedido.formData.direccion} ${pedido.formData.numero || ''}${pedido.formData.piso ? `, Piso ${pedido.formData.piso}` : ''}, ${pedido.formData.ciudad || ''} (${pedido.formData.cp || ''})`
    : 'Retiro en Cava / Sin domicilio';

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center">
      <div className="flex-1 md:border-r border-slate-100 md:pr-4 w-full">
        <p className="font-black text-sm text-slate-900 mb-0.5">{nombreCompleto}</p>
        <p className="text-[10px] font-bold text-slate-500 mb-2">{pedido.clienteEmail}</p>
        {pedido.formData?.telefono ? (
          <a href={`https://wa.me/${formatWhatsApp(pedido.formData.telefono)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-[#1ebe5d] transition-colors">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            {pedido.formData.telefono}
          </a>
        ) : (
           <span className="text-[10px] font-bold text-slate-400">Sin teléfono</span>
        )}
      </div>

      <div className="flex-1 w-full relative">
        <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Destino / Entrega</p>
        <p className="text-[11px] font-bold text-slate-700 leading-tight">{direccionCompleta}</p>
        {pedido.formData?.referencia && <p className="text-[9px] text-slate-500 italic mt-1">Ref: {pedido.formData.referencia}</p>}
        <Link to="/locked_cellar/clientes" className="absolute top-0 right-0 text-[8px] font-black uppercase tracking-widest text-brand-orange hover:underline outline-none">
          VER CRM
        </Link>
      </div>
    </div>
  );
}