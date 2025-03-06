import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // หาก token มีอยู่ เปลี่ยนเส้นทางไปที่หน้า Home ทันที
      navigate("/Home");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
  
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      const res = await axios.post("http://localhost:3333/login", {
        email: formData.email,
        password: formData.password
      });
      if (res.status === 200) {
        localStorage.setItem("token", res.data.token);
        console.log("Login Success");
        navigate("/Home");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setError("Email or password is invalid");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2 className="login-title">Login</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default Login;
