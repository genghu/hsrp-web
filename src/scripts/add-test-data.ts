import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Experiment } from '../models/Experiment';
import { UserRole, ExperimentStatus } from '../types';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hsrp';

async function addTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing test data
    console.log('\n🧹 Cleaning up existing test data...');
    await User.deleteMany({ email: { $regex: /test/ } });
    await Experiment.deleteMany({ title: { $regex: /Test Experiment/ } });

    // Create test users
    console.log('\n👥 Creating test users...');

    // Note: Don't hash the password manually - the User model's pre-save hook will hash it
    const researcher = await User.create({
      email: 'researcher-test@example.com',
      password: 'password123',
      role: UserRole.RESEARCHER,
      firstName: 'Test',
      lastName: 'Researcher',
      institution: 'Test University',
      department: 'Psychology'
    });
    console.log('✓ Created researcher:', researcher.email);

    const subject = await User.create({
      email: 'subject-test@example.com',
      password: 'password123',
      role: UserRole.SUBJECT,
      firstName: 'Test',
      lastName: 'Subject',
      institution: 'Test University',
      department: 'Student'
    });
    console.log('✓ Created subject:', subject.email);

    // Create test experiments with various scenarios
    console.log('\n🔬 Creating test experiments...');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Scenario 1: OPEN experiment with future sessions (SHOULD BE VISIBLE)
    const exp1 = new Experiment({
      title: 'Test Experiment 1: OPEN with Future Sessions',
      description: 'This experiment is OPEN and has future sessions with available spots. SHOULD BE VISIBLE to subjects.',
      researcher: researcher._id,
      status: ExperimentStatus.OPEN,
      location: 'Room 101',
      duration: 60,
      compensation: '$20',
      requirements: ['18+ years old', 'Native English speaker'],
      maxParticipants: 10,
      sessions: []
    });
    await exp1.save();
    exp1.sessions.push(
      {
        experiment: exp1._id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        location: 'Room 101',
        maxParticipants: 5,
        participants: []
      } as any,
      {
        experiment: exp1._id,
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 60 * 60 * 1000),
        location: 'Room 101',
        maxParticipants: 10,
        participants: []
      } as any
    );
    await exp1.save();
    console.log('✓ Scenario 1: OPEN with future sessions -', exp1.title);

    // Scenario 2: OPEN experiment with only past sessions (SHOULD NOT BE VISIBLE)
    const exp2 = new Experiment({
      title: 'Test Experiment 2: OPEN with Past Sessions Only',
      description: 'This experiment is OPEN but all sessions are in the past. SHOULD NOT BE VISIBLE to subjects.',
      researcher: researcher._id,
      status: ExperimentStatus.OPEN,
      location: 'Room 102',
      duration: 45,
      compensation: '$15',
      requirements: [],
      maxParticipants: 5,
      sessions: []
    });
    await exp2.save();
    exp2.sessions.push({
      experiment: exp2._id,
      startTime: yesterday,
      endTime: new Date(yesterday.getTime() + 45 * 60 * 1000),
      location: 'Room 102',
      maxParticipants: 5,
      participants: []
    } as any);
    await exp2.save();
    console.log('✓ Scenario 2: OPEN with past sessions only -', exp2.title);

    // Scenario 3: APPROVED but not OPEN (SHOULD NOT BE VISIBLE)
    const exp3 = new Experiment({
      title: 'Test Experiment 3: APPROVED but Not Published',
      description: 'This experiment is APPROVED but not published (not OPEN). SHOULD NOT BE VISIBLE to subjects.',
      researcher: researcher._id,
      status: ExperimentStatus.APPROVED,
      location: 'Room 103',
      duration: 30,
      compensation: '$10',
      requirements: [],
      maxParticipants: 8,
      sessions: []
    });
    await exp3.save();
    exp3.sessions.push({
      experiment: exp3._id,
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 30 * 60 * 1000),
      location: 'Room 103',
      maxParticipants: 8,
      participants: []
    } as any);
    await exp3.save();
    console.log('✓ Scenario 3: APPROVED but not OPEN -', exp3.title);

    // Scenario 4: OPEN with full sessions (SHOULD NOT BE VISIBLE)
    const exp4 = new Experiment({
      title: 'Test Experiment 4: OPEN with Full Sessions',
      description: 'This experiment is OPEN but all sessions are full. SHOULD NOT BE VISIBLE to subjects.',
      researcher: researcher._id,
      status: ExperimentStatus.OPEN,
      location: 'Room 104',
      duration: 90,
      compensation: '$30',
      requirements: [],
      maxParticipants: 2,
      sessions: []
    });
    await exp4.save();
    exp4.sessions.push({
      experiment: exp4._id,
      startTime: nextMonth,
      endTime: new Date(nextMonth.getTime() + 90 * 60 * 1000),
      location: 'Room 104',
      maxParticipants: 2,
      participants: [
        { user: subject._id, status: 'registered', signupTime: now },
        { user: researcher._id, status: 'registered', signupTime: now }
      ]
    } as any);
    await exp4.save();
    console.log('✓ Scenario 4: OPEN with full sessions -', exp4.title);

    // Scenario 5: OPEN with mixed sessions (SHOULD BE VISIBLE, showing only available future sessions)
    const exp5 = new Experiment({
      title: 'Test Experiment 5: OPEN with Mixed Sessions',
      description: 'This experiment is OPEN with past, full, and available sessions. SHOULD BE VISIBLE showing only available future sessions.',
      researcher: researcher._id,
      status: ExperimentStatus.OPEN,
      location: 'Room 105',
      duration: 60,
      compensation: '$25',
      requirements: ['Must have participated in previous study'],
      maxParticipants: 10,
      sessions: []
    });
    await exp5.save();
    exp5.sessions.push(
      // Past session - should not show
      {
        experiment: exp5._id,
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 60 * 60 * 1000),
        location: 'Room 105',
        maxParticipants: 5,
        participants: []
      } as any,
      // Full session - should not show
      {
        experiment: exp5._id,
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 60 * 60 * 1000),
        location: 'Room 105',
        maxParticipants: 1,
        participants: [
          { user: subject._id, status: 'registered', signupTime: now }
        ]
      } as any,
      // Available session - SHOULD SHOW
      {
        experiment: exp5._id,
        startTime: nextMonth,
        endTime: new Date(nextMonth.getTime() + 60 * 60 * 1000),
        location: 'Room 105',
        maxParticipants: 10,
        participants: []
      } as any
    );
    await exp5.save();
    console.log('✓ Scenario 5: OPEN with mixed sessions -', exp5.title);

    // Scenario 6: OPEN with cancelled participants (SHOULD BE VISIBLE)
    const exp6 = new Experiment({
      title: 'Test Experiment 6: OPEN with Cancelled Participants',
      description: 'This experiment has cancelled participants, so spots are available. SHOULD BE VISIBLE to subjects.',
      researcher: researcher._id,
      status: ExperimentStatus.OPEN,
      location: 'Room 106',
      duration: 45,
      compensation: '$18',
      requirements: [],
      maxParticipants: 3,
      sessions: []
    });
    await exp6.save();
    exp6.sessions.push({
      experiment: exp6._id,
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 45 * 60 * 1000),
      location: 'Room 106',
      maxParticipants: 3,
      participants: [
        { user: subject._id, status: 'cancelled', signupTime: now },
        { user: researcher._id, status: 'registered', signupTime: now }
        // 1 spot still available (cancelled don't count)
      ]
    } as any);
    await exp6.save();
    console.log('✓ Scenario 6: OPEN with cancelled participants -', exp6.title);

    console.log('\n✅ Test data created successfully!');
    console.log('\n📋 Summary:');
    console.log('-------------------------------------------');
    console.log('Test Credentials:');
    console.log('  Researcher: researcher-test@example.com / password123');
    console.log('  Subject:    subject-test@example.com / password123');
    console.log('\nExpected Results for Subject Dashboard:');
    console.log('  ✓ SHOULD SEE:');
    console.log('    - Test Experiment 1: OPEN with Future Sessions');
    console.log('    - Test Experiment 5: OPEN with Mixed Sessions (1 session only)');
    console.log('    - Test Experiment 6: OPEN with Cancelled Participants');
    console.log('\n  ✗ SHOULD NOT SEE:');
    console.log('    - Test Experiment 2: OPEN with Past Sessions Only');
    console.log('    - Test Experiment 3: APPROVED but Not Published');
    console.log('    - Test Experiment 4: OPEN with Full Sessions');
    console.log('-------------------------------------------');

  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

addTestData();
