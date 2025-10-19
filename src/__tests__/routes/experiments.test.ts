import request from 'supertest';
import express from 'express';
import experimentsRouter from '../../routes/experiments';
import { ExperimentStatus, UserRole } from '../../types';
import { createTestUser, createTestExperiment, createAdminUser, generateToken } from '../utils/testHelpers';

const app = express();
app.use(express.json());
app.use('/api/experiments', experimentsRouter);

describe('Experiments Routes', () => {
  let researcherToken: string;
  let researcherId: string;
  let adminToken: string;

  beforeEach(async () => {
    const researcher = await createTestUser();
    researcherId = researcher._id.toString();
    researcherToken = generateToken(researcherId, UserRole.RESEARCHER);

    const admin = await createAdminUser();
    adminToken = generateToken(admin._id.toString(), UserRole.ADMIN);
  });

  describe('POST /api/experiments', () => {
    it('should create an experiment as researcher', async () => {
      const experimentData = {
        title: 'Memory Test',
        description: 'Testing short-term memory',
        location: 'Lab 101',
        duration: 60,
        compensation: '$20',
        maxParticipants: 25,
        requirements: ['Age 18+', 'Normal vision'],
      };

      const response = await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(experimentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(experimentData.title);
      expect(response.body.data.status).toBe(ExperimentStatus.DRAFT);
      expect(response.body.data.researcher._id).toBe(researcherId);
    });

    it('should reject experiment creation without authentication', async () => {
      const response = await request(app)
        .post('/api/experiments')
        .send({
          title: 'Test',
          description: 'Test',
          location: 'Lab',
          duration: 60,
          compensation: '$10',
          maxParticipants: 20,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject experiment creation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({
          title: 'Test',
          // missing other required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/experiments', () => {
    beforeEach(async () => {
      // Create multiple experiments with different statuses
      await createTestExperiment(researcherId, {
        title: 'Draft Exp',
        status: ExperimentStatus.DRAFT,
      });
      await createTestExperiment(researcherId, {
        title: 'Open Exp',
        status: ExperimentStatus.OPEN,
      });
      await createTestExperiment(researcherId, {
        title: 'Completed Exp',
        status: ExperimentStatus.COMPLETED,
      });
    });

    it('should return researcher experiments sorted by priority', async () => {
      const response = await request(app)
        .get('/api/experiments')
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);

      // Check priority sorting: Open should be first
      expect(response.body.data[0].status).toBe(ExperimentStatus.OPEN);
    });

    it('should filter experiments by status', async () => {
      const response = await request(app)
        .get('/api/experiments?status=draft')
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(ExperimentStatus.DRAFT);
    });
  });

  describe('PATCH /api/experiments/:id', () => {
    let experimentId: string;

    beforeEach(async () => {
      const exp = await createTestExperiment(researcherId);
      experimentId = exp._id.toString();
    });

    it('should update experiment status from draft to pending_review', async () => {
      const response = await request(app)
        .patch(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: ExperimentStatus.PENDING_REVIEW })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ExperimentStatus.PENDING_REVIEW);
    });

    it('should withdraw experiment from pending_review to draft', async () => {
      // First set to pending_review
      await request(app)
        .patch(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: ExperimentStatus.PENDING_REVIEW });

      // Then withdraw
      const response = await request(app)
        .patch(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: ExperimentStatus.DRAFT })
        .expect(200);

      expect(response.body.data.status).toBe(ExperimentStatus.DRAFT);
    });

    it('should publish approved experiment to open', async () => {
      // Set to approved
      await request(app)
        .patch(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: ExperimentStatus.APPROVED });

      // Publish to open
      const response = await request(app)
        .patch(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: ExperimentStatus.OPEN })
        .expect(200);

      expect(response.body.data.status).toBe(ExperimentStatus.OPEN);
    });

    it('should close open experiment to completed', async () => {
      // Set to open
      await request(app)
        .patch(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: ExperimentStatus.OPEN });

      // Close
      const response = await request(app)
        .patch(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: ExperimentStatus.COMPLETED })
        .expect(200);

      expect(response.body.data.status).toBe(ExperimentStatus.COMPLETED);
    });

    it('should reactivate completed experiment to draft', async () => {
      // Set to completed
      await request(app)
        .patch(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: ExperimentStatus.COMPLETED });

      // Reactivate
      const response = await request(app)
        .patch(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: ExperimentStatus.DRAFT })
        .expect(200);

      expect(response.body.data.status).toBe(ExperimentStatus.DRAFT);
    });
  });

  describe('DELETE /api/experiments/:id', () => {
    it('should delete draft experiment', async () => {
      const exp = await createTestExperiment(researcherId, {
        status: ExperimentStatus.DRAFT,
      });

      await request(app)
        .delete(`/api/experiments/${exp._id}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);
    });

    it('should not allow deleting other researcher experiment', async () => {
      const otherResearcher = await createTestUser({ email: 'other@test.com' });
      const exp = await createTestExperiment(otherResearcher._id.toString());

      await request(app)
        .delete(`/api/experiments/${exp._id}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(404);
    });
  });

  describe('Admin Routes', () => {
    let experimentId: string;

    beforeEach(async () => {
      const exp = await createTestExperiment(researcherId, {
        status: ExperimentStatus.PENDING_REVIEW,
        irbDocument: {
          filename: 'irb-test.pdf',
          originalName: 'IRB.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          uploadDate: new Date(),
        },
      });
      experimentId = exp._id.toString();
    });

    describe('GET /api/experiments/admin/pending', () => {
      it('should return pending experiments for admin', async () => {
        const response = await request(app)
          .get('/api/experiments/admin/pending')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].status).toBe(ExperimentStatus.PENDING_REVIEW);
      });

      it('should reject non-admin access', async () => {
        await request(app)
          .get('/api/experiments/admin/pending')
          .set('Authorization', `Bearer ${researcherToken}`)
          .expect(403);
      });
    });

    describe('POST /api/experiments/:id/approve', () => {
      it('should approve experiment with IRB document', async () => {
        const response = await request(app)
          .post(`/api/experiments/${experimentId}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ notes: 'Approved' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe(ExperimentStatus.APPROVED);
        expect(response.body.data.adminReview).toBeDefined();
      });

      it('should reject non-admin approval', async () => {
        await request(app)
          .post(`/api/experiments/${experimentId}/approve`)
          .set('Authorization', `Bearer ${researcherToken}`)
          .expect(403);
      });
    });

    describe('POST /api/experiments/:id/reject', () => {
      it('should reject experiment with notes', async () => {
        const response = await request(app)
          .post(`/api/experiments/${experimentId}/reject`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ notes: 'IRB needs revision' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe(ExperimentStatus.REJECTED);
        expect(response.body.data.adminReview.notes).toBe('IRB needs revision');
      });

      it('should require rejection notes', async () => {
        const response = await request(app)
          .post(`/api/experiments/${experimentId}/reject`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });
});
