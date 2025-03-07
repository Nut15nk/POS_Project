import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3333';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User APIs
export const login = async (email, password) => {
  const response = await api.post('/login', { email, password }).then((res) => res.data);
  if (response.token) {
    localStorage.setItem('token', response.token);
    const profile = await getProfile();
    localStorage.setItem('role', profile.user?.role || '');
  }
  return response;
};

export const register = (email, password, fname, lname) => 
  api.post('/register', { email, password, fname, lname }).then((res) => res.data);

export const getProfile = () => 
  api.get('/user/profile').then((res) => res.data);

export const updateProfile = (profileData) => 
  api.put('/user/profile', profileData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);

// Product APIs
export const getProducts = () => 
  api.get('/products').then((res) => res.data);

export const uploadProduct = (productData) => 
  api.post('/product/upload', productData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);

export const deleteProduct = (productId) => 
  api.delete(`/product/${productId}`).then((res) => res.data);

export const updateProduct = (productId, productData) => 
  api.put(`/product/${productId}`, productData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);

// Order APIs
export const getSellerOrders = () => 
  api.get('/orders/seller/report').then((res) => {
    console.log('Seller Orders Response:', res.data); // Debug
    return res.data;
  });

export const getAdminOrders = () => 
  api.get('/orders/report').then((res) => {
    console.log('Admin Orders Response:', res.data); // Debug
    return res.data;
  });

export const deleteOrder = (orderId) => 
  api.delete(`/orders/${orderId}`).then((res) => res.data);

export const updateOrder = (orderId, orderData) => 
  api.put(`/orders/${orderId}`, orderData).then((res) => res.data);

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};