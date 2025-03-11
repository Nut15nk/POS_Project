import React, { useState } from 'react';
import { updateProfile, getProfile } from '../api';
import defaultAvatar from './default-avatar.png';

const provinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
  "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม",
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส",
  "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พังงา", "พัทลุง",
  "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่",
  "พะเยา", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
  "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง",
  "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย",
  "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี",
  "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
  "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์",
  "อุบลราชธานี", "อำนาจเจริญ"
];

function EditProfile({ user, setEditProfile, updateUser, onClose }) {
  const [profileData, setProfileData] = useState(user || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setEditProfile(false); // ปิด modal เมื่อเกิดข้อผิดพลาด
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewImage = URL.createObjectURL(file);
    setProfileData({ ...profileData, previewImage, newImage: file });
    e.target.value = '';
  };

  const isFormValid = () => {
    return profileData.fname && profileData.lname && profileData.address?.street && profileData.address?.city && profileData.address?.province && profileData.address?.postalCode;
  };

  const handleSaveProfile = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (!isFormValid()) {
        alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
        setIsSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append('fname', profileData.fname || '');
      formData.append('lname', profileData.lname || '');

      if (profileData.address) {
        formData.append('address[street]', profileData.address.street || '');
        formData.append('address[city]', profileData.address.city || '');
        formData.append('address[province]', profileData.address.province || '');
        formData.append('address[postalCode]', profileData.address.postalCode || '');
        formData.append('address[country]', 'Thailand');
      }

      if (profileData.newImage) {
        formData.append('profile_image', profileData.newImage);
      }

      // อัปเดตโปรไฟล์ใน backend
      await updateProfile(formData);

      // ดึงข้อมูลล่าสุดจาก backend ทันที
      const latestProfile = await getProfile();

      // อัปเดต state ใน App.js ทันทีด้วยข้อมูลล่าสุด
      updateUser(latestProfile.user);

      // ปิด modal
      setEditProfile(false);
      if (onClose) onClose();
    } catch (err) {
      handleError('ไม่สามารถแก้ไขโปรไฟล์ได้: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>แก้ไขโปรไฟล์</h3>
        <div className="profile">
          <img 
            src={profileData.profile_image_url || profileData.previewImage || defaultAvatar} 
            alt="Profile" 
          />
        </div>
        
        <h4>ชื่อ - นามสกุล</h4>
        <input
          type="text"
          value={profileData.fname || ''}
          onChange={(e) => setProfileData({ ...profileData, fname: e.target.value })}
          placeholder="ชื่อ"
          required
        />
        <input
          type="text"
          value={profileData.lname || ''}
          onChange={(e) => setProfileData({ ...profileData, lname: e.target.value })}
          placeholder="นามสกุล"
          required
        />
        
        <h4>ที่อยู่ของร้าน</h4>
        <input
          type="text"
          value={profileData.address?.street || ''}
          onChange={(e) => setProfileData({ ...profileData, address: { ...profileData.address, street: e.target.value } })}
          placeholder="ถนน เขต ตำบล"
          required
        />
        <input
          type="text"
          value={profileData.address?.city || ''}
          onChange={(e) => setProfileData({ ...profileData, address: { ...profileData.address, city: e.target.value } })}
          placeholder="อำเภอ"
          required
        />
        <div className="form-group">
          <label>จังหวัด</label>
          <select
            value={profileData.address?.province || ''}
            onChange={(e) => setProfileData({ ...profileData, address: { ...profileData.address, province: e.target.value } })}
            required
          >
            <option value="">เลือกจังหวัด</option>
            {provinces.map((prov, index) => (
              <option key={index} value={prov}>{prov}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={profileData.address?.postalCode || ''}
          onChange={(e) => setProfileData({ ...profileData, address: { ...profileData.address, postalCode: e.target.value } })}
          placeholder="รหัสไปรษณีย์"
          required
        />
        <div className="form-group">
          <label>ประเทศ</label>
          <input
            type="text"
            value="Thailand"
            disabled
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
          />
        </div>

        <input type="file" accept="image/*" onChange={handleImageChange} />
        {profileData.previewImage && (
          <div className="image-preview-container">
            <img src={profileData.previewImage} alt="Profile Preview" className="image-preview" />
          </div>
        )}
        <div className="modal-actions">
          <button onClick={() => setEditProfile(false)} disabled={isSaving}>
            ยกเลิก
          </button>
          <button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-modal">
          <div className="error-modal-content">
            <h3>เกิดข้อผิดพลาด</h3>
            <p>{error}</p>
            <button onClick={() => setError('')}>ตกลง</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProfile;