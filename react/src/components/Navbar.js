import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout, onEditProfile }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleClickOutside = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="menu-icon" onClick={toggleMenu}>☰</span>
        <h3>POS System</h3>
      </div>
      <div>
        <span>{user.fname} {user.lname}</span>
        <button className="edit-profile-btn" onClick={onEditProfile}>
          แก้ไขโปรไฟล์
        </button>
        <button onClick={onLogout}>ออกจากระบบ</button>
      </div>

      {/* Sidebar Menu */}
      {isMenuOpen && (
        <div className="sidebar" ref={sidebarRef}>
          <div className="sidebar-header">
            <span className="close-icon" onClick={toggleMenu}>✕</span>
          </div>
          <ul className="sidebar-menu">
            <li onClick={() => handleNavigation('/dashboard')}>
              จัดการสินค้าและคำสั่งซื้อ
            </li>
            {user.role === 'admin' && (
              <>
                <li onClick={() => handleNavigation('/usermanagement')}>
                  จัดการผู้ใช้งาน
                </li>
                <li onClick={() => handleNavigation('/viewreports')}>
                  ดูรายงานปัญหา
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

export default Navbar;