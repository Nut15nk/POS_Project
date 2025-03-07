// frontend/src/components/ProductCard.js
import React from 'react';

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img src={product.product_image_url} alt={product.name} />
      <h3>{product.name}</h3>
      <p>ราคา: {product.price} บาท</p>
      <p>{product.description}</p>
    </div>
  );
}

export default ProductCard;