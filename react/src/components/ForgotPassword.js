import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // เพิ่ม Loading State
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>ลืมรหัสผ่าน</h2>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>อีเมล</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
        </button>
      </form>
      <p>
        กลับไปที่ <a href="/login">หน้าเข้าสู่ระบบ</a>
      </p>
    </div>
  );
};

export default ForgotPassword;