import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card" style={{ overflow: 'hidden', maxHeight: '100%' }}>
      {product.product_image_urls && product.product_image_urls.length > 0 ? (
        <img src={product.product_image_urls[0]} alt={product.name} style={{ maxHeight: '150px', objectFit: 'cover' }} />
      ) : (
        <img src="https://via.placeholder.com/150" alt="No Image" style={{ maxHeight: '150px', objectFit: 'cover' }} />
      )}
      <h3>{product.name}</h3>
      <p className="category">หมวดหมู่: {product.category ? product.category.name : 'ไม่ระบุ'}</p>
      <p className={`stock ${product.stock < 5 ? 'low' : 'normal'}`}>
        สต็อก: {product.stock || 0}
      </p>
      <p>ราคา: {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(product.price || 0)}</p>
      <p>{product.description || 'ไม่มีคำอธิบาย'}</p>
    </div>
  );
};

export default ProductCard;