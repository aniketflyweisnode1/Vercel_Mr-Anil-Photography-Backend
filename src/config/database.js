const mongoose = require('mongoose');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://anilPhy:Nrlf8IeQFyuXlw0a@anilphotography.uhqe7te.mongodb.net/?retryWrites=true&w=majority&appName=AnilPhotography");

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB; 
