const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    console.log('ℹ️  No MONGODB_URI provided. Running in local persistent storage mode.');
    isConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️  Falling back to local persistent storage mode.');
    isConnected = false;
    return false;
  }
}

function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isMongoConnected };
