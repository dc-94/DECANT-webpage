// src/services/brevoService.js

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const API_KEY = import.meta.env.VITE_BREVO_API_KEY;

export const enviarMailBrevo = async ({ toEmail, toName, templateId, params }) => {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        to: [{ email: toEmail, name: toName }],
        templateId: templateId, // El ID de la plantilla que crearemos en Brevo
        params: params // Las variables dinámicas (Ej: Nombre, N° de Orden, Link)
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Brevo: ${errorData.message}`);
    }

    console.log(`Mail enviado con éxito a ${toEmail} (Template: ${templateId})`);
    return true;
  } catch (error) {
    console.error('Error enviando mail:', error);
    return false;
  }
};