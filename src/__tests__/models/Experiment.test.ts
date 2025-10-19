import { Experiment } from '../../models/Experiment';
import { ExperimentStatus } from '../../types';
import { createTestUser } from '../utils/testHelpers';

describe('Experiment Model', () => {
  let researcherId: string;

  beforeEach(async () => {
    const researcher = await createTestUser();
    researcherId = researcher._id.toString();
  });

  describe('Experiment Creation', () => {
    it('should create an experiment successfully', async () => {
      const experimentData = {
        title: 'Memory Study',
        description: 'Testing short-term memory',
        researcher: researcherId,
        status: ExperimentStatus.DRAFT,
        location: 'Psychology Lab',
        duration: 45,
        compensation: '$15',
        maxParticipants: 30,
        requirements: ['Age 18-65', 'Normal vision'],
      };

      const experiment = new Experiment(experimentData);
      await experiment.save();

      expect(experiment.title).toBe(experimentData.title);
      expect(experiment.description).toBe(experimentData.description);
      expect(experiment.status).toBe(ExperimentStatus.DRAFT);
      expect(experiment.location).toBe(experimentData.location);
      expect(experiment.duration).toBe(experimentData.duration);
      expect(experiment.requirements).toHaveLength(2);
    });

    it('should require title', async () => {
      const experiment = new Experiment({
        description: 'Test',
        researcher: researcherId,
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
      });

      await expect(experiment.save()).rejects.toThrow();
    });

    it('should require researcher', async () => {
      const experiment = new Experiment({
        title: 'Test Experiment',
        description: 'Test',
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
      });

      await expect(experiment.save()).rejects.toThrow();
    });

    it('should default to DRAFT status', async () => {
      const experiment = new Experiment({
        title: 'Test Experiment',
        description: 'Test',
        researcher: researcherId,
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
      });

      await experiment.save();

      expect(experiment.status).toBe(ExperimentStatus.DRAFT);
    });
  });

  describe('Experiment Status Transitions', () => {
    it('should allow status change from DRAFT to PENDING_REVIEW', async () => {
      const experiment = new Experiment({
        title: 'Test',
        description: 'Test',
        researcher: researcherId,
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
        status: ExperimentStatus.DRAFT,
      });

      await experiment.save();

      experiment.status = ExperimentStatus.PENDING_REVIEW;
      await experiment.save();

      expect(experiment.status).toBe(ExperimentStatus.PENDING_REVIEW);
    });

    it('should allow status change from APPROVED to OPEN', async () => {
      const experiment = new Experiment({
        title: 'Test',
        description: 'Test',
        researcher: researcherId,
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
        status: ExperimentStatus.APPROVED,
      });

      await experiment.save();

      experiment.status = ExperimentStatus.OPEN;
      await experiment.save();

      expect(experiment.status).toBe(ExperimentStatus.OPEN);
    });
  });

  describe('Experiment Sessions', () => {
    it('should allow adding sessions', async () => {
      const experiment = new Experiment({
        title: 'Test',
        description: 'Test',
        researcher: researcherId,
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
      });

      await experiment.save();

      experiment.sessions.push({
        experiment: experiment._id,
        startTime: new Date('2024-12-20T10:00:00'),
        endTime: new Date('2024-12-20T11:00:00'),
        maxParticipants: 10,
        location: 'Room 101',
        participants: [],
      } as any);

      await experiment.save();

      expect(experiment.sessions).toHaveLength(1);
      expect(experiment.sessions[0].maxParticipants).toBe(10);
    });

    it('should initialize with empty sessions array', async () => {
      const experiment = new Experiment({
        title: 'Test',
        description: 'Test',
        researcher: researcherId,
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
      });

      await experiment.save();

      expect(experiment.sessions).toEqual([]);
    });
  });

  describe('Experiment Requirements', () => {
    it('should store multiple requirements', async () => {
      const requirements = ['Age 18+', 'No neurological disorders', 'Normal vision'];

      const experiment = new Experiment({
        title: 'Test',
        description: 'Test',
        researcher: researcherId,
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
        requirements,
      });

      await experiment.save();

      expect(experiment.requirements).toHaveLength(3);
      expect(experiment.requirements).toEqual(requirements);
    });

    it('should allow empty requirements array', async () => {
      const experiment = new Experiment({
        title: 'Test',
        description: 'Test',
        researcher: researcherId,
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
        requirements: [],
      });

      await experiment.save();

      expect(experiment.requirements).toEqual([]);
    });
  });

  describe('IRB Document', () => {
    it('should store IRB document metadata', async () => {
      const experiment = new Experiment({
        title: 'Test',
        description: 'Test',
        researcher: researcherId,
        location: 'Lab',
        duration: 60,
        compensation: '$10',
        maxParticipants: 20,
        irbDocument: {
          filename: 'irb-12345.pdf',
          originalName: 'IRB_Approval.pdf',
          mimetype: 'application/pdf',
          size: 102400,
          uploadDate: new Date(),
        },
      });

      await experiment.save();

      expect(experiment.irbDocument).toBeDefined();
      expect(experiment.irbDocument?.filename).toBe('irb-12345.pdf');
      expect(experiment.irbDocument?.originalName).toBe('IRB_Approval.pdf');
    });
  });
});
