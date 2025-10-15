import mongoose from 'mongoose';
import { User } from '../models/User';
import { Experiment } from '../models/Experiment';

/**
 * Initialize database collections and indexes
 */
export async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Create collections if they don't exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Users collection
    if (!collectionNames.includes('users')) {
      await mongoose.connection.createCollection('users');
      console.log('✓ Created users collection');
    }

    // Experiments collection
    if (!collectionNames.includes('experiments')) {
      await mongoose.connection.createCollection('experiments');
      console.log('✓ Created experiments collection');
    }

    // Create indexes for Users
    await User.createIndexes();
    console.log('✓ Created indexes for users collection');

    // Create indexes for Experiments
    await Experiment.createIndexes();
    console.log('✓ Created indexes for experiments collection');

    // Display collection info
    const stats = await getCollectionStats();
    console.log('\n📊 Database Statistics:');
    console.log('─'.repeat(50));
    console.log(`Database: ${mongoose.connection.db.databaseName}`);
    console.log(`Collections: ${Object.keys(stats).length}`);
    console.log('─'.repeat(50));

    Object.entries(stats).forEach(([name, count]) => {
      console.log(`  ${name.padEnd(20)} ${count} documents`);
    });
    console.log('─'.repeat(50));

    console.log('\n✅ Database initialization complete!\n');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get document count for each collection
 */
async function getCollectionStats() {
  const stats: Record<string, number> = {};

  try {
    stats['users'] = await User.countDocuments();
    stats['experiments'] = await Experiment.countDocuments();
  } catch (error) {
    console.error('Error getting collection stats:', error);
  }

  return stats;
}

/**
 * Display all indexes for debugging
 */
export async function displayIndexes() {
  console.log('\n📋 Database Indexes:');
  console.log('─'.repeat(50));

  // User indexes
  const userIndexes = await User.collection.getIndexes();
  console.log('\nUsers Collection:');
  Object.entries(userIndexes).forEach(([name, index]) => {
    console.log(`  - ${name}:`, index);
  });

  // Experiment indexes
  const experimentIndexes = await Experiment.collection.getIndexes();
  console.log('\nExperiments Collection:');
  Object.entries(experimentIndexes).forEach(([name, index]) => {
    console.log(`  - ${name}:`, index);
  });

  console.log('─'.repeat(50) + '\n');
}
