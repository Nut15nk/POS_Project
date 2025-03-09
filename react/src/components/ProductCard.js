import React from 'react';

function ProductCard({ product }) {
  const imageUrl = product.product_image_urls && product.product_image_urls.length > 0 
    ? product.product_image_urls[0] 
    : './default-product.png';
  
  console.log('Rendering ProductCard', { productName: product.name, imageUrl });

  return (
    <div className="product-card">
      <img src={imageUrl} alt={product.name} onError={(e) => {
        console.error('Image failed to load', { url: imageUrl });
        e.target.src = './default-product.png'; // Fallback ถ้าภาพไม่โหลด
      }} />
      <h3>{product.name}</h3>
      <p>ราคา: {product.price} บาท</p>
      <p>{product.description}</p>
    </div>
  );
}

export default ProductCard;