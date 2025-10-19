import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { Experiment } from '../../models/Experiment';
import { UserRole, ExperimentStatus } from '../../types';

// Generate test JWT token
export const generateToken = (userId: string, role: UserRole = UserRole.RESEARCHER): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Create test user
export const createTestUser = async (overrides: any = {}) => {
  const defaultUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.RESEARCHER,
    institution: 'Test University',
    department: 'Computer Science',
  };

  const user = new User({ ...defaultUser, ...overrides });
  await user.save();
  return user;
};

// Create test experiment
export const createTestExperiment = async (researcherId: string, overrides: any = {}) => {
  const defaultExperiment = {
    title: 'Test Experiment',
    description: 'Test Description',
    researcher: researcherId,
    status: ExperimentStatus.DRAFT,
    location: 'Test Lab',
    duration: 60,
    compensation: '$10',
    maxParticipants: 20,
    requirements: ['Age 18+'],
  };

  const experiment = new Experiment({ ...defaultExperiment, ...overrides });
  await experiment.save();
  return experiment;
};

// Create admin user
export const createAdminUser = async () => {
  return createTestUser({
    email: 'admin@test.com',
    role: UserRole.ADMIN,
  });
};

// Create subject user
export const createSubjectUser = async () => {
  return createTestUser({
    email: 'subject@test.com',
    role: UserRole.SUBJECT,
    institution: undefined,
    department: undefined,
  });
};

// Mock Express Request
export const mockRequest = (options: any = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...options,
  };
};

// Mock Express Response
export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Express Next
export const mockNext = jest.fn();
