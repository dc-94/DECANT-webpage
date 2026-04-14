const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.enviarConfirmacionPedido = onRequest({ secrets: ["BREVO_API_KEY"] }, async (req, res) => {
 
  const ALLOWED_ORIGINS = [
    'http://localhost:5173',      
    'https://decant.online'           
  ];

  // 👇 =======================================================
  // 👇 INICIO DEL CÓDIGO INYECTADO (SEGURIDAD CORS)
  // ==========================================================
  const origin = req.headers.origin;
  
  // 1. Verificamos si el que llama a la función está en la lista VIP
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }

  // 2. Manejo de la petición "Pre-flight" (Requisito estricto de los navegadores)
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }
  // 👆 =======================================================
  // 👆 FIN DEL CÓDIGO INYECTADO
  // ==========================================================

  try {
    const { toEmail, toName, templateId, params } = req.body;

    // 2. Conexión DIRECTA a la API de Brevo (Inmune a errores de librerías)
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        to: [{ email: toEmail, name: toName }],
        templateId: templateId,
        params: params
      })
    });

    const data = await response.json();

    // 3. Si Brevo rechaza el mail (por ej: template no existe), forzamos el error
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    logger.info("Mail enviado exitosamente:", data);
    return res.status(200).send({ success: true, message: "Email enviado correctamente." });

  } catch (error) {
    logger.error("Error conectando con Brevo:", error.message);
    return res.status(500).send({ success: false, error: error.message });
  }
});