import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { UserRole } from '../src/types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample subject data
const subjects = [
  { firstName: 'Alice', lastName: 'Chen', email: 'alice.chen@example.com' },
  { firstName: 'Bob', lastName: 'Wang', email: 'bob.wang@example.com' },
  { firstName: 'Charlie', lastName: 'Liu', email: 'charlie.liu@example.com' },
  { firstName: 'Diana', lastName: 'Zhang', email: 'diana.zhang@example.com' },
  { firstName: 'Eric', lastName: 'Li', email: 'eric.li@example.com' },
  { firstName: 'Fiona', lastName: 'Wu', email: 'fiona.wu@example.com' },
  { firstName: 'George', lastName: 'Yang', email: 'george.yang@example.com' },
  { firstName: 'Helen', lastName: 'Zhou', email: 'helen.zhou@example.com' },
  { firstName: 'Ivan', lastName: 'Huang', email: 'ivan.huang@example.com' },
  { firstName: 'Julia', lastName: 'Lin', email: 'julia.lin@example.com' },
  { firstName: 'Kevin', lastName: 'Ma', email: 'kevin.ma@example.com' },
  { firstName: 'Laura', lastName: 'Gao', email: 'laura.gao@example.com' },
  { firstName: 'Michael', lastName: 'Xu', email: 'michael.xu@example.com' },
  { firstName: 'Nancy', lastName: 'Sun', email: 'nancy.sun@example.com' },
  { firstName: 'Oliver', lastName: 'Zhu', email: 'oliver.zhu@example.com' },
  { firstName: 'Patricia', lastName: 'Han', email: 'patricia.han@example.com' },
  { firstName: 'Quinn', lastName: 'Tang', email: 'quinn.tang@example.com' },
  { firstName: 'Rachel', lastName: 'Feng', email: 'rachel.feng@example.com' },
  { firstName: 'Samuel', lastName: 'Jiang', email: 'samuel.jiang@example.com' },
  { firstName: 'Teresa', lastName: 'Shen', email: 'teresa.shen@example.com' },
];

async function populateSubjects() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hsrp';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if subjects already exist
    const existingCount = await User.countDocuments({ role: UserRole.SUBJECT });
    console.log(`\nFound ${existingCount} existing subject users`);

    let created = 0;
    let skipped = 0;

    console.log('\nCreating subject users...');
    console.log('-----------------------------------');

    // Create subjects
    for (const subject of subjects) {
      // Check if user already exists
      const exists = await User.findOne({ email: subject.email });

      if (exists) {
        console.log(`⏭️  Skipped: ${subject.email} (already exists)`);
        skipped++;
        continue;
      }

      // Create new subject user
      const user = new User({
        email: subject.email,
        password: 'password123', // Default password for all test subjects
        firstName: subject.firstName,
        lastName: subject.lastName,
        role: UserRole.SUBJECT,
      });

      await user.save();
      console.log(`✅ Created: ${subject.firstName} ${subject.lastName} (${subject.email})`);
      created++;
    }

    console.log('\n===================================');
    console.log('          SUMMARY');
    console.log('===================================');
    console.log(`✅ Created: ${created} new subject users`);
    console.log(`⏭️  Skipped: ${skipped} existing users`);
    console.log(`📊 Total subjects: ${await User.countDocuments({ role: UserRole.SUBJECT })}`);
    console.log('===================================');
    console.log('\n📝 Default password: password123');
    console.log('⚠️  Use these accounts for testing only!');

  } catch (error) {
    console.error('❌ Error populating subjects:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
populateSubjects();
