import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import MainNavbar from '../components/layout/MainNavbar';
import Footer from '../components/layout/Footer';

// Íconos
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
);
const PackageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
);

export default function TrackingPedido() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const docRef = doc(db, 'pedidos', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPedido({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error buscando pedido:", err);
        setError(true);
      } finally {
        setCargando(false);
      }
    };

    fetchPedido();
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

  // Lógica de estados para la línea de tiempo
  const estados = ['Pendiente', 'En Preparación', 'Enviado'];
  const estadoActualIndex = estados.indexOf(pedido.estado || 'Pendiente');

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col">
      <MainNavbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-32 pb-24 lg:pt-40 flex flex-col">
        
        {/* ENCABEZADO */}
        <div className="text-center mb-12">
          <span className="text-[10px] font-poppins font-black uppercase tracking-[0.3em] text-brand-orange block mb-2">
            Seguimiento
          </span>
          <h1 className="font-playfair italic text-4xl md:text-5xl text-dark-blue mb-4">
            Estado de tu orden
          </h1>
          <p className="font-poppins text-xs font-black uppercase tracking-widest text-light-blue">
            ID: {pedido.id.slice(0, 8).toUpperCase()}...
          </p>
        </div>

        {/* LÍNEA DE TIEMPO (PROGRESS BAR) */}
        <div className="bg-white border border-dark-blue/10 p-8 md:p-12 mb-8 shadow-sm">
          <div className="relative flex justify-between items-center max-w-2xl mx-auto">
            {/* Línea de fondo */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-[#F0EBE1] -translate-y-1/2 z-0"></div>
            {/* Línea de progreso naranja */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-brand-orange -translate-y-1/2 z-0 transition-all duration-1000 ease-out"
              style={{ width: `${(estadoActualIndex / (estados.length - 1)) * 100}%` }}
            ></div>

            {/* Puntos (Nodos) */}
            {estados.map((estado, index) => {
              const completado = index <= estadoActualIndex;
              const actual = index === estadoActualIndex;
              return (
                <div key={estado} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${completado ? 'bg-brand-orange text-white' : 'bg-white border-2 border-[#F0EBE1] text-[#F0EBE1]'}`}>
                    {completado ? <CheckIcon className="w-4 h-4 md:w-5 md:h-5" /> : <div className="w-2 h-2 rounded-full bg-[#F0EBE1]"></div>}
                  </div>
                  <span className={`absolute top-12 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center w-24 ${actual ? 'text-brand-orange' : completado ? 'text-dark-blue' : 'text-light-blue/50'}`}>
                    {estado}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-20 text-center bg-brand-orange/5 border border-brand-orange/20 p-6">
            <PackageIcon className="w-8 h-8 text-brand-orange mx-auto mb-3" />
            <p className="font-poppins text-sm text-dark-blue/80">
              {estadoActualIndex === 0 && "Hemos recibido tu pedido y estamos confirmando el pago."}
              {estadoActualIndex === 1 && "¡Tu pedido está siendo preparado con cuidado en nuestra cava!"}
              {estadoActualIndex === 2 && "¡Tu pedido está en camino! Nos contactaremos pronto."}
            </p>
          </div>
        </div>

        {/* RESUMEN DEL PEDIDO */}
        <div className="bg-white border border-dark-blue/10 p-8 md:p-12 shadow-sm">
          <h3 className="font-poppins font-semibold text-xl text-dark-blue mb-8 border-b border-dark-blue/10 pb-4">
            Resumen de tu compra
          </h3>
          
          <div className="flex flex-col gap-6 mb-8">
            {pedido.cart?.map((item, index) => (
              <div key={index} className="flex items-center gap-4 border-b border-dark-blue/5 pb-6">
                <div className="w-16 h-20 bg-[#F0EBE1] flex items-center justify-center p-1 shrink-0">
                  <img src={item.imageUrl} alt={item.nombre} className="h-full w-auto object-contain mix-blend-multiply" />
                </div>
                <div className="flex-1">
                  <h4 className="font-playfair font-bold text-lg text-dark-blue leading-tight">{item.nombre}</h4>
                  <p className="font-poppins text-[9px] uppercase tracking-widest text-light-blue mt-1">
                    Cantidad: {item.cantidad}
                  </p>
                </div>
                <div className="font-poppins text-sm font-semibold text-dark-blue">
                  ${(item.precioFinal * item.cantidad).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 bg-[#F0EBE1] p-6 text-sm">
            <div className="flex justify-between text-dark-blue/70">
              <span>Subtotal</span>
              <span className="font-semibold text-dark-blue">${pedido.subtotal?.toLocaleString()}</span>
            </div>
            
            {/* Mostrar descuentos si existieron en esta compra */}
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

            <div className="flex justify-between text-dark-blue/70 pb-4 border-b border-dark-blue/10">
              <span>Envío</span>
              <span className="font-bold uppercase text-[10px] tracking-wider">{pedido.textoEnvio || pedido.costoEnvioStr}</span>
            </div>
            <div className="flex justify-between items-end mt-2">
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