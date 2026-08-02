import { memo } from 'react';
import { ProductCard as ProductCardUI } from '@decant/ui';
import { useCart } from '../../context/CartContext';
import { useSocio } from '../../context/SocioContext';

const ProductCard = memo(function ProductCard({ producto }) {
  const { addToCart } = useCart();
  const { socio } = useSocio();
  return <ProductCardUI producto={producto} socio={socio} onAddToCart={addToCart} />;
});

export default ProductCard;
