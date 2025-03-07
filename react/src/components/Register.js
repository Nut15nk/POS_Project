// frontend/src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(email, password, fname, lname);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัคร');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>สมัครสมาชิก</h2>
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
        <div className="form-group">
          <label>ชื่อ</label>
          <input
            type="text"
            value={fname}
            onChange={(e) => setFname(e.target.value)}
            required
            placeholder="กรุณากรอกชื่อ"
          />
        </div>
        <div className="form-group">
          <label>นามสกุล</label>
          <input
            type="text"
            value={lname}
            onChange={(e) => setLname(e.target.value)}
            required
            placeholder="กรุณากรอกนามสกุล"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </button>
      </form>
      <p>
        มีบัญชีแล้ว? <a href="/login">เข้าสู่ระบบ</a>
      </p>
    </div>
  );
}

export default Register;