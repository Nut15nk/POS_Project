// seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./controller/user_config'); // ปรับ path ตามโครงสร้างโปรเจค

// การเชื่อมต่อ MongoDB
const mongoURI = 'mongodb://localhost:27017/project_pos'; // ปรับชื่อ database ตามที่ใช้
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));

// ฟังก์ชันสร้าง hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// ข้อมูล seed (ตัวอย่างผู้ใช้ 3 คน)
const seedUsers = async () => {
  try {
    // ลบข้อมูลเก่าทั้งหมดก่อน (ถ้าต้องการ)
    await User.deleteMany({});
    console.log('Deleted existing users');

    // ข้อมูลผู้ใช้พร้อม profile_image_url
    const users = [
      {
        email: 'nakavat.w1@gmail.com',
        password: await hashPassword('test123'),
        fname: 'Nakhawat',
        lname: 'Ju',
        role: 'admin',
        profile_image_url: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567892/profile_images/user2.jpg'
      }
    ];

    // ใส่ข้อมูลลงใน MongoDB
    await User.insertMany(users);
    console.log('Users seeded successfully');

    // ปิดการเชื่อมต่อ
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding data:', err);
    mongoose.connection.close();
  }
};

// รันฟังก์ชัน seed
seedUsers();