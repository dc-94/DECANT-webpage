import { createContext, useContext, useState, useEffect, useMemo } from 'react';

// 1. Creamos el contexto
const CartContext = createContext();

// 2. Hook personalizado para usar el carrito fácilmente
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

// 3. El Provider que envolverá nuestra aplicación
export const CartProvider = ({ children }) => {
  // === NUEVO ESTADO GLOBAL PARA EL DRAWER Y EL TOAST ===
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  // 👉 UX #2: Estado para el mensaje del Toast flotante
  const [toastMessage, setToastMessage] = useState('');

  // Inicializamos el estado leyendo el localStorage por si hay un carrito guardado
  const [cart, setCart] = useState(() => {
    try {
      const item = localStorage.getItem('decant_cart');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error('Error leyendo el carrito del localStorage:', error);
      return [];
    }
  });

  // Cada vez que el carrito cambie, lo guardamos en localStorage
  useEffect(() => {
    localStorage.setItem('decant_cart', JSON.stringify(cart));
  }, [cart]);

  // ==========================================
  // FUNCIONES DEL CARRITO
  // ==========================================

  // Agregar un producto (o sumar cantidad si ya existe)
  const addToCart = (producto, cantidad = 1) => {
    setCart((prevCart) => {
      const itemIndex = prevCart.findIndex((item) => item.id === producto.id);
      
      // Si el producto ya está en la bolsa, actualizamos su cantidad
      if (itemIndex >= 0) {
        const nuevoCarrito = [...prevCart];
        const itemActual = nuevoCarrito[itemIndex];
        
        // Verificamos no pasarnos del stock (si no es a pedido)
        const maximoPermitido = producto.aPedido ? Infinity : producto.stock;
        const nuevaCantidad = Math.min(itemActual.cantidad + cantidad, maximoPermitido);
        
        nuevoCarrito[itemIndex] = { ...itemActual, cantidad: nuevaCantidad };
        return nuevoCarrito;
      } 
      
      // Si no está, lo agregamos como nuevo
      return [...prevCart, { ...producto, cantidad }];
    });

    // 👉 UX #2: Activamos el mini-toast con la notificación genérica
    setToastMessage(`${cantidad} · ${producto.nombre} agregado al carrito`);
    setJustAdded(true);
    
    // Lo ocultamos automáticamente después de 2 segundos (2000ms)
    setTimeout(() => {
      setJustAdded(false);
      setToastMessage('');
    }, 2000); 
  };

  // Cambiar la cantidad de un producto específico (desde la vista del carrito)
  const updateQuantity = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) return; // No puede haber 0, para eso se elimina
    
    setCart((prevCart) => 
      prevCart.map((item) => {
        if (item.id === id) {
          const maximoPermitido = item.aPedido ? Infinity : item.stock;
          return { ...item, cantidad: Math.min(nuevaCantidad, maximoPermitido) };
        }
        return item;
      })
    );
  };

  // Eliminar un producto por completo
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Vaciar toda la bolsa (útil para cuando se confirma la compra)
  const clearCart = () => {
    setCart([]);
  };

  // ==========================================
  // CÁLCULOS DERIVADOS (Automáticos)
  // ==========================================

  // Cantidad total de botellas en la bolsa
  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.cantidad, 0);
  }, [cart]);

  // Monto total a pagar (usando precioFinal que ya tiene descuentos)
  const totalPrecio = useMemo(() => {
    return cart.reduce((total, item) => total + ((item.precioFinal || 0) * item.cantidad), 0);
  }, [cart]);

  // Valores que exportamos para usar en cualquier componente
  const value = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrecio,
    isCartOpen,
    setIsCartOpen,
    justAdded 
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      
      {/* 👉 UX #2: Componente Toast Global (Mini notificación flotante inferior) */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-dark-blue px-6 py-4 rounded-sm shadow-2xl transition-all duration-300 pointer-events-none flex items-center gap-3 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-4 h-4 rounded-full bg-brand-orange flex items-center justify-center shrink-0">
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-white">
          {toastMessage}
        </span>
      </div>
    </CartContext.Provider>
  );
};