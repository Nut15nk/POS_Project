// frontend/src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, deleteUser, setAuthToken } from '../api';

function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      setAuthToken(token);

      setLoading(true);
      setError('');
      try {
        const res = await getUsers();
        console.log('Users Response:', res);
        if (res.status !== 'OK') throw new Error(res.message);
        setUsers(res.users);
        setFilteredUsers(res.users);
      } catch (err) {
        setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setAuthToken(null);
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  useEffect(() => {
    const filtered = users.filter((u) => {
      const fullName = `${u.fname || ''} ${u.lname || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleDeleteUser = async (userId) => {
    console.log('Deleting user with ID:', userId);
    if (window.confirm('ยืนยันการลบผู้ใช้นี้? (จะลบสินค้าและคำสั่งซื้อที่เกี่ยวข้องทั้งหมดด้วย)')) {
      try {
        const res = await deleteUser(userId);
        console.log('Delete Response:', res);
        if (res.status !== 'OK') throw new Error(res.message);
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers.filter((u) => {
          const fullName = `${u.fname || ''} ${u.lname || ''}`.toLowerCase();
          const email = (u.email || '').toLowerCase();
          const term = searchTerm.toLowerCase();
          return fullName.includes(term) || email.includes(term);
        }));
      } catch (err) {
        setError('ไม่สามารถลบผู้ใช้ได้: ' + (err.response?.data?.message || err.message));
        console.error('Delete Error:', err);
      }
    }
  };

  if (loading) return <div className="loading">กำลังโหลด...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-management">
      <h1>การจัดการผู้ใช้ (Seller)</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="user-list">
        {filteredUsers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>ชื่อ</th>
                <th>นามสกุล</th>
                <th>อีเมล</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.fname || 'ไม่ระบุ'}</td>
                  <td>{u.lname || 'ไม่ระบุ'}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="icon-delete" onClick={() => handleDeleteUser(u.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>ไม่มีผู้ใช้ที่ตรงกับการค้นหา</p>
        )}
      </div>
    </div>
  );
}

export default UserManagement;