import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Experiment } from '../models/Experiment';
import { ExperimentStatus } from '../types';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hsrp';

async function fixOpenExperimentsWithoutSessions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n🔍 Finding OPEN experiments without sessions...\n');

    // Find all OPEN experiments
    const openExperiments = await Experiment.find({
      status: ExperimentStatus.OPEN
    });

    console.log(`Found ${openExperiments.length} OPEN experiments`);

    const experimentsToFix: any[] = [];

    for (const exp of openExperiments) {
      if (!exp.sessions || exp.sessions.length === 0) {
        experimentsToFix.push(exp);
        console.log(`  ❌ "${exp.title}" - OPEN but has no sessions`);
        console.log(`     Researcher ID: ${exp.researcher}`);
        console.log(`     Experiment ID: ${exp._id}`);
      }
    }

    if (experimentsToFix.length === 0) {
      console.log('\n✅ No experiments need fixing! All OPEN experiments have sessions.');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n📝 Found ${experimentsToFix.length} experiment(s) that need fixing\n`);
    console.log('─────────────────────────────────────────────────────────────');

    // Update experiments to APPROVED status
    for (const exp of experimentsToFix) {
      const oldStatus = exp.status;
      exp.status = ExperimentStatus.APPROVED;
      await exp.save();
      console.log(`✓ Updated "${exp.title}" from ${oldStatus} to ${exp.status}`);
    }

    console.log('─────────────────────────────────────────────────────────────');
    console.log(`\n✅ Successfully fixed ${experimentsToFix.length} experiment(s)`);
    console.log('\nThese experiments are now set to APPROVED status.');
    console.log('Researchers can add sessions and then set status to OPEN.\n');

  } catch (error) {
    console.error('❌ Error fixing experiments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixOpenExperimentsWithoutSessions();
