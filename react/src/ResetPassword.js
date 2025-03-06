import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css'; // นำเข้าไฟล์ CSS

const ResetPassword = () => {
    const { token } = useParams(); // ดึงโทเคนจาก URL
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        try {
            const response = await axios.post(`http://localhost:3333/reset-password/${token}`, { password });
            setMessage(response.data.message);
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || 'Something went wrong'));
        }
    };

    return (
        <div className="reset-password-container">
            <h2>Reset Password</h2>
            <form onSubmit={handleResetPassword}>
                <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit">Reset Password</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ResetPassword;
