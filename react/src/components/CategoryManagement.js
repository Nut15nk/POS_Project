import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';
import { getProducts } from '../api';

function CategoryManagement({ user }) {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.categories || []);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่: ' + err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('กรุณากรอกชื่อหมวดหมู่');
      return;
    }
    try {
      await createCategory({ name: newCategoryName });
      setNewCategoryName('');
      setError('');
      fetchCategories();
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้างหมวดหมู่: ' + err.message);
    }
  };

  const handleUpdateCategory = async (categoryId) => {
    if (!editedCategoryName.trim()) {
      setError('กรุณากรอกชื่อหมวดหมู่');
      return;
    }
    try {
      await updateCategory(categoryId, { name: editedCategoryName });
      setEditingCategoryId(null);
      setEditedCategoryName('');
      fetchCategories();
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่: ' + err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? สินค้าที่เกี่ยวข้องจะถูกตั้งค่าให้ไม่มีหมวดหมู่')) {
      try {
        await deleteCategory(categoryId);
        if (selectedCategory === categoryId) {
          setSelectedCategory(null);
          setProducts([]);
        }
        fetchCategories();
        setError('');
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่';
        setError(errorMessage);
      }
    }
  };

  const fetchProductsByCategory = async (categoryId) => {
    try {
      const response = await getProducts({ params: { category: categoryId } });
      const filteredProducts = response.products || [];
      setProducts(filteredProducts);
      setSelectedCategory(categoryId);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการดึงสินค้า: ' + err.message);
    }
  };

  return (
    <div className="category-management">
      <h1>จัดการหมวดหมู่</h1>

      <div className="add-category-section">
        <h2>เพิ่มหมวดหมู่ใหม่</h2>
        <form onSubmit={handleCreateCategory}>
          <div className="form-group">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="ชื่อหมวดหมู่"
            />
            <button type="submit">เพิ่ม</button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="category-list">
        <h2>รายการหมวดหมู่</h2>
        <table>
          <thead>
            <tr>
              <th>ชื่อหมวดหมู่</th>
              <th>สร้างโดย</th>
              <th>วันที่สร้าง</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    {editingCategoryId === category.id ? (
                      <input
                        type="text"
                        value={editedCategoryName}
                        onChange={(e) => setEditedCategoryName(e.target.value)}
                        onBlur={() => handleUpdateCategory(category.id)}
                        autoFocus
                      />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td>
                    {category.createdBy
                      ? `${category.createdBy.fname} ${category.createdBy.lname}`
                      : 'ไม่ระบุ'}
                  </td>
                  <td>{new Date(category.createdAt).toLocaleDateString('th-TH')}</td>
                  <td>
                    <button onClick={() => fetchProductsByCategory(category.id)}>ดูสินค้า</button>
                    {editingCategoryId !== category.id ? (
                      <button onClick={() => {
                        setEditingCategoryId(category.id);
                        setEditedCategoryName(category.name);
                      }}>แก้ไข</button>
                    ) : null}
                    <button onClick={() => handleDeleteCategory(category.id)}>ลบ</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">ไม่มีหมวดหมู่</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedCategory && (
        <div className="category-products">
          <h2>สินค้าในหมวดหมู่: {categories.find(cat => cat.id === selectedCategory)?.name}</h2>
          {products.length > 0 ? (
            <div className="product-list">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <img
                    src={product.product_image_urls?.[0] || 'https://via.placeholder.com/150'}
                    alt={product.name}
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                  <h3>{product.name}</h3>
                  <p>ราคา: {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(product.price || 0)}</p>
                  <p>สต็อก: {product.stock || 0}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>ไม่มีสินค้าในหมวดหมู่นี้</p>
          )}
          <button onClick={() => setSelectedCategory(null)}>ปิด</button>
        </div>
      )}
    </div>
  );
}

export default CategoryManagement;