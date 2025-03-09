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
export const getProducts = async () => {
  const response = await api.get('/products');
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

// เพิ่มฟังก์ชัน logout (ถ้าต้องการ)
export const logoutApi = async () => {
  localStorage.removeItem('token');
  setAuthToken(null);
};

// เพิ่มฟังก์ชัน UploadPorfileImage
export const uploadProfileImage = async (formData) => {
  const response = await api.post('/user/uploadprofile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

export const createReport = async (message) => {
  const response = await api.post('/reports', { message });
  return response.data;
};

// เพิ่มฟังก์ชันสำหรับดึงรายการรายงาน
export const getReports = async () => {
  const response = await api.get('/reports');
  return response.data;
};

// เพิ่มฟังก์ชันสำหรับอัปเดตสถานะรายงาน
export const updateReport = async (reportId, status) => {
  const response = await api.put(`/reports/${reportId}`, { status });
  return response.data;
};

export { setAuthToken }; // Export เพื่อให้ component เรียกใช้ได้