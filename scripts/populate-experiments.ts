import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { Experiment } from '../src/models/Experiment';
import { ExperimentStatus } from '../src/types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample psychology experiments
const experiments = [
  {
    title: 'Decision-Making Under Uncertainty Study',
    description: 'This study investigates how people make decisions when faced with uncertain outcomes. Participants will complete a series of decision tasks involving risk and reward tradeoffs. We aim to understand the cognitive processes underlying decision-making in ambiguous situations.',
    location: 'Psychology Building, Room 301',
    duration: 60,
    compensation: '$15 or 1 research credit',
    requirements: [
      'Age 18-65',
      'Normal or corrected-to-normal vision',
      'Fluent in English',
      'No history of neurological disorders'
    ],
    maxParticipants: 50,
    status: ExperimentStatus.OPEN
  },
  {
    title: 'Memory and Sleep Quality Research',
    description: 'We are examining the relationship between sleep quality and memory consolidation. Participants will complete memory tasks and provide information about their sleep patterns over a one-week period. This research may help us understand how sleep affects learning and memory.',
    location: 'Cognitive Science Lab, Building A',
    duration: 90,
    compensation: '$25 or 1.5 research credits',
    requirements: [
      'Age 18-40',
      'Regular sleep schedule (no shift work)',
      'No diagnosed sleep disorders',
      'Willing to wear sleep tracker for 7 days'
    ],
    maxParticipants: 30,
    status: ExperimentStatus.OPEN
  },
  {
    title: 'Social Perception and First Impressions',
    description: 'This study explores how people form first impressions of others based on facial features and body language. Participants will view a series of photographs and videos and provide ratings on various personality dimensions.',
    location: 'Social Psychology Lab, Room 205',
    duration: 45,
    compensation: '$10 or 0.5 research credits',
    requirements: [
      'Age 18+',
      'Normal or corrected-to-normal vision',
      'No participation in similar studies within the last 6 months'
    ],
    maxParticipants: 100,
    status: ExperimentStatus.OPEN
  },
  {
    title: 'Emotional Regulation Strategies Study',
    description: 'We are investigating different strategies people use to regulate their emotions in daily life. Participants will complete questionnaires, engage in emotion-eliciting tasks, and practice various regulation techniques. This research contributes to understanding mental health and well-being.',
    location: 'Clinical Psychology Center, Room 102',
    duration: 120,
    compensation: '$30 or 2 research credits',
    requirements: [
      'Age 21-60',
      'Comfortable discussing emotions',
      'No current major depressive or anxiety disorders',
      'Not currently in psychotherapy'
    ],
    maxParticipants: 40,
    status: ExperimentStatus.IN_PROGRESS
  },
  {
    title: 'Attention and Multitasking Performance',
    description: 'This experiment examines how well people can divide their attention between multiple tasks. Participants will perform various cognitive tasks simultaneously while we measure accuracy and reaction times. The findings will help us understand the limits of human attention.',
    location: 'Cognitive Lab, Building B, Room 404',
    duration: 75,
    compensation: '$20 or 1 research credit',
    requirements: [
      'Age 18-50',
      'Normal hearing and vision',
      'No attention deficit disorders',
      'Comfortable using computers'
    ],
    maxParticipants: 60,
    status: ExperimentStatus.APPROVED
  },
  {
    title: 'Language Processing and Bilingualism',
    description: 'We are studying how bilingual individuals process language in their native and second languages. Participants will complete reading comprehension tasks and word recognition tests in both languages. This research advances our understanding of language acquisition and cognitive flexibility.',
    location: 'Linguistics Department, Room 201',
    duration: 90,
    compensation: '$25 or 1.5 research credits',
    requirements: [
      'Fluent in English and one other language',
      'Age 18-45',
      'Learned second language before age 12',
      'Use both languages regularly'
    ],
    maxParticipants: 45,
    status: ExperimentStatus.OPEN
  },
  {
    title: 'Stress Response and Coping Mechanisms',
    description: 'This study examines physiological and psychological responses to mild stressors and the effectiveness of different coping strategies. Participants will engage in mildly stressful tasks while we monitor heart rate and cortisol levels, then practice various stress-reduction techniques.',
    location: 'Health Psychology Lab, Medical Center',
    duration: 150,
    compensation: '$40 or 2.5 research credits',
    requirements: [
      'Age 21-55',
      'No cardiovascular conditions',
      'Not taking medications affecting stress hormones',
      'Available for follow-up session after 1 week'
    ],
    maxParticipants: 35,
    status: ExperimentStatus.PENDING_REVIEW
  },
  {
    title: 'Visual Perception and Pattern Recognition',
    description: 'We are investigating how the human visual system processes complex patterns and identifies objects in cluttered environments. Participants will view computer-generated images and indicate what they perceive. This basic research contributes to understanding visual cognition.',
    location: 'Vision Science Lab, Room 305',
    duration: 60,
    compensation: '$15 or 1 research credit',
    requirements: [
      'Age 18-70',
      'Normal or corrected-to-normal vision',
      'No colorblindness',
      'No history of seizures'
    ],
    maxParticipants: 80,
    status: ExperimentStatus.OPEN
  },
  {
    title: 'Moral Judgment and Ethical Decision-Making',
    description: 'This study explores how people make moral judgments in complex ethical dilemmas. Participants will read various moral scenarios and provide their judgments and reasoning. We aim to understand the cognitive and emotional factors that influence moral thinking.',
    location: 'Philosophy & Psychology Building, Room 401',
    duration: 75,
    compensation: '$20 or 1 research credit',
    requirements: [
      'Age 18+',
      'Comfortable discussing ethical issues',
      'Proficient in English',
      'No philosophy coursework in the past year'
    ],
    maxParticipants: 70,
    status: ExperimentStatus.DRAFT
  },
  {
    title: 'Music and Mood Enhancement Study',
    description: 'We are examining how different types of music affect mood, productivity, and cognitive performance. Participants will listen to various musical pieces while completing cognitive tasks and mood assessments. This research may inform therapeutic applications of music.',
    location: 'Arts & Psychology Lab, Room 110',
    duration: 90,
    compensation: '$25 or 1.5 research credits',
    requirements: [
      'Age 18-60',
      'Normal hearing',
      'Enjoy listening to music',
      'No current mood disorders'
    ],
    maxParticipants: 55,
    status: ExperimentStatus.OPEN
  },
  {
    title: 'Working Memory Training Intervention',
    description: 'This longitudinal study tests whether working memory can be improved through targeted training exercises. Participants will complete 4 weeks of daily online training (15 min/day) with pre- and post-training assessments. Compensation increases with completion rate.',
    location: 'Online + 2 in-person sessions at Psychology Dept.',
    duration: 120,
    compensation: '$100-150 based on completion (paid at end)',
    requirements: [
      'Age 18-35',
      'Computer/tablet access for daily training',
      'Committed to 4-week study period',
      'Available for 2 in-person assessment sessions'
    ],
    maxParticipants: 25,
    status: ExperimentStatus.IN_PROGRESS
  },
  {
    title: 'Group Dynamics and Team Problem-Solving',
    description: 'We investigate how groups collaborate to solve complex problems and how different personality types contribute to team success. Participants will work in small groups on problem-solving tasks. This research has implications for organizational psychology.',
    location: 'Social Science Building, Conference Room C',
    duration: 180,
    compensation: '$50 or 3 research credits',
    requirements: [
      'Age 18+',
      'Comfortable working in groups',
      'Available for full 3-hour session',
      'No previous participation in group studies this semester'
    ],
    maxParticipants: 48,
    status: ExperimentStatus.APPROVED
  }
];

async function populateExperiments() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hsrp';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the researcher
    const researcher = await User.findOne({ email: 'sir.dg@hsrp.com' });

    if (!researcher) {
      console.error('❌ Researcher not found: sir.dg@hsrp.com');
      console.log('Please create this user first or update the email in the script.');
      process.exit(1);
    }

    console.log(`\n✅ Found researcher: ${researcher.firstName} ${researcher.lastName} (${researcher.email})`);

    // Check if experiments already exist for this researcher
    const existingCount = await Experiment.countDocuments({ researcher: researcher._id });
    console.log(`\nFound ${existingCount} existing experiments for this researcher`);

    let created = 0;
    let skipped = 0;

    console.log('\nCreating psychology experiments...');
    console.log('-----------------------------------');

    // Create experiments
    for (const expData of experiments) {
      // Check if experiment with same title already exists for this researcher
      const exists = await Experiment.findOne({
        researcher: researcher._id,
        title: expData.title
      });

      if (exists) {
        console.log(`⏭️  Skipped: "${expData.title}" (already exists)`);
        skipped++;
        continue;
      }

      // Create new experiment
      const experiment = new Experiment({
        ...expData,
        researcher: researcher._id
      });

      await experiment.save();
      console.log(`✅ Created: "${expData.title}" (${expData.status})`);
      created++;
    }

    console.log('\n===================================');
    console.log('          SUMMARY');
    console.log('===================================');
    console.log(`✅ Created: ${created} new experiments`);
    console.log(`⏭️  Skipped: ${skipped} existing experiments`);
    console.log(`📊 Total experiments for ${researcher.email}: ${await Experiment.countDocuments({ researcher: researcher._id })}`);
    console.log('===================================');
    console.log('\nExperiment statuses created:');
    const statusCounts: any = {};
    for (const exp of experiments) {
      statusCounts[exp.status] = (statusCounts[exp.status] || 0) + 1;
    }
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`  - ${status}: ${count}`);
    }

  } catch (error) {
    console.error('❌ Error populating experiments:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
populateExperiments();
