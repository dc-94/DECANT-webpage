// Sube una imagen a Cloudinary con el preset configurado.
// Cubre los dos usos: catálogo (folder por categoría + public_id) y storefront (folder directo).
//
// opciones:
//   folder     — ruta destino. Si no se pasa, usa 'decant/catalog/general'.
//   publicId   — nombre del archivo (opcional). Se le agrega timestamp.
//   throwOnError — si true, lanza el error de Cloudinary (para forms que lo muestran).
//                  si false (default), devuelve "" al fallar (para guardados no bloqueantes).
export const uploadImage = async (file, { folder, publicId, throwOnError = false } = {}) => {
  if (!file) return "";

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "upld_decant");
  data.append("folder", folder || "decant/catalog/general");

  if (publicId) {
    const limpio = publicId.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    data.append("public_id", limpio);
  }

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/ds7shexal/image/upload", { method: "POST", body: data });
    const fileRes = await res.json();
    if (fileRes.error) {
      if (throwOnError) throw new Error(`Cloudinary: ${fileRes.error.message}`);
      return "";
    }
    return fileRes.secure_url || "";
  } catch (err) {
    if (throwOnError) throw err;
    return "";
  }
};

// Helper para armar el folder del catálogo desde categoría/subcategoría
export const folderCatalogo = (categoria, subcategoria) => {
  if (!categoria) return "decant/catalog/general";
  const cat = categoria.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (subcategoria) {
    const sub = subcategoria.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `decant/catalog/${cat}/${sub}`;
  }
  return `decant/catalog/${cat}`;
};