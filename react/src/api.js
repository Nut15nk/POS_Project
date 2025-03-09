import axios from 'axios';

// กำหนด base URL ของ backend
const api = axios.create({
  baseURL: 'http://localhost:3333',
});

// ฟังก์ชันเพื่อตั้งค่า token ใน header
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
};

// ฟังก์ชัน login
export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

// ฟังก์ชัน register
export const register = async (email, password, fname, lname) => {
  const response = await api.post('/register', { email, password, fname, lname });
  return response.data;
};

// ฟังก์ชันดึงโปรไฟล์
export const getProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

// ฟังก์ชันดึงสินค้าทั้งหมด
export const getProducts = async (config = {}) => {
  const response = await api.get('/products', config);
  return response.data;
};

// ฟังก์ชันดึงคำสั่งซื้อของผู้ขาย
export const getSellerOrders = async () => {
  const response = await api.get('/orders/seller');
  return response.data;
};

// ฟังก์ชันดึงคำสั่งซื้อทั้งหมด (สำหรับ admin)
export const getOrderReport = async () => {
  const response = await api.get('/orders/report');
  return response.data;
};

// ฟังก์ชันลบสินค้า
export const deleteProduct = async (productId) => {
  const response = await api.delete(`/product/${productId}`);
  return response.data;
};

// ฟังก์ชันลบคำสั่งซื้อ
export const deleteOrder = async (orderId) => {
  const response = await api.delete(`/orders/${orderId}`);
  return response.data;
};

// ฟังก์ชันแก้ไขสินค้า
export const updateProduct = async (productId, formData) => {
  const response = await api.put(`/product/${productId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ฟังก์ชันแก้ไขคำสั่งซื้อ
export const updateOrder = async (orderId, data) => {
  const response = await api.put(`/orders/${orderId}`, data);
  return response.data;
};

// ฟังก์ชันอัปโหลดสินค้าใหม่
export const uploadProduct = async (formData) => {
  const response = await api.post('/product/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ฟังก์ชันอัปเดตโปรไฟล์
export const updateProfile = async (formData) => {
  const response = await api.put('/user/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ฟังก์ชัน logout
export const logoutApi = async () => {
  localStorage.removeItem('token');
  setAuthToken(null);
};

// ฟังก์ชันอัปโหลดรูปโปรไฟล์
export const uploadProfileImage = async (formData) => {
  const response = await api.post('/user/uploadprofile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ฟังก์ชันจัดการผู้ใช้
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// ฟังก์ชันจัดการรายงาน
export const createReport = async (message) => {
  const response = await api.post('/reports', { message });
  return response.data;
};

export const getReports = async () => {
  const response = await api.get('/reports');
  return response.data;
};

export const updateReport = async (reportId, status) => {
  const response = await api.put(`/reports/${reportId}`, { status });
  return response.data;
};

// ฟังก์ชันจัดการหมวดหมู่
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await api.post('/categories', categoryData);
  return response.data; 
};

export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/categories/${categoryId}`);
  return response.data;
};

export const updateCategory = async (categoryId, categoryData) => {
  const response = await api.put(`/categories/${categoryId}`, categoryData);
  return response.data;
};

// ฟังก์ชันรีเซ็ตรหัสผ่าน
export const requestPasswordReset = async (email) => {
  const response = await api.post('/resetpassword', { email });
  return response.data;
};

export const resetPasswordConfirm = async (token, newPassword) => {
  const response = await api.post('/resetpassword/confirm', { token, newPassword });
  return response.data;
};

export { setAuthToken }; // Export เพื่อให้ component เรียกใช้ได้