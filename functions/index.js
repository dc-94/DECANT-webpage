const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Inicializamos Admin SDK para interactuar con Firestore de forma segura
if (!admin.apps.length) {
  admin.initializeApp();
}

const ALLOWED_ORIGINS = [
  'http://localhost:5173',      
  'https://decant.online'           
];

const handleCORS = (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return true;
  }
  return false;
};

// 1. FUNCIÓN DE CORREOS (Utilizada por Suscripciones y Panel de Administración)
exports.enviarConfirmacionPedido = onRequest({ secrets: ["BREVO_API_KEY"] }, async (req, res) => {
  if (handleCORS(req, res)) return;
  try {
    const { toEmail, toName, templateId, params } = req.body;
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "accept": "application/json", "api-key": process.env.BREVO_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ to: [{ email: toEmail, name: toName }], templateId, params })
    });
    if (!response.ok) throw new Error(await response.text());
    return res.status(200).send({ success: true, message: "Email enviado." });
  } catch (error) {
    logger.error("Error conectando con Brevo:", error.message);
    return res.status(500).send({ success: false, error: error.message });
  }
});

// 2. FUNCIÓN DE CHECKOUT DE TIENDA (BLINDADA CON TRANSACCIONES DE INVENTARIO)
exports.procesarCheckoutTienda = onRequest({ secrets: ["BREVO_API_KEY"] }, async (req, res) => {
  if (handleCORS(req, res)) return;

  try {
    const { formData, cart, pago, envio, inputSocio } = req.body;
    const db = admin.firestore();

    const emailLower = formData.email.toLowerCase().trim();
    const clientRef = db.collection('clientes').doc(emailLower);
    const newOrderRef = db.collection('pedidos').doc(); 

    let totalFinalReal = 0;
    const pedidoIdReal = newOrderRef.id;
    const numeroOrdenCorto = pedidoIdReal.slice(0, 5).toUpperCase();

    await db.runTransaction(async (transaction) => {
      const clientSnap = await transaction.get(clientRef);
      const productosLeidos = [];

      for (const item of cart) {
        const pRef = db.collection('productos').doc(item.id);
        const pSnap = await transaction.get(pRef);
        
        if (!pSnap.exists) {
          // 👉 Devolvemos un error estructurado en formato JSON
          throw new Error(JSON.stringify({ type: 'NO_STOCK', id: item.id, nombre: item.nombre }));
        }

        const pData = pSnap.data();
        const cantidadSolicitada = Number(item.cantidad);

        // ⚠️ VALIDACIÓN DE STOCK ESTRICTA
        if (pData.stock < cantidadSolicitada) {
          // 👉 Devolvemos el error estructurado incluyendo el ID del producto
          throw new Error(JSON.stringify({ type: 'NO_STOCK', id: item.id, nombre: pData.nombre }));
        }

        productosLeidos.push({
          ref: pRef,
          data: pData,
          cantidadSolicitada: cantidadSolicitada
        });
      }
      // ==========================================
      // FASE 2: LÓGICA Y CÁLCULOS SEGUROS
      // ==========================================
      let numeroCliente = '';
      let datosSocio = null;

      // A. VALIDACIÓN DE SOCIO SEGURA EN EL SERVIDOR
      if (clientSnap.exists) {
        const cData = clientSnap.data();
        numeroCliente = cData.numeroCliente;
        // Comparamos el PIN que envía el cliente con el de la base de datos de forma segura
        if (inputSocio && cData.numeroCliente === inputSocio) {
          if (cData.badge === 'Descorche') datosSocio = { porcentaje: 0.15, badge: 'Descorche' };
          else if (cData.badge === 'Terruño') datosSocio = { porcentaje: 0.20, badge: 'Terruño' };
        }
      } else {
        numeroCliente = Math.floor(1000 + Math.random() * 9000).toString();
      }

      // B. RECONSTRUCCIÓN DEL CARRITO Y SUBTOTALES
      let subtotalReal = 0;
      const cartReal = [];

      for (const item of productosLeidos) {
        const precioReal = Number(item.data.precioFinal); // Imposible de hackear desde el navegador
        subtotalReal += (precioReal * item.cantidadSolicitada);
        
        cartReal.push({
          id: item.ref.id, 
          nombre: item.data.nombre, 
          cantidad: item.cantidadSolicitada, 
          precioFinal: precioReal, 
          imageUrl: item.data.imageUrl || ''
        });
      }

      const montoDescuentoVIP = datosSocio ? subtotalReal * datosSocio.porcentaje : 0;
      const subtotalPostVIP = subtotalReal - montoDescuentoVIP;
      const descuentoMontoTransferencia = pago === 'transferencia' ? subtotalPostVIP * 0.05 : 0;
      totalFinalReal = subtotalPostVIP - descuentoMontoTransferencia;
      const textoEnvio = envio === 'retiro' ? 'Gratis' : 'A convenir';

      // ==========================================
      // FASE 3: ESCRITURA (Guardamos todo de una sola vez)
      // ==========================================
      
      // Actualizamos el stock de los productos
      for (const item of productosLeidos) {
        const nuevoStock = item.data.stock - item.cantidadSolicitada;
        transaction.update(item.ref, { stock: nuevoStock });
      }

      // Actualizamos o creamos al cliente
      if (clientSnap.exists) {
        transaction.set(clientRef, {
          nombre: formData.nombre, apellido: formData.apellido, telefono: formData.telefono,
          direccionDefault: envio === 'convenir' ? formData.direccion : clientSnap.data().direccionDefault || '',
          ciudad: envio === 'convenir' ? formData.ciudad : clientSnap.data().ciudad || '',
          cp: envio === 'convenir' ? formData.cp : clientSnap.data().cp || '',
          totalCompras: admin.firestore.FieldValue.increment(1)
        }, { merge: true });
      } else {
        transaction.set(clientRef, {
          numeroCliente, nombre: formData.nombre, apellido: formData.apellido, email: emailLower, telefono: formData.telefono,
          direccionDefault: envio === 'convenir' ? formData.direccion : '',
          ciudad: envio === 'convenir' ? formData.ciudad : '',
          cp: envio === 'convenir' ? formData.cp : '',
          totalCompras: 1, badge: null, createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Creamos el pedido
      transaction.set(newOrderRef, {
        clienteEmail: emailLower, numeroCliente, tipo: 'tienda', cart: cartReal, subtotal: subtotalReal,
        descuentoVIP: { aplicado: !!datosSocio, badge: datosSocio ? datosSocio.badge : null, monto: montoDescuentoVIP },
        descuentoTransferencia: descuentoMontoTransferencia, totalFinal: totalFinalReal, envio, textoEnvio,
        formData, estado: 'Pendiente', createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    }); // <-- FIN DE LA TRANSACCIÓN

    // FASE 4: ENVIAR EMAIL DE CONFIRMACIÓN (Post-Transacción exitosa)
    try {
      const responseBrevo = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { 
          "accept": "application/json", 
          "api-key": process.env.BREVO_API_KEY, 
          "content-type": "application/json" 
        },
        body: JSON.stringify({
          to: [{ 
            email: emailLower, 
            name: `${formData.nombre} ${formData.apellido}`.trim() 
          }],
          templateId: 8, 
          params: { 
            nombre: formData.nombre || 'Cliente', 
            orden: numeroOrdenCorto, 
            link_tracking: `${ALLOWED_ORIGINS[1]}/pedido/${pedidoIdReal}` 
          }
        })
      });

      if (!responseBrevo.ok) {
        const errorText = await responseBrevo.text();
        logger.error("Error devuelto por Brevo al procesar Checkout:", errorText);
      } else {
        logger.info(`Email de confirmación enviado con éxito al pedido ${numeroOrdenCorto}`);
      }
    } catch (e) { 
      logger.error("Error de conexión al enviar email Brevo:", e.message); 
    }

    // Devolvemos los datos reales al cliente para que muestre la pantalla de "Gracias"
    return res.status(200).send({
      success: true,
      pedidoId: pedidoIdReal,
      ordenDisplay: numeroOrdenCorto,
      totalFinalReal: totalFinalReal 
    });

  } catch (error) {
    // 👉 MAGIA DEL BACKEND: Interceptamos nuestro error JSON y lo enviamos al Frontend de forma limpia
    try {
      const parsedError = JSON.parse(error.message);
      if (parsedError.type === 'NO_STOCK') {
        // Devolvemos un código 400 (Bad Request) con el ID del producto agotado
        return res.status(400).send({ 
          success: false, 
          error: `Lo sentimos, alguien acaba de llevarse la última unidad de ${parsedError.nombre}. Hemos actualizado tu carrito para que puedas continuar.`,
          itemAgotadoId: parsedError.id // ¡Esto lo usará React para borrarlo!
        });
      }
    } catch (parseError) {
      // Si no es un JSON, fue otro tipo de error, lo dejamos pasar normal.
    }
    // Si la transacción falla (ej. por falta de stock), llega hasta aquí sin guardar nada
    logger.error("Error Crítico Checkout:", error.message);
    return res.status(500).send({ success: false, error: error.message });
  }
});