import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Experiment } from '../models/Experiment';
import { ExperimentStatus } from '../types';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hsrp';

async function fixInProgressWithoutSessions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n🔍 Finding IN_PROGRESS experiments without sessions...\n');

    // Find all IN_PROGRESS experiments
    const inProgressExperiments = await Experiment.find({
      status: ExperimentStatus.IN_PROGRESS
    });

    console.log(`Found ${inProgressExperiments.length} IN_PROGRESS experiments`);

    const experimentsToFix: any[] = [];

    for (const exp of inProgressExperiments) {
      if (!exp.sessions || exp.sessions.length === 0) {
        experimentsToFix.push(exp);
        console.log(`  ❌ "${exp.title}" - IN_PROGRESS but has no sessions (WRONG!)`);
        console.log(`     Experiment ID: ${exp._id}`);
      }
    }

    if (experimentsToFix.length === 0) {
      console.log('\n✅ No experiments need fixing! All IN_PROGRESS experiments have sessions.');
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
      console.log(`✓ Fixed "${exp.title}"`);
      console.log(`  Changed from: ${oldStatus} → ${exp.status}`);
    }

    console.log('─────────────────────────────────────────────────────────────');
    console.log(`\n✅ Successfully fixed ${experimentsToFix.length} experiment(s)`);
    console.log('\nThese experiments are now set to APPROVED status.');
    console.log('Researchers must add sessions before setting status to OPEN.\n');

  } catch (error) {
    console.error('❌ Error fixing experiments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixInProgressWithoutSessions();
