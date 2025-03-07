import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { getProfile } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(null); // เพิ่ม state สำหรับแก้ไขโปรไฟล์
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await getProfile();
          setUser(res.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleEditProfile = () => {
    setEditProfile(user);
  };
  const updateUser = (updateUser) => {
    setUser(updateUser);
  }
  if (loading) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="app">
      {user && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          onEditProfile={handleEditProfile}
        />
      )}
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard
                user={user}
                editProfile={editProfile}
                setEditProfile={setEditProfile}
                updateUser={updateUser}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </div>
  );
}

export default App;