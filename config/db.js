const mongoose = require('mongoose');


const connectDB = async () => {
  try {

    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/project_pos';


    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);

    process.exit(1);
  }
};


module.exports = connectDB;