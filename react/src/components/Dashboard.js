import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getProducts, 
  getSellerOrders, 
  getOrderReport, 
  deleteProduct, 
  deleteOrder, 
  updateProduct, 
  updateOrder,
  uploadProduct,
  setAuthToken,
  createReport,
  getCategories
} from '../api';
import ProductCard from './ProductCard';
import defaultAvatar from './default-avatar.png';

function Dashboard({ user, updateUser }) {
  const [myProducts, setMyProducts] = useState([]);
  const [othersProducts, setOthersProducts] = useState([]);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [newProduct, setNewProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletedImages, setDeletedImages] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setEditProduct(null);
    setNewProduct(null);
    setEditOrder(null);
    setIsReportModalOpen(false);
  };

  const fetchData = async (userRole) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setAuthToken(token);
  
    setLoading(true);
    setError('');
    try {
      const [productRes, orderRes, categoryRes] = await Promise.all([
        getProducts(),
        userRole === 'admin' ? getOrderReport() : getSellerOrders(),
        getCategories(),
      ]);
  
      const myId = user._id || user.id;
      if (!myId) throw new Error('ไม่พบ ID ผู้ใช้จากโปรไฟล์');
  
      const cleanProducts = Array.isArray(productRes.products)
        ? productRes.products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            description: p.description,
            stock: p.stock || 0,
            category: p.category || null,
            product_image_urls: p.product_image_urls || [p.product_image_url] || [],
            createdBy: {
              id: p.createdBy?.id || p.createdBy?._id,
              fname: p.createdBy?.fname || '',
              lname: p.createdBy?.lname || '',
              address: {
                province: p.createdBy?.address?.province || '',
                street: p.createdBy?.address?.street || '',
                city: p.createdBy?.address?.city || '',
                postalCode: p.createdBy?.address?.postalCode || '',
                country: p.createdBy?.address?.country || '',
              },
            },
          }))
        : [];
  
      const myProds = cleanProducts.filter(
        (p) => p.createdBy && p.createdBy.id && p.createdBy.id.toString() === myId.toString()
      ) || [];
      setMyProducts(myProds);
  
      const othersProds =
        userRole === 'admin'
          ? cleanProducts.filter(
              (p) => p.createdBy && p.createdBy.id && p.createdBy.id.toString() !== myId.toString()
            ) || []
          : [];
      setOthersProducts(othersProds);
  
      let processedOrders = orderRes;
      if (orderRes && typeof orderRes === 'object') {
        processedOrders = {
          ...orderRes,
          totalRevenue: orderRes.totalRevenue || 0,
          dailyRevenue: orderRes.dailyRevenue || 0,
          monthlyRevenue: orderRes.monthlyRevenue || 0,
          completedOrders: orderRes.completedOrders || 0,
          pendingOrders: orderRes.pendingOrders || 0,
          statusSummary: orderRes.statusSummary || {},
          orders: orderRes.orders || [],
        };
      } else {
        processedOrders = {
          totalRevenue: 0,
          dailyRevenue: 0,
          monthlyRevenue: 0,
          completedOrders: 0,
          pendingOrders: 0,
          statusSummary: {},
          orders: [],
        };
      }
  
      setOrders(processedOrders);
      setCategories(categoryRes.categories || []);
  
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.error('Fetch Error:', err);
      handleError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setAuthToken(null);
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.role || !['seller', 'admin'].includes(user.role)) {
      navigate('/login');
      return;
    }
    fetchData(user.role);
  }, [user?.role, navigate, user]);

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('ยืนยันการลบสินค้านี้?')) {
      try {
        await deleteProduct(productId);
        fetchData(user.role);
      } catch (err) {
        setError('ไม่สามารถลบสินค้าได้: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('ยืนยันการลบคำสั่งซื้อนี้?')) {
      try {
        await deleteOrder(orderId);
        fetchData(user.role);
      } catch (err) {
        setError('ไม่สามารถลบคำสั่งซื้อได้: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditProduct({ 
      ...product, 
      previewImages: product.product_image_urls || [product.product_image_url] || [],
      newImages: []
    });
    setDeletedImages([]);
  };

  const handleEditOrder = (order) => {
    setEditOrder({ ...order });
  };

  const handleAddProduct = () => {
    setNewProduct({ name: '', price: '', description: '', category: '', stock: 0, newImages: [], previewImages: [] });
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleSaveProduct = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // ตรวจสอบว่ามีรูปภาพหรือไม่ (ทั้งจากเดิมและใหม่)
      const hasOriginalImages = editProduct.product_image_urls && editProduct.product_image_urls.length > 0;
      const hasNewImages = editProduct.newImages && editProduct.newImages.length > 0;
      if (!hasOriginalImages && !hasNewImages) {
        alert('กรุณาอัปโหลดรูปภาพสินค้าอย่างน้อย 1 รูปก่อนบันทึก');
        setIsSaving(false);
        return;
      }
  
      const formData = new FormData();
      formData.append('name', editProduct.name);
      formData.append('price', editProduct.price);
      formData.append('description', editProduct.description);
      formData.append('category', editProduct.category ? editProduct.category.id : '');
      formData.append('stock', editProduct.stock);
      if (editProduct.newImages && editProduct.newImages.length > 0) {
        editProduct.newImages.forEach((image, index) => {
          console.log(`Appending file ${index}: ${image.name}`);
          formData.append('product_images', image);
        });
      }
      if (deletedImages.length > 0) {
        formData.append('deletedImages', JSON.stringify(deletedImages));
      }
  
      await updateProduct(editProduct.id, formData);
      setEditProduct(null);
      setDeletedImages([]);
      fetchData(user.role);
    } catch (err) {
      handleError('ไม่สามารถแก้ไขสินค้าได้: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewProduct = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // ตรวจสอบว่ามีรูปภาพหรือไม่
      const hasImages = newProduct.newImages && newProduct.newImages.length > 0;
      if (!hasImages) {
        alert('กรุณาอัปโหลดรูปภาพสินค้าอย่างน้อย 1 รูปก่อนบันทึก');
        setIsSaving(false);
        return;
      }
  
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      formData.append('description', newProduct.description);
      formData.append('category', newProduct.category ? newProduct.category.id : '');
      formData.append('stock', newProduct.stock);
      formData.append('province', user.address?.province || '');
  
      if (newProduct.newImages && newProduct.newImages.length > 0) {
        newProduct.newImages.forEach((image, index) => {
          console.log(`Appending file ${index}: ${image.name}`);
          formData.append('product_images', image);
        });
      }
  
      await uploadProduct(formData);
      setNewProduct(null);
      fetchData(user.role);
    } catch (err) {
      handleError('ไม่สามารถเพิ่มสินค้าได้: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrder = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateOrder(editOrder.id, { status: editOrder.status });
      setEditOrder(null);
      fetchData(user.role);
    } catch (err) {
      handleError('ไม่สามารถแก้ไขคำสั่งซื้อได้: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveImage = (index, context) => {
    if (context === 'editProduct') {
      const newPreviewImages = [...editProduct.previewImages];
      const newImages = [...editProduct.newImages];
      const removedImage = newPreviewImages[index];
      const originalImageCount = editProduct.previewImages.length - editProduct.newImages.length;

      newPreviewImages.splice(index, 1);
      if (index >= originalImageCount) {
        newImages.splice(index - originalImageCount, 1);
      } else {
        setDeletedImages((prev) => [...prev, removedImage]);
      }
      setEditProduct({ ...editProduct, previewImages: newPreviewImages, newImages });
    } else if (context === 'newProduct') {
      const newPreviewImages = [...newProduct.previewImages];
      const newImages = [...newProduct.newImages];
      newPreviewImages.splice(index, 1);
      newImages.splice(index, 1);
      setNewProduct({ ...newProduct, previewImages: newPreviewImages, newImages });
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount || 0);
  };

  const handleCloseGallery = (e) => {
    if (e.target.className.includes('image-gallery-modal')) {
      setSelectedProduct(null);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportMessage.trim()) {
      setError('กรุณากรอกข้อความรายงาน');
      return;
    }
    try {
      await createReport(reportMessage);
      setIsReportModalOpen(false);
      setReportMessage('');
      alert('ส่งรายงานปัญหาสำเร็จ');
    } catch (err) {
      handleError('ไม่สามารถส่งรายงานได้: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="dashboard" style={{ overflow: 'hidden' }}>
      {error && (
        <div className="error-modal" style={{ zIndex: 1000 }}>
          <div className="error-modal-content">
            <h3>เกิดข้อผิดพลาด</h3>
            <p>{error}</p>
            <button onClick={() => setError('')}>ตกลง</button>
          </div>
        </div>
      )}
      {loading && (
        <div className="loading-overlay">
          <div className="loading">กำลังโหลด...</div>
        </div>
      )}
      
      <h1>แดชบอร์ด{user?.role === 'admin' ? 'แอดมิน' : 'ผู้ขาย'}</h1>
      <div className="profile">
        <img 
          src={user?.profile_image_url || defaultAvatar} 
          alt="Profile" 
        />
        <p>
          ยินดีต้อนรับ, {user?.fname || 'ไม่ระบุชื่อ'} {user?.lname || ''}
        </p>
      </div>

      <section className="products">
        <div className="products-header">
          <h2>สินค้าของคุณ</h2>
          <span className="icon-add" onClick={handleAddProduct}>+</span>
        </div>
        <div className="product-list" style={{ overflow: 'hidden', maxHeight: 'none' }}>
          {myProducts.length > 0 ? (
            myProducts.map((product) => (
              <div key={product.id} className="product-item">
                <div onClick={() => handleProductClick(product)}>
                  <ProductCard product={product} />
                </div>
                <div className="product-actions">
                  <span className="icon-edit" onClick={() => handleEditProduct(product)} />
                  <span className="icon-delete" onClick={() => handleDeleteProduct(product.id)} />
                </div>
              </div>
            ))
          ) : (
            <p>ไม่มีสินค้า</p>
          )}
        </div>

        {editProduct && (
          <div className="modal">
            <div className="modal-content">
              <h3>แก้ไขสินค้า</h3>
              <input
                type="text"
                value={editProduct.name}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                placeholder="ชื่อสินค้า"
              />
              <input
                type="number"
                value={editProduct.price}
                onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                placeholder="ราคา"
              />
              <textarea
                value={editProduct.description}
                onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                placeholder="คำอธิบาย"
              />
              <select
                value={editProduct.category ? editProduct.category.id : ''}
                onChange={(e) => {
                  const selectedCategory = categories.find((cat) => cat.id === e.target.value);
                  setEditProduct({ ...editProduct, category: selectedCategory || null });
                }}
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={editProduct.stock || 0}
                onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                placeholder="จำนวนสต็อก"
                min="0"
              />
            <input 
              type="file" 
              accept="image/jpeg,image/jpg,image/png" // จำกัดนามสกุล
              multiple // เลือกหลายไฟล์ได้
              onChange={(e) => {
                const files = Array.from(e.target.files); // แปลง FileList เป็น Array
                if (!files || files.length === 0) return;

                // กรองเฉพาะไฟล์ที่เป็น jpg, png, jpeg
                const validFiles = files.filter(file => {
                  const filetypes = /jpeg|jpg|png/;
                  const isValid = filetypes.test(file.mimetype || file.type);
                  return isValid;
                });

                // ตรวจสอบว่ามีไฟล์ที่ไม่ถูกต้องหรือไม่
                if (validFiles.length !== files.length) {
                  const invalidFiles = files
                    .filter(file => !validFiles.includes(file))
                    .map(file => file.name);
                  alert(`บางไฟล์ไม่สามารถเลือกได้: ${invalidFiles.join(', ')}\nกรุณาเลือกเฉพาะไฟล์ .jpg, .png, หรือ .jpeg เท่านั้น`);
                }

                // ถ้าไม่มีไฟล์ที่ถูกต้อง ให้หยุด
                if (validFiles.length === 0) {
                  e.target.value = '';
                  return;
                }

                // สร้าง preview และเก็บไฟล์
                const newPreviewImages = validFiles.map(file => URL.createObjectURL(file));
                setEditProduct({
                  ...editProduct,
                  previewImages: [...editProduct.previewImages, ...newPreviewImages], // เพิ่ม previewImages
                  newImages: [...editProduct.newImages, ...validFiles] // เพิ่ม newImages
                });

                e.target.value = ''; // รีเซ็ต input
              }} 
            />
              {editProduct.previewImages && editProduct.previewImages.length > 0 && (
                <div className="image-preview-container">
                  {editProduct.previewImages.map((img, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={img} alt={`Preview ${index}`} className="image-preview" />
                      <span 
                        className="remove-image" 
                        onClick={() => handleRemoveImage(index, 'editProduct')}
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="modal-actions">
                <button onClick={() => setEditProduct(null)} disabled={isSaving}>
                  ยกเลิก
                </button>
                <button onClick={handleSaveProduct} disabled={isSaving}>
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        )}

        {newProduct && (
          <div className="modal">
            <div className="modal-content">
              <h3>เพิ่มสินค้าใหม่</h3>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="ชื่อสินค้า"
              />
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="ราคา"
              />
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="คำอธิบาย"
              />
              <select
                value={newProduct.category ? newProduct.category.id : ''}
                onChange={(e) => {
                  const selectedCategory = categories.find((cat) => cat.id === e.target.value);
                  setNewProduct({ ...newProduct, category: selectedCategory || null });
                }}
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={newProduct.stock || 0}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                placeholder="จำนวนสต็อก"
                min="0"
              />
                <input 
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png" // จำกัดเฉพาะ jpg, png, jpeg
                  multiple // เพิ่ม attribute เพื่อเลือกหลายไฟล์
                  onChange={(e) => {
                    const files = Array.from(e.target.files); // แปลง FileList เป็น Array
                    if (!files || files.length === 0) return;

                    // กรองเฉพาะไฟล์ที่เป็น jpg, png, jpeg
                    const validFiles = files.filter(file => {
                      const filetypes = /jpeg|jpg|png/;
                      const isValid = filetypes.test(file.mimetype || file.type);
                      return isValid;
                    });

                    // ตรวจสอบว่ามีไฟล์ที่ไม่ถูกต้องหรือไม่
                    if (validFiles.length !== files.length) {
                      const invalidFiles = files
                        .filter(file => !validFiles.includes(file))
                        .map(file => file.name);
                      alert(`บางไฟล์ไม่สามารถเลือกได้: ${invalidFiles.join(', ')}\nกรุณาเลือกเฉพาะไฟล์ .jpg, .png, หรือ .jpeg เท่านั้น`);
                    }

                    // ถ้าไม่มีไฟล์ที่ถูกต้อง ให้หยุด
                    if (validFiles.length === 0) {
                      e.target.value = '';
                      return;
                    }

                    // สร้าง preview และเก็บไฟล์
                    const newPreviewImages = validFiles.map(file => URL.createObjectURL(file));
                    setNewProduct({
                      ...newProduct,
                      previewImages: [...newProduct.previewImages, ...newPreviewImages], // เพิ่ม previewImages
                      newImages: [...newProduct.newImages, ...validFiles] // เพิ่ม newImages
                    });

                    e.target.value = ''; // รีเซ็ต input
                  }} 
                />
              {newProduct.previewImages && newProduct.previewImages.length > 0 && (
                <div className="image-preview-container">
                  {newProduct.previewImages.map((img, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={img} alt={`Preview ${index}`} className="image-preview" />
                      <span 
                        className="remove-image" 
                        onClick={() => handleRemoveImage(index, 'newProduct')}
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="modal-actions">
                <button onClick={() => setNewProduct(null)} disabled={isSaving}>
                  ยกเลิก
                </button>
                <button onClick={handleSaveNewProduct} disabled={isSaving}>
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedProduct && (
          <div className="modal image-gallery-modal" onClick={handleCloseGallery}>
            <div className="modal-content image-gallery-content" onClick={(e) => e.stopPropagation()}>
              <h3>{selectedProduct.name}</h3>
              <p className="category">หมวดหมู่: {selectedProduct.category ? selectedProduct.category.name : 'ไม่ระบุ'}</p>
              <p className={`stock ${selectedProduct.stock < 2 ? 'low' : 'normal'}`}>
                สต็อก: {selectedProduct.stock || 0}
              </p>
              <div className="image-gallery">
                {(selectedProduct.product_image_urls || [selectedProduct.product_image_url] || []).map((img, index) => (
                  <img key={index} src={img} alt={`${selectedProduct.name} ${index}`} className="gallery-image" />
                ))}
              </div>
              <div className="modal-actions">
                <button onClick={() => setSelectedProduct(null)}>ปิด</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {user?.role === 'admin' && (
        <section className="others-products">
          <h2>สินค้าของผู้ขายอื่น</h2>
          <div className="product-list" style={{ overflow: 'hidden', maxHeight: 'none' }}>
            {othersProducts.length > 0 ? (
              othersProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <div onClick={() => handleProductClick(product)}>
                    <ProductCard product={product} />
                  </div>
                  <div className="product-seller-info">
                    <p>ผู้ขาย: {(product.createdBy?.fname || 'ไม่ระบุชื่อ')} {(product.createdBy?.lname || '')}</p>
                  </div>
                  <div className="product-actions">
                    <span className="icon-delete" onClick={() => handleDeleteProduct(product.id)} />
                  </div>
                </div>
              ))
            ) : (
              <p>ไม่มีสินค้าของผู้ขายอื่น</p>
            )}
          </div>
        </section>
      )}

      <section className="orders">
        <h2>รายงานคำสั่งซื้อ</h2>
        {orders ? (
          <>
            <div className="revenue-summary">
              <p>ยอด{user?.role === 'admin' ? 'รายได้' : 'ขาย'}ทั้งหมด: {formatCurrency(orders.totalRevenue)}</p>
              <p>ยอด{user?.role === 'admin' ? 'รายได้' : 'ขาย'}วันนี้: {formatCurrency(orders.dailyRevenue)}</p>
              <p>ยอด{user?.role === 'admin' ? 'รายได้' : 'ขาย'}เดือนนี้: {formatCurrency(orders.monthlyRevenue)}</p>
              <p>คำสั่งซื้อที่เสร็จสิ้น: {orders.completedOrders} รายการ</p>
              <p>คำสั่งซื้อที่รอดำเนินการ: {orders.pendingOrders} รายการ</p>
            </div>
            <div className="status-summary">
              <h3>สรุปสถานะ</h3>
              {orders.statusSummary ? (
                Object.entries(orders.statusSummary).map(([status, count]) => (
                  <span key={status} className={`status-badge status-${status}`}>
                    {status === 'pending' && 'รอดำเนินการ'}
                    {status === 'completed' && 'สำเร็จ'}
                    {status === 'cancelled' && 'ยกเลิก'}: {count}
                  </span>
                ))
              ) : (
                <p>ไม่มีข้อมูลสถานะ</p>
              )}
            </div>
            <table>
              <thead>
                <tr>
                  <th>รหัสคำสั่งซื้อ</th>
                  <th>ผู้ขาย</th>
                  <th>สินค้า</th>
                  <th>ยอดรวม</th>
                  <th>วันที่สั่งซื้อ</th>
                  <th>สถานะ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {orders.orders && orders.orders.length > 0 ? (
                  orders.orders.map((order) => {
                    const buyer = order.buyer || order.user || {};
                    return (
                      <tr key={order.id}>
                        <td>{order.id || 'ไม่ระบุ'}</td>
                        <td>
                          {(buyer.fname || 'ไม่ระบุชื่อ')} {(buyer.lname || '')}
                        </td>
                        <td>
                          {order.products && order.products.length > 0 ? (
                            order.products.map((p) => (
                              <div key={p.productId || Math.random()}>
                                {p.name || 'ไม่ระบุชื่อสินค้า'} (x{p.quantity || 0})
                              </div>
                            ))
                          ) : (
                            'ไม่มีสินค้า'
                          )}
                        </td>
                        <td>{formatCurrency(order.total)}</td>
                        <td>{order.createdAt ? formatDate(order.createdAt) : 'ไม่ระบุ'}</td>
                        <td>
                          <span className={`status-badge status-${order.status || 'pending'}`}>
                            {order.status === 'pending' && 'รอดำเนินการ'}
                            {order.status === 'completed' && 'สำเร็จ'}
                            {order.status === 'cancelled' && 'ยกเลิก'}
                            {!order.status && 'รอดำเนินการ'}
                          </span>
                        </td>
                        <td>
                          <span className="icon-edit" onClick={() => handleEditOrder(order)} />
                          <span className="icon-delete" onClick={() => handleDeleteOrder(order.id)} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">ไม่มีคำสั่งซื้อ</td>
                  </tr>
                )}
              </tbody>
            </table>
            {editOrder && (
              <div className="modal">
                <div className="modal-content">
                  <h3>แก้ไขคำสั่งซื้อ</h3>
                  <select
                    value={editOrder.status || 'pending'}
                    onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value })}
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="completed">สำเร็จ</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                  <div className="modal-actions">
                    <button onClick={() => setEditOrder(null)} disabled={isSaving}>
                      ยกเลิก
                    </button>
                    <button onClick={handleSaveOrder} disabled={isSaving}>
                      {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <p>ไม่มีข้อมูลคำสั่งซื้อ</p>
        )}
      </section>

      {user?.role === 'seller' && (
        <div className="chat-button" onClick={() => setIsReportModalOpen(true)}>
          💬 รายงานปัญหา
        </div>
      )}

      {isReportModalOpen && user?.role === 'seller' && (
        <div className="modal">
          <div className="modal-content">
            <h3>รายงานปัญหา</h3>
            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              placeholder="กรุณากรอกข้อความเพื่อรายงานปัญหา..."
              rows="5"
              required
            />
            <div className="modal-actions">
              <button onClick={() => setIsReportModalOpen(false)}>ยกเลิก</button>
              <button onClick={handleSubmitReport}>ส่งรายงาน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;