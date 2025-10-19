import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { UserRole, ExperimentStatus, ParticipantStatus } from '../types';

// Validation result handler
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: errors.array()
    });
  }
  next();
};

// Auth validation rules
export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(Object.values(UserRole)).withMessage('Invalid role'),
  body('institution').optional().trim(),
  body('department').optional().trim(),
  validate
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Experiment validation rules
export const createExperimentValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('compensation').trim().notEmpty().withMessage('Compensation is required'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('requirements').optional().isArray(),
  body('status').optional().isIn(Object.values(ExperimentStatus)).withMessage('Invalid status'),
  body('irbDocument').optional(),
  body('adminReview').optional(),
  validate
];

export const updateExperimentValidation = [
  param('id').isMongoId().withMessage('Invalid experiment ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('compensation').optional().trim().notEmpty().withMessage('Compensation cannot be empty'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('requirements').optional().isArray(),
  body('status').optional().isIn(Object.values(ExperimentStatus)).withMessage('Invalid status'),
  body('irbDocument').optional(),
  body('adminReview').optional(),
  validate
];

// Session validation rules
export const createSessionValidation = [
  param('id').isMongoId().withMessage('Invalid experiment ID'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('notes').optional().trim(),
  validate
];

export const updateSessionValidation = [
  param('id').isMongoId().withMessage('Invalid experiment ID'),
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  body('startTime').optional().isISO8601().withMessage('Valid start time is required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time is required'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('notes').optional().trim(),
  validate
];

// Participant validation rules
export const updateParticipantValidation = [
  param('id').isMongoId().withMessage('Invalid experiment ID'),
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('status').isIn(Object.values(ParticipantStatus)).withMessage('Invalid status'),
  validate
];

// ID validation
export const idValidation = [
  param('id').isMongoId().withMessage('Invalid ID'),
  validate
];

export const sessionIdValidation = [
  param('id').isMongoId().withMessage('Invalid experiment ID'),
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  validate
];

// Query validation
export const experimentQueryValidation = [
  query('status').optional().isIn(Object.values(ExperimentStatus)).withMessage('Invalid status'),
  query('search').optional().trim(),
  validate
];
