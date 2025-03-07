import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getProfile } from '../api'; // เพิ่ม getProfile ที่นี่

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
      const res = await login(email, password);
      localStorage.setItem('token', res.token);
      const profile = await getProfile();
      setUser(profile.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
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
          />
        </div>
        {error && <p className="error">{error}</p>}
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