import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { UserRole } from '../src/types';
import { getFullName } from '../src/utils/nameUtils';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample subject data - Mix of Chinese and English names
// Chinese names include both single-character and compound surnames
const subjects = [
  // Chinese names with single-character surnames
  { firstName: '明', lastName: '张', email: 'zhang.ming@example.com' },
  { firstName: '芳', lastName: '李', email: 'li.fang@example.com' },
  { firstName: '伟', lastName: '王', email: 'wang.wei@example.com' },
  { firstName: '娜', lastName: '刘', email: 'liu.na@example.com' },
  { firstName: '强', lastName: '陈', email: 'chen.qiang@example.com' },
  { firstName: '静', lastName: '杨', email: 'yang.jing@example.com' },
  { firstName: '磊', lastName: '赵', email: 'zhao.lei@example.com' },
  { firstName: '丽', lastName: '黄', email: 'huang.li@example.com' },
  { firstName: '勇', lastName: '周', email: 'zhou.yong@example.com' },
  { firstName: '敏', lastName: '吴', email: 'wu.min@example.com' },

  // Chinese names with compound (two-character) surnames
  { firstName: '修', lastName: '欧阳', email: 'ouyang.xiu@example.com' },
  { firstName: '迁', lastName: '司马', email: 'sima.qian@example.com' },
  { firstName: '亮', lastName: '诸葛', email: 'zhuge.liang@example.com' },
  { firstName: '婉儿', lastName: '上官', email: 'shangguan.waner@example.com' },
  { firstName: '不败', lastName: '东方', email: 'dongfang.bubai@example.com' },

  // English names
  { firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com' },
  { firstName: 'Emily', lastName: 'Johnson', email: 'emily.johnson@example.com' },
  { firstName: 'Michael', lastName: 'Williams', email: 'michael.williams@example.com' },
  { firstName: 'Sarah', lastName: 'Brown', email: 'sarah.brown@example.com' },
  { firstName: 'David', lastName: 'Jones', email: 'david.jones@example.com' },
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
      const fullName = getFullName(subject.firstName, subject.lastName);
      console.log(`✅ Created: ${fullName} (${subject.email})`);
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
