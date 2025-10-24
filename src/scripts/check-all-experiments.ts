import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Experiment } from '../models/Experiment';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hsrp';

async function checkAllExperiments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const allExperiments = await Experiment.find({});

    console.log(`📊 Total experiments in database: ${allExperiments.length}\n`);
    console.log('─────────────────────────────────────────────────────────────');

    for (const exp of allExperiments) {
      const sessionCount = exp.sessions?.length || 0;
      const statusIcon = exp.status === 'open' ? '🟢' :
                         exp.status === 'approved' ? '🟡' :
                         exp.status === 'draft' ? '⚪' : '🔵';

      console.log(`${statusIcon} ${exp.status.toUpperCase()}: "${exp.title}"`);
      console.log(`   Sessions: ${sessionCount}`);
      console.log(`   ID: ${exp._id}`);

      if (exp.status === 'open' && sessionCount === 0) {
        console.log(`   ⚠️  WARNING: OPEN but no sessions!`);
      }
      console.log('');
    }

    console.log('─────────────────────────────────────────────────────────────');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkAllExperiments();
