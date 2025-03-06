import React, { useState } from "react";
import "./Registration.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Registration = () => {
  const [fname, setFirstName] = useState("");
  const [lname, setLastName] = useState("");
  const [mail, setEmail] = useState("");
  const [pass, setPassword] = useState("");
  const [cPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (pass !== cPassword) {
      setError("Passwords do not match");
      setSuccessMessage("");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3333/register", {
        fname: fname,
        lname: lname,
        email: mail,
        password: pass
      });

      // Check if registration is successful
      if (res.status === 201 && res.data.status === "OK") {
        setSuccessMessage("Registration successful! Redirecting to Login...");
        setError("");
        
        // Store the JWT token in localStorage
        localStorage.setItem("token", res.data.token);

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // Handle validation or duplicate email errors
        setError(error.response.data.message || "Invalid input data");
      } else {
        // Handle other errors
        setError("An unexpected error occurred. Please try again.");
      }
      setSuccessMessage("");
    }
  };

  return (
    <div className="registration-container">
      <form className="registration-form" onSubmit={handleRegister}>
        <h2 className="registration-title">Sign Up</h2>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        
        <div className="input-group">
          <label>First Name</label>
          <input
            type="text"
            value={fname}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        
        <div className="input-group">
          <label>Last Name</label>
          <input
            type="text"
            value={lname}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={mail}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="input-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={cPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="register-button">Sign Up</button>
      </form>
    </div>
  );
};

export default Registration;
