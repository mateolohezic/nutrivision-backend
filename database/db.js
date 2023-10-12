const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

const dBUrl = process.env.URL;
const connectDB = async () => {
  try {
    await mongoose.connect(dBUrl);
    console.log('Database connection established')
  } catch (error) {
    console.log('Database connection error: ' + error)
  }
}

connectDB();
module.exports = { connectDB }