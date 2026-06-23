import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Seed Super Admin
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

    const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!existingSuperAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(superAdminPassword, salt);

      await User.create({
        username: superAdminUsername,
        email: 'superadmin@example.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        organization: null,
      });
      console.log('Super Admin seeded successfully!');
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};