import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // มีการ import อยู่แล้ว
import { 
  getProducts, 
  getSellerOrders, 
  getOrderReport, 
  deleteProduct, 
  deleteOrder, 
  updateProduct, 
  updateOrder,
  uploadProduct,
  getProfile,
  updateProfile,
  setAuthToken // เพิ่มการ import setAuthToken
} from '../api';
import ProductCard from './ProductCard';

function Dashboard({ user, editProfile, setEditProfile, updateUser }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [newProduct, setNewProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(user);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate(); // กำหนด navigate จาก useNavigate

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login'); // ใช้ navigate ที่นี่
      return;
    }
    setAuthToken(token); // ตั้งค่า token ก่อนเรียก API

    setLoading(true);
    setError('');
    try {
      const [productRes, orderRes, profileRes] = await Promise.all([
        getProducts(),
        user.role === 'admin' ? getOrderReport() : getSellerOrders(),
        getProfile()
      ]);

      console.log('Product Response:', productRes);
      console.log('Order Response:', orderRes);
      console.log('Profile Response:', profileRes);

      if (productRes.status !== 'OK') throw new Error(productRes.message);
      if (orderRes.status !== 'OK') throw new Error(orderRes.message);
      if (profileRes.status !== 'OK') throw new Error(profileRes.message);

      setProducts(productRes.products || []);
      setOrders(orderRes || {});
      setCurrentUser(profileRes.user || user);
      updateUser(profileRes.user || user);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setAuthToken(null);
        navigate('/login'); // ใช้ navigate ที่นี่
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) {
      fetchData();
    } else {
      navigate('/login'); // ใช้ navigate ที่นี่
    }
  }, [user?.role, navigate]); // เพิ่ม navigate ใน dependency array

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('ยืนยันการลบสินค้านี้?')) {
      try {
        await deleteProduct(productId);
        fetchData();
      } catch (err) {
        setError('ไม่สามารถลบสินค้าได้: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('ยืนยันการลบคำสั่งซื้อนี้?')) {
      try {
        await deleteOrder(orderId);
        fetchData();
      } catch (err) {
        setError('ไม่สามารถลบคำสั่งซื้อได้: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditProduct({ ...product });
  };

  const handleEditOrder = (order) => {
    setEditOrder({ ...order });
  };

  const handleAddProduct = () => {
    setNewProduct({ name: '', price: '', description: '', newImage: null });
  };

  const handleSaveProduct = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', editProduct.name);
      formData.append('price', editProduct.price);
      formData.append('description', editProduct.description);
      if (editProduct.newImage) {
        formData.append('product_image', editProduct.newImage);
      }
      await updateProduct(editProduct.id, formData);
      setEditProduct(null);
      fetchData();
    } catch (err) {
      setError('ไม่สามารถแก้ไขสินค้าได้: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewProduct = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      formData.append('description', newProduct.description);
      if (newProduct.newImage) {
        formData.append('product_image', newProduct.newImage);
      }
      await uploadProduct(formData);
      setNewProduct(null);
      fetchData();
    } catch (err) {
      setError('ไม่สามารถเพิ่มสินค้าได้: ' + (err.response?.data?.message || err.message));
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
      fetchData();
    } catch (err) {
      setError('ไม่สามารถแก้ไขคำสั่งซื้อได้: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('fname', editProfile.fname);
      formData.append('lname', editProfile.lname);
      if (editProfile.newImage) {
        formData.append('profile_image', editProfile.newImage);
      }
      const updatedProfile = await updateProfile(formData);
      setEditProfile(null);
      fetchData();
      updateUser(updatedProfile.user || { ...currentUser, fname: editProfile.fname, lname: editProfile.lname });
    } catch (err) {
      setError('ไม่สามารถแก้ไขโปรไฟล์ได้: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      if (editProfile) setEditProfile({ ...editProfile, avatar: imageUrl });
      if (editProduct) setEditProduct({ ...editProduct, avatar: imageUrl });
      if (newProduct) setNewProduct({ ...newProduct, avatar: imageUrl });
    }
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

  if (loading) return <div className="loading">กำลังโหลด...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      <h1>แดชบอร์ด {currentUser.role === 'admin' ? 'แอดมิน' : 'ผู้ขาย'}</h1>
      <div className="profile">
        <img src={currentUser.profile_image_url || './default-avatar.png'} alt="Profile" />
        <p>
          ยินดีต้อนรับ, {(currentUser.fname || 'ไม่ระบุชื่อ')} {(currentUser.lname || '')}
        </p>
      </div>

      <section className="products">
        <div className="products-header">
          <h2>สินค้าของคุณ</h2>
          <span className="icon-add" onClick={handleAddProduct}>+</span>
        </div>
        <div className="product-list">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="product-item">
                <ProductCard product={product} />
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
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <div className="modal-actions">
                <button onClick={handleSaveProduct} disabled={isSaving}>
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button onClick={() => setEditProduct(null)} disabled={isSaving}>
                  ยกเลิก
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
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <div className="modal-actions">
                <button onClick={handleSaveNewProduct} disabled={isSaving}>
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button onClick={() => setNewProduct(null)} disabled={isSaving}>
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="orders">
        <h2>รายงานคำสั่งซื้อ</h2>
        {orders ? (
          <>
            {currentUser.role === 'seller' && (
              <div className="revenue-summary">
                <p>รายได้ทั้งหมด: {formatCurrency(orders.totalRevenue)}</p>
                <p>รายได้วันนี้: {formatCurrency(orders.dailyRevenue)}</p>
                <p>รายได้เดือนนี้: {formatCurrency(orders.monthlyRevenue)}</p>
                <p>คำสั่งซื้อที่เสร็จสิ้น: {orders.completedOrders || 0} รายการ</p>
                <p>คำสั่งซื้อที่รอดำเนินการ: {orders.pendingOrders || 0} รายการ</p>
              </div>
            )}
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
                  <th>ผู้ซื้อ</th>
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
                    <button onClick={handleSaveOrder} disabled={isSaving}>
                      {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                    <button onClick={() => setEditOrder(null)} disabled={isSaving}>
                      ยกเลิก
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

      {editProfile && (
        <div className="modal">
          <div className="modal-content">
            <h3>แก้ไขโปรไฟล์</h3>
            <input
              type="text"
              value={editProfile.fname || ''}
              onChange={(e) => setEditProfile({ ...editProfile, fname: e.target.value })}
              placeholder="ชื่อ"
            />
            <input
              type="text"
              value={editProfile.lname || ''}
              onChange={(e) => setEditProfile({ ...editProfile, lname: e.target.value })}
              placeholder="นามสกุล"
            />
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <div className="modal-actions">
              <button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button onClick={() => setEditProfile(null)} disabled={isSaving}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;