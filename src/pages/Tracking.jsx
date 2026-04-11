import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import MainNavbar from '../components/layout/MainNavbar';
import Footer from '../components/layout/Footer';

// Íconos
const CheckIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>);
const PackageIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>);
const WhatsappIcon = ({ className }) => (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>);

export default function TrackingPedido() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [whatsappEmpresa, setWhatsappEmpresa] = useState('');

  useEffect(() => {
    const fetchPedidoYDatos = async () => {
      try {
        const docRef = doc(db, 'pedidos', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPedido({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError(true);
        }

        // Buscar el WhatsApp de la empresa
        const storefrontSnap = await getDoc(doc(db, 'ajustes_storefront', 'home'));
        if (storefrontSnap.exists() && storefrontSnap.data().datosEmpresa?.whatsapp) {
          setWhatsappEmpresa(storefrontSnap.data().datosEmpresa.whatsapp);
        }

      } catch (err) {
        console.error("Error buscando pedido:", err);
        setError(true);
      } finally {
        setCargando(false);
      }
    };

    fetchPedidoYDatos();
    window.scrollTo(0, 0);
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center font-poppins text-[10px] font-black uppercase tracking-[0.4em] text-dark-blue">
        Buscando tu pedido...
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-playfair italic text-3xl md:text-4xl text-dark-blue mb-4">Pedido no encontrado</h2>
        <p className="font-poppins text-sm text-dark-blue/70 mb-8 max-w-md">
          No pudimos encontrar el pedido que buscas. Verifica que el link sea correcto o contáctanos para ayudarte.
        </p>
        <Link to="/shop" className="font-poppins text-[10px] font-black uppercase tracking-[0.2em] text-brand-white bg-dark-blue px-8 py-4 hover:bg-brand-orange transition-colors">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const estados = ['Pendiente', 'En Preparación', 'Enviado', 'Entregado'];
  const estadoActualIndex = estados.indexOf(pedido.estado || 'Pendiente');

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col">
      <MainNavbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-32 pb-24 lg:pt-40 flex flex-col">
        
        <div className="text-center mb-12">
          <span className="text-[10px] font-poppins font-black uppercase tracking-[0.3em] text-brand-orange block mb-2">
            Seguimiento
          </span>
          <h1 className="font-playfair italic text-4xl md:text-5xl text-dark-blue mb-4">
            Estado de tu orden
          </h1>
          <p className="font-poppins text-xs font-black uppercase tracking-widest text-light-blue">
            ID: {pedido.id.slice(0, 5).toUpperCase()}
          </p>
        </div>

        {/* LÍNEA DE TIEMPO (PROGRESS BAR) */}
        <div className="bg-white border border-dark-blue/10 p-8 md:p-12 mb-8 shadow-sm">
          <div className="relative flex justify-between items-center max-w-2xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-[#F0EBE1] -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-brand-orange -translate-y-1/2 z-0 transition-all duration-1000 ease-out"
              style={{ width: `${(estadoActualIndex / (estados.length - 1)) * 100}%` }}
            ></div>

            {estados.map((estado, index) => {
              const completado = index <= estadoActualIndex;
              const actual = index === estadoActualIndex;
              return (
                <div key={estado} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${completado ? 'bg-brand-orange text-white' : 'bg-white border-2 border-[#F0EBE1] text-[#F0EBE1]'}`}>
                    {completado ? <CheckIcon className="w-4 h-4 md:w-5 md:h-5" /> : <div className="w-2 h-2 rounded-full bg-[#F0EBE1]"></div>}
                  </div>
                  <span className={`absolute top-12 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center w-20 md:w-24 ${actual ? 'text-brand-orange' : completado ? 'text-dark-blue' : 'text-light-blue/50'}`}>
                    {estado}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* CAJA DE MENSAJE DINÁMICO */}
          <div className="mt-20 text-center bg-brand-orange/5 border border-brand-orange/20 p-6 md:p-8 flex flex-col items-center">
            <PackageIcon className="w-8 h-8 text-brand-orange mb-3" />
            <p className="font-poppins text-sm md:text-base text-dark-blue/80 mb-4">
              {estadoActualIndex === 0 && "Hemos recibido tu pedido y está en cola de procesamiento."}
              {estadoActualIndex === 1 && "¡El sommelier está preparando tu selección con cuidado en nuestra cava!"}
              {estadoActualIndex === 2 && (
                <>
                  Tu pedido ya está en camino. <br/>
                  {pedido.fechaEnvio && pedido.rangoHora ? (
                    <span className="block mt-2 font-black text-brand-orange">
                      Se entregará el {pedido.fechaEnvio} entre las {pedido.rangoHora}.
                    </span>
                  ) : (
                    "Nos contactaremos a la brevedad para coordinar la entrega."
                  )}
                </>
              )}
              {estadoActualIndex === 3 && "¡Tu pedido ha sido entregado! Que disfrutes tu selección."}
            </p>

            {/* BOTÓN WHATSAPP DINÁMICO */}
            {(estadoActualIndex === 1 || estadoActualIndex === 2) && whatsappEmpresa && (
              <a 
                href={`https://wa.me/${whatsappEmpresa}?text=Hola,%20quisiera%20consultar/modificar%20la%20entrega%20de%20mi%20Orden%20%23${pedido.id.slice(0, 5).toUpperCase()}`} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-green-500/20"
              >
                <WhatsappIcon className="w-4 h-4" />
                Modificar día/horario
              </a>
            )}
          </div>
        </div>

        {/* RESUMEN DEL PEDIDO */}
        <div className="bg-white border border-dark-blue/10 p-8 md:p-12 shadow-sm">
          <h3 className="font-poppins font-semibold text-xl text-dark-blue mb-8 border-b border-dark-blue/10 pb-4">
            Resumen de tu compra
          </h3>
          
          <div className="flex flex-col gap-6 mb-8">
            {pedido.cart ? pedido.cart.map((item, index) => (
              <div key={index} className="flex items-center gap-4 border-b border-dark-blue/5 pb-6">
                <div className="w-16 h-20 bg-[#F0EBE1] flex items-center justify-center p-1 shrink-0">
                  <img src={item.imageUrl} alt={item.nombre} className="h-full w-auto object-contain mix-blend-multiply" />
                </div>
                <div className="flex-1">
                  <h4 className="font-playfair font-bold text-lg text-dark-blue leading-tight">{item.nombre}</h4>
                  <p className="font-poppins text-[9px] uppercase tracking-widest text-light-blue mt-1">Cantidad: {item.cantidad}</p>
                </div>
                <div className="font-poppins text-sm font-semibold text-dark-blue">${(item.precioFinal * item.cantidad).toLocaleString()}</div>
              </div>
            )) : (
              <div className="font-poppins text-sm text-dark-blue pb-6 border-b border-dark-blue/5 font-bold">Membresía: {pedido.plan}</div>
            )}
          </div>

          <div className="flex flex-col gap-3 bg-[#F0EBE1] p-6 text-sm">
            <div className="flex justify-between text-dark-blue/70">
              <span>Subtotal</span>
              <span className="font-semibold text-dark-blue">${(pedido.subtotal || pedido.totalFinal)?.toLocaleString()}</span>
            </div>
            
            {pedido.descuentoVIP?.aplicado && (
              <div className="flex justify-between text-brand-orange">
                <span>Socio {pedido.descuentoVIP.badge}</span>
                <span className="font-semibold">- ${pedido.descuentoVIP.monto?.toLocaleString()}</span>
              </div>
            )}
            {pedido.descuentoTransferencia > 0 && (
              <div className="flex justify-between text-brand-orange">
                <span>Descuento (Transferencia)</span>
                <span className="font-semibold">- ${pedido.descuentoTransferencia?.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-end mt-2 pt-4 border-t border-dark-blue/10">
              <span className="font-playfair italic text-xl text-dark-blue">Total</span>
              <span className="font-poppins text-2xl font-black text-dark-blue">${pedido.totalFinal?.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-dark-blue/80">
            <div>
              <span className="font-black uppercase tracking-widest text-[9px] text-light-blue block mb-1">Entregar a:</span>
              <p>{pedido.formData?.nombre} {pedido.formData?.apellido}</p>
              <p>{pedido.formData?.direccion}</p>
              <p>{pedido.formData?.ciudad} - CP: {pedido.formData?.cp}</p>
            </div>
            <div>
              <span className="font-black uppercase tracking-widest text-[9px] text-light-blue block mb-1">Contacto:</span>
              <p>{pedido.formData?.email}</p>
              <p>WhatsApp: {pedido.formData?.telefono}</p>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}