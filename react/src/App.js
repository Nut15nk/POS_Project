import React from 'react';
import { Link } from 'react-router-dom';
import './App.css'; // นำเข้าไฟล์ CSS

const App = () => {
    return (
        <div className="app-container">
            <h1>Welcome to the App</h1>
            <div className="link-container">
                <Link className="app-link" to="/login">Login</Link>
                <Link className="app-link" to="/register">Register</Link>
                <Link className="app-link" to="/request-reset-password">Reset Password</Link> {/* เปลี่ยนลิงก์ที่นี่ */}
            </div>
        </div>
    );
};

export default App;
