import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getProfile, setAuthToken } from '../api';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { email, password });

      // เรียก API login
      const loginRes = await login(email, password);
      console.log('Login response:', loginRes);

      if (loginRes.status !== 'OK') {
        throw new Error(loginRes.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }

      const token = loginRes.token;
      if (!token) {
        throw new Error('ไม่ได้รับ token จากเซิร์ฟเวอร์');
      }

      // ตั้งค่า token
      setAuthToken(token);
      localStorage.setItem('token', token);
      console.log('Token set:', token);

      // ดึงข้อมูลโปรไฟล์
      const profileRes = await getProfile();
      console.log('Profile response:', profileRes);

      if (profileRes.status !== 'OK') {
        throw new Error(profileRes.message || 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
      }

      const user = profileRes.user;
      if (!user || !user.id) {
        throw new Error('ข้อมูลผู้ใช้ไม่สมบูรณ์');
      }

      // อัปเดต state และ redirect
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      // ดึงข้อความ error จาก backend
      const errorMessage = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      setError(errorMessage);
      // ล้าง token ถ้ามี error
      setAuthToken(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="กรุณากรอกอีเมล"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>รหัสผ่าน</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="กรุณากรอกรหัสผ่าน"
            disabled={loading}
          />
        </div>
        {error && (
          <p className="error">
            {error}
            {error.includes('ไม่พบผู้ใช้') || error.includes('รหัสผ่านไม่ถูกต้อง') ? (
              <span> <a href="/register">สมัครสมาชิกใหม่</a></span>
            ) : null}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      <p>
        ยังไม่มีบัญชี? <a href="/register">สมัครสมาชิก</a>
      </p>
    </div>
  );
}

export default Login;