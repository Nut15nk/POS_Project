import React, { useState } from 'react';
import axios from 'axios';
import './RequestResetPassword.css'; // นำเข้าไฟล์ CSS

const RequestResetPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleRequestResetPassword = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3333/reset-password', { email });
            setMessage(response.data.message);
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || 'Something went wrong'));
        }
    };

    return (
        <div className="request-reset-password-container">
            <h2>Request Password Reset</h2>
            <form onSubmit={handleRequestResetPassword}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit">Send Reset Link</button>
            </form>
            {message && (
            <p className={message.startsWith('Error') ? 'error-message' : 'success-message'}>
                {message}
            </p>
        )}
        </div>
    );
};

export default RequestResetPassword;
