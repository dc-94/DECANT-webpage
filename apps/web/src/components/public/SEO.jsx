import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  name = "Decant", 
  type = "website", 
  image = "/assets/brand/logo-white-T.png", // Tu logo por defecto
  url = typeof window !== 'undefined' ? window.location.href : '' 
}) {
  return (
    <Helmet>
      {/* Etiquetas Estándar */}
      <title>{title ? `${title} | ${name}` : name}</title>
      <meta name="description" content={description} />

      {/* Etiquetas Open Graph (Facebook, WhatsApp, LinkedIn) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title ? `${title} | ${name}` : name} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Etiquetas Twitter (X) */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title ? `${title} | ${name}` : name} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}