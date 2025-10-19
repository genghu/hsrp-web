import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { UserRole } from '../src/types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hsrp';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Admin user details
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hsrp.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin user already exists: ${adminEmail}`);

      // Option to update role if user exists but isn't admin
      if (existingAdmin.role !== UserRole.ADMIN) {
        existingAdmin.role = UserRole.ADMIN;
        await existingAdmin.save();
        console.log(`✅ Updated user role to ADMIN for: ${adminEmail}`);
      } else {
        console.log('✅ User is already an admin');
      }
    } else {
      // Create new admin user
      const adminUser = new User({
        email: adminEmail,
        password: adminPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: UserRole.ADMIN,
        institution: 'HSRP Administration',
        department: 'System'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('-----------------------------------');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log('-----------------------------------');
      console.log('⚠️  IMPORTANT: Change the password after first login!');
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
