import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

// Default profile image
import defaultProfileImage from './default-profile-image.png';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [newFname, setNewFname] = useState('');
  const [newLname, setNewLname] = useState('');
  const [editing, setEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);

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
          if (response.data.status === "ok") {
            axios
              .get("http://localhost:3333/user/profile", {
                headers: { Authorization: `Bearer ${token}` }
              })
              .then((res) => {
                setUser(res.data.user);
                setNewFname(res.data.user.fname);
                setNewLname(res.data.user.lname);
                setProfileImage(res.data.user.profile_image);
              })
              .catch((err) => {
                console.error("Error fetching user profile", err);
              });
          } else {
            localStorage.removeItem("token");
            navigate("/login");
          }
        })
        .catch((error) => {
          console.error("Authentication error:", error);
          localStorage.removeItem("token");
          navigate("/login");
        });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleSaveProfile = () => {
    const token = localStorage.getItem("token");

    axios
      .put(
        "http://localhost:3333/user/profile",
        { fname: newFname, lname: newLname },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setUser((prevUser) => ({
          ...prevUser,
          fname: newFname,
          lname: newLname
        }));
        setEditing(false);
      })
      .catch((error) => {
        console.error("Error saving profile", error);
      });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleUploadProfileImage = () => {
    if (!imageFile) {
      alert("กรุณาเลือกไฟล์ภาพก่อน");
      return;
    }

    const formData = new FormData();
    formData.append("profile_image", imageFile);

    const token = localStorage.getItem("token");

    axios
      .post("http://localhost:3333/user/uploadprofile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        alert("อัปโหลดรูปโปรไฟล์สำเร็จ!");
        axios
          .get("http://localhost:3333/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setProfileImage(res.data.user.profile_image);
          })
          .catch((err) => {
            console.error("Error fetching user profile", err);
          });
      })
      .catch((error) => {
        console.error("Error uploading profile image", error);
        alert("เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์");
      });
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">User Profile</h1>
      {user ? (
        <div className="profile-details">
          <div className="profile-image-container">
            <img
              src={profileImage ? `data:image/jpeg;base64,${profileImage}` : defaultProfileImage}
              alt="Profile"
              className="profile-image"
            />
            <input
              type="file"
              onChange={handleProfileImageChange}
              accept="image/*"
            />
            <button className="save-button" onClick={handleUploadProfileImage}>
              Upload Profile Image
            </button>
          </div>
          <div className="profile-info">
            <h2>{user.fname} {user.lname}</h2>
            {editing ? (
              <div className="edit-profile-form">
                <input
                  type="text"
                  value={newFname}
                  onChange={(e) => setNewFname(e.target.value)}
                />
                <input
                  type="text"
                  value={newLname}
                  onChange={(e) => setNewLname(e.target.value)}
                />
                <button className="save-button" onClick={handleSaveProfile}>Save</button>
              </div>
            ) : (
              <div>
                <button className="edit-button" onClick={handleEditProfile}>Edit Profile</button>
              </div>
            )}
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Profile;
