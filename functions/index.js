const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// 👉 Agregamos la importación de Mercado Pago
const { MercadoPagoConfig, PreApproval } = require('mercadopago');

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

// 1. Función Original (Solo Enviar Mail) - La dejamos intacta por si la usás en otro lado
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

// 2. NUEVA FUNCIÓN: PROCESAR CHECKOUT TIENDA (BLINDAJE TOTAL)
exports.procesarCheckoutTienda = onRequest({ secrets: ["BREVO_API_KEY"] }, async (req, res) => {
  if (handleCORS(req, res)) return;

  try {
    const { formData, cart, pago, envio, inputSocio } = req.body;
    const db = admin.firestore();
    const batch = db.batch();

    const emailLower = formData.email.toLowerCase().trim();
    const clientRef = db.collection('clientes').doc(emailLower);
    const clientSnap = await clientRef.get();
    
    let numeroCliente = '';
    let datosSocio = null;

    // A. VALIDACIÓN DE SOCIO
    if (clientSnap.exists) {
      const cData = clientSnap.data();
      numeroCliente = cData.numeroCliente;
      if (inputSocio && cData.numeroCliente === inputSocio) {
        if (cData.badge === 'Descorche') datosSocio = { porcentaje: 0.15, badge: 'Descorche' };
        else if (cData.badge === 'Terruño') datosSocio = { porcentaje: 0.20, badge: 'Terruño' };
      }
    } else {
      numeroCliente = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // B. RECONSTRUCCIÓN DEL CARRITO (Verificación de Precios y Stock)
    let subtotalReal = 0;
    const cartReal = [];

    for (const item of cart) {
      const pSnap = await db.collection('productos').doc(item.id).get();
      if (pSnap.exists) {
        const pData = pSnap.data();
        const precioReal = Number(pData.precioFinal); // PISAMOS CUALQUIER VALOR HACKEADO
        const cantidad = Number(item.cantidad);
        
        subtotalReal += (precioReal * cantidad);
        cartReal.push({
          id: item.id, nombre: pData.nombre, cantidad, precioFinal: precioReal, imageUrl: pData.imageUrl || ''
        });

        // Restamos stock de forma atómica
        batch.update(pSnap.ref, { stock: admin.firestore.FieldValue.increment(-cantidad) });
      }
    }

    // C. MATEMÁTICA SEGURA EN EL SERVIDOR
    const montoDescuentoVIP = datosSocio ? subtotalReal * datosSocio.porcentaje : 0;
    const subtotalPostVIP = subtotalReal - montoDescuentoVIP;
    const descuentoMontoTransferencia = pago === 'transferencia' ? subtotalPostVIP * 0.05 : 0;
    const totalFinalReal = subtotalPostVIP - descuentoMontoTransferencia;
    const textoEnvio = envio === 'retiro' ? 'Gratis' : 'A convenir';

    // D. ACTUALIZAR / CREAR CLIENTE
    if (clientSnap.exists) {
      batch.set(clientRef, {
        nombre: formData.nombre, apellido: formData.apellido, telefono: formData.telefono,
        direccionDefault: envio === 'convenir' ? formData.direccion : clientSnap.data().direccionDefault || '',
        ciudad: envio === 'convenir' ? formData.ciudad : clientSnap.data().ciudad || '',
        cp: envio === 'convenir' ? formData.cp : clientSnap.data().cp || '',
        totalCompras: admin.firestore.FieldValue.increment(1)
      }, { merge: true });
    } else {
      batch.set(clientRef, {
        numeroCliente, nombre: formData.nombre, apellido: formData.apellido, email: emailLower, telefono: formData.telefono,
        direccionDefault: envio === 'convenir' ? formData.direccion : '',
        ciudad: envio === 'convenir' ? formData.ciudad : '',
        cp: envio === 'convenir' ? formData.cp : '',
        totalCompras: 1, badge: null, createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // E. CREAR ORDEN
    const newOrderRef = db.collection('pedidos').doc();
    const pedidoIdReal = newOrderRef.id;
    const numeroOrdenCorto = pedidoIdReal.slice(0, 5).toUpperCase();

    batch.set(newOrderRef, {
      clienteEmail: emailLower, numeroCliente, tipo: 'tienda', cart: cartReal, subtotal: subtotalReal,
      descuentoVIP: { aplicado: !!datosSocio, badge: datosSocio ? datosSocio.badge : null, monto: montoDescuentoVIP },
      descuentoTransferencia: descuentoMontoTransferencia, totalFinal: totalFinalReal, envio, textoEnvio,
      formData, estado: 'Pendiente', createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // EJECUTAMOS TODA LA ESCRITURA EN FIRESTORE A LA VEZ
    await batch.commit();

 // F. ENVIAR EMAIL DE BREVO
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
          templateId: 8, // 👉 Aquí actualizamos al nuevo ID de tu plantilla
          params: { 
            nombre: formData.nombre || 'Cliente', 
            orden: numeroOrdenCorto, 
            link_tracking: `${ALLOWED_ORIGINS[1]}/pedido/${pedidoIdReal}` 
          }
        })
      });

      // Validamos si Brevo aceptó la petición correctamente
      if (!responseBrevo.ok) {
        const errorText = await responseBrevo.text();
        logger.error("Error devuelto por Brevo al procesar Checkout:", errorText);
      } else {
        logger.info(`Email de confirmación enviado con éxito al pedido ${numeroOrdenCorto}`);
      }
      
    } catch (e) { 
      logger.error("Error de conexión al enviar email Brevo:", e.message); 
    }

    // Devolvemos los datos reales al cliente para que muestre el resumen
    return res.status(200).send({
      success: true,
      pedidoId: pedidoIdReal,
      ordenDisplay: numeroOrdenCorto,
      totalFinalReal: totalFinalReal // El cliente recibe la corrección
    });

  } catch (error) {
    logger.error("Error Crítico Checkout:", error.message);
    return res.status(500).send({ success: false, error: error.message });
  }
});
