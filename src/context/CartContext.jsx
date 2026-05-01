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
  // === NUEVO ESTADO GLOBAL PARA EL DRAWER ===
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Estado para el feedback visual en el Navbar
  const [justAdded, setJustAdded] = useState(false);

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

    // Activar feedback visual temporal sin abrir el drawer
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500); 
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
    // === EXPORTAMOS EL ESTADO DEL DRAWER ===
    isCartOpen,
    setIsCartOpen,
    justAdded // Exportamos el nuevo estado para el feedback
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};