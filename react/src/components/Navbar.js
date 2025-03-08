// frontend/src/components/Navbar.js
import React from 'react';

function Navbar({ user, onLogout, onEditProfile }) {
  return (
    <nav className="navbar">
      <h3>POS System</h3>
      <div>
        <span>{user.fname} {user.lname}</span>
        <button className="edit-profile-btn" onClick={onEditProfile}>
          แก้ไขโปรไฟล์
        </button>
        <button onClick={onLogout}>ออกจากระบบ</button>
      </div>
    </nav>
  );
}

export default Navbar;