import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { setAuthToken, getProfile } from './api';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import ViewReports from './components/ViewReports';
import Navbar from './components/Navbar';
import CategoryManagement from './components/CategoryManagement';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EditProfile from './components/EditProfile';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          setAuthToken(token);
          const res = await getProfile();
          setUser(res.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('CheckAuth Error:', err);
        setUser(null);
        localStorage.removeItem('token');
        setAuthToken(null);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setAuthToken(null);
    navigate('/login');
  };

  const handleEditProfile = () => {
    setIsEditProfileOpen(true);
  };

  const handleCloseEditProfile = () => {
    setIsEditProfileOpen(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser); // อัปเดต state ทันที
  };

  if (loading) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="app">
      {user && (
        <>
          <Navbar
            user={user}
            onLogout={handleLogout}
            onEditProfile={handleEditProfile}
          />
          {isEditProfileOpen && (
            <EditProfile
              user={user}
              setEditProfile={setIsEditProfileOpen}
              updateUser={updateUser}
              onClose={handleCloseEditProfile}
            />
          )}
        </>
      )}

      <Routes>
        <Route
          path="/login"
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!user ? <Register setUser={setUser} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/forgotpassword"
          element={!user ? <ForgotPassword /> : <Navigate to="/login" />}
        />
        <Route
          path="/resetpassword/:token"
          element={!user ? <ResetPassword /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} updateUser={updateUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/usermanagement"
          element={
            user && user.role === 'admin' ? (
              <UserManagement user={user} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/viewreports"
          element={
            user && user.role === 'admin' ? (
              <ViewReports />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/categorymanagement"
          element={
            user && user.role === 'admin' ? (
              <CategoryManagement user={user} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </div>
  );
}

export default App;