import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";

// Dropdown Component
const Dropdown = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null); // สำหรับเก็บ URL ของรูปโปรไฟล์
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // ถ้าไม่ต้องการดึงจาก API, ใช้รูปจาก src โดยตรง
  useEffect(() => {
    // ในที่นี้เราใช้รูปจากไฟล์ในโฟลเดอร์ src/assets หรือ src/ ตรงๆ
    setProfileImage(require("../src/default-profile-image.png")); // หรือใช้ path ตามที่คุณเก็บไว้
  }, []);

  // ฟังก์ชันสำหรับไปหน้า Profile
  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="dropdown-container">
      <button className="dropdown-button" onClick={toggleDropdown}>
        <img
          src={profileImage} // ใช้ profileImage ที่ได้จากการ import
          alt="Profile"
          className="profile-icon"
        />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <ul>
            <li onClick={handleProfileClick}>Profile</li>
            <li>Settings</li>
            <li onClick={onLogout}>Logout</li>
          </ul>
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();

  // ฟังก์ชันสำหรับออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // การตรวจสอบการล็อกอินเมื่อหน้าโหลด
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    } else {
      axios
        .post(
          "http://localhost:3333/authen",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => {
          if (response.data.status !== "ok") {
            localStorage.removeItem("token");
            setTimeout(() => {
              navigate("/login");
            }, 1500);
          }
        })
        .catch((error) => {
          console.error("Authentication error:", error);
          localStorage.removeItem("token");
          navigate("/login");
        });
    }
  }, [navigate]);

  // ตัวอย่างข้อมูลหนังสือ
  const books = [
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      price: "$10.99",
      description: "A classic novel set in the Jazz Age, depicting the lavish life and tragic events of Jay Gatsby.",
    },
    {
      id: 2,
      title: "1984",
      author: "George Orwell",
      price: "$8.99",
      description: "A dystopian novel exploring the dangers of totalitarianism and extreme political ideology.",
    },
    {
      id: 3,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      price: "$12.99",
      description: "A story about justice and moral growth in a racially divided southern town.",
    },
  ];

  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to Our Bookstore</h1>
      <Dropdown onLogout={handleLogout} />
      <div className="books-list">
        {books.map((book) => (
          <div key={book.id} className="book-card">
            <h2 className="book-title">{book.title}</h2>
            <p className="book-author">by {book.author}</p>
            <p className="book-price">{book.price}</p>
            <p className="book-description">{book.description}</p>
            <button className="buy-button">Buy Now</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
