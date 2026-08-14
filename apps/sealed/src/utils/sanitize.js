// Filtra un objeto para que solo pasen los campos permitidos (allowlist).
// Evita que un updateDoc escriba campos sensibles por error (badge, numeroCliente, etc.).
export const sanearParaUpdate = (data, camposPermitidos) => {
  const limpio = {};
  for (const campo of camposPermitidos) {
    // Solo incluimos el campo si está presente en data (no pisamos con undefined)
    if (data[campo] !== undefined) {
      limpio[campo] = data[campo];
    }
  }
  return limpio;
};

// Campos que el admin PUEDE editar de un cliente desde el CRM.
// NO incluye badge, numeroCliente, suscripcionActiva, suscripcionId, email:
// esos los maneja el sistema (webhook de suscripción), nunca el CRM manual.
export const CAMPOS_EDITABLES_CLIENTE = [
  'nombre',
  'apellido',
  'telefono',
  'direccion',
  'numero',
  'ciudad',
  'cp'
];