const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.enviarConfirmacionPedido = onRequest({ secrets: ["BREVO_API_KEY"] }, async (req, res) => {
  // 1. CORS: Permite la conexión desde tu web sin bloqueos
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

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