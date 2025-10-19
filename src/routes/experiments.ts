import express from 'express';
import { Experiment } from '../models/Experiment';
import { auth, AuthRequest } from '../middleware/auth';
import { checkRole } from '../middleware/auth';
import { ExperimentStatus, UserRole, ParticipantStatus } from '../types';
import {
  createExperimentValidation,
  updateExperimentValidation,
  createSessionValidation,
  updateSessionValidation,
  updateParticipantValidation,
  idValidation,
  sessionIdValidation,
  experimentQueryValidation
} from '../middleware/validation';
import { upload } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Get all experiments (with filters)
router.get('/', auth, experimentQueryValidation, async (req: AuthRequest, res: any) => {
  try {
    const { status, search } = req.query;
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    // If user is a subject, only show open experiments
    if (req.user?.role === UserRole.SUBJECT) {
      query.status = ExperimentStatus.OPEN;
    }

    // If user is a researcher, show only their experiments
    if (req.user?.role === UserRole.RESEARCHER) {
      query.researcher = req.user.id;
    }

    const experiments = await Experiment.find(query)
      .populate('researcher', '-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: experiments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching experiments'
    });
  }
});

// Create new experiment (researchers only)
router.post('/', auth, checkRole([UserRole.RESEARCHER]), createExperimentValidation, async (req: AuthRequest, res: any) => {
  try {
    const experiment = new Experiment({
      ...req.body,
      researcher: req.user!.id
    });

    await experiment.save();
    await experiment.populate('researcher', '-password');

    res.status(201).json({
      success: true,
      data: experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creating experiment'
    });
  }
});

// Get experiment by ID
router.get('/:id', auth, idValidation, async (req: any, res: any) => {
  try {
    const experiment = await Experiment.findById(req.params.id)
      .populate('researcher', '-password')
      .populate('sessions.participants.user', '-password');

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching experiment'
    });
  }
});

// Update experiment (researchers only)
router.patch('/:id', auth, checkRole([UserRole.RESEARCHER]), updateExperimentValidation, async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findOne({
      _id: req.params.id,
      researcher: req.user!.id
    });

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    Object.assign(experiment, req.body);
    await experiment.save();
    await experiment.populate('researcher', '-password');

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating experiment'
    });
  }
});

// Delete experiment (researchers only)
router.delete('/:id', auth, checkRole([UserRole.RESEARCHER]), idValidation, async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findOneAndDelete({
      _id: req.params.id,
      researcher: req.user!._id
    });

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    res.json({
      success: true,
      data: { message: 'Experiment deleted successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting experiment'
    });
  }
});

// Add session to experiment (researchers only)
router.post('/:id/sessions', auth, checkRole([UserRole.RESEARCHER]), createSessionValidation, async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findOne({
      _id: req.params.id,
      researcher: req.user!._id
    });

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const { startTime, endTime, maxParticipants, location, notes } = req.body;

    experiment.sessions.push({
      experiment: experiment._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      maxParticipants: maxParticipants || experiment.maxParticipants,
      location: location || experiment.location,
      participants: [],
      notes
    } as any);

    await experiment.save();
    await experiment.populate('researcher', '-password');

    res.status(201).json({
      success: true,
      data: experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error adding session'
    });
  }
});

// Update session (researchers only)
router.patch('/:id/sessions/:sessionId', auth, checkRole([UserRole.RESEARCHER]), updateSessionValidation, async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findOne({
      _id: req.params.id,
      researcher: req.user!._id
    });

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const session: any = (experiment.sessions as any).id(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    Object.assign(session, req.body);
    await experiment.save();
    await experiment.populate('researcher', '-password');

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating session'
    });
  }
});

// Delete session (researchers only)
router.delete('/:id/sessions/:sessionId', auth, checkRole([UserRole.RESEARCHER]), sessionIdValidation, async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findOne({
      _id: req.params.id,
      researcher: req.user!._id
    });

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const session: any = (experiment.sessions as any).id(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    session.deleteOne();
    await experiment.save();

    res.json({
      success: true,
      data: { message: 'Session deleted successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting session'
    });
  }
});

// Register for experiment session (subjects only)
router.post('/:id/sessions/:sessionId/register', auth, checkRole([UserRole.SUBJECT]), sessionIdValidation, async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const session: any = (experiment.sessions as any).id(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if session is full
    const activeParticipants = session.participants.filter(
      (p: any) => p.status !== ParticipantStatus.CANCELLED
    );
    if (activeParticipants.length >= session.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Session is full'
      });
    }

    // Check if user is already registered
    if (session.participants.some((p: any) => p.user.toString() === req.user!._id.toString())) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this session'
      });
    }

    session.participants.push({
      user: req.user!._id,
      status: ParticipantStatus.REGISTERED,
      signupTime: new Date()
    } as any);

    await experiment.save();
    await experiment.populate('researcher', '-password');
    await experiment.populate('sessions.participants.user', '-password');

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error registering for session'
    });
  }
});

// Cancel registration (subjects only)
router.delete('/:id/sessions/:sessionId/register', auth, checkRole([UserRole.SUBJECT]), sessionIdValidation, async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const session: any = (experiment.sessions as any).id(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const participantIndex = session.participants.findIndex(
      (p: any) => p.user.toString() === req.user!._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'Not registered for this session'
      });
    }

    session.participants[participantIndex].status = ParticipantStatus.CANCELLED;
    await experiment.save();

    res.json({
      success: true,
      data: { message: 'Registration cancelled successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error cancelling registration'
    });
  }
});

// Update participant status (researchers only)
router.patch('/:id/sessions/:sessionId/participants/:userId', auth, checkRole([UserRole.RESEARCHER]), updateParticipantValidation, async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findOne({
      _id: req.params.id,
      researcher: req.user!._id
    });

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const session: any = (experiment.sessions as any).id(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const participant = session.participants.find(
      (p: any) => p.user.toString() === req.params.userId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    if (req.body.status) {
      participant.status = req.body.status;
    }

    await experiment.save();
    await experiment.populate('sessions.participants.user', '-password');

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating participant status'
    });
  }
});

// Get subject's registered sessions
router.get('/my-sessions', auth, checkRole([UserRole.SUBJECT]), async (req: AuthRequest, res: any) => {
  try {
    const experiments = await Experiment.find({
      'sessions.participants.user': req.user!._id
    })
      .populate('researcher', '-password')
      .populate('sessions.participants.user', '-password');

    // Filter to only show sessions the user is registered for
    const userSessions = experiments.map((exp: any) => {
      const filteredSessions = exp.sessions.filter((session: any) =>
        session.participants.some((p: any) => p.user.toString() === req.user!._id.toString())
      );
      return {
        ...exp.toObject(),
        sessions: filteredSessions
      };
    });

    res.json({
      success: true,
      data: userSessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching sessions'
    });
  }
});

// ====== IRB Document Upload Routes ======

// Upload IRB document for an experiment
router.post('/:id/irb-upload', auth, checkRole([UserRole.RESEARCHER]), upload.single('irbDocument'), async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      // Clean up uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    // Check if user owns this experiment
    if (experiment.researcher.toString() !== req.user!._id.toString()) {
      // Clean up uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        success: false,
        error: 'Not authorized to upload IRB for this experiment'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Delete old IRB document if exists
    if (experiment.irbDocument?.filename) {
      const oldFilePath = path.join(process.cwd(), 'uploads', 'irb-documents', experiment.irbDocument.filename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update experiment with new IRB document info
    experiment.irbDocument = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date()
    };

    await experiment.save();

    res.json({
      success: true,
      data: {
        irbDocument: experiment.irbDocument
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('IRB upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Error uploading IRB document'
    });
  }
});

// Download IRB document
router.get('/:id/irb-download', auth, async (req: AuthRequest, res: any) => {
  try {
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    if (!experiment.irbDocument) {
      return res.status(404).json({
        success: false,
        error: 'No IRB document found for this experiment'
      });
    }

    // Only allow researcher (owner), admin, or subjects registered for the experiment to download
    const isOwner = experiment.researcher.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const isRegisteredParticipant = experiment.sessions.some((session: any) =>
      session.participants.some((p: any) => p.user.toString() === req.user!._id.toString())
    );

    if (!isOwner && !isAdmin && !isRegisteredParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to download this IRB document'
      });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'irb-documents', experiment.irbDocument.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'IRB document file not found'
      });
    }

    res.download(filePath, experiment.irbDocument.originalName);
  } catch (error) {
    console.error('IRB download error:', error);
    res.status(500).json({
      success: false,
      error: 'Error downloading IRB document'
    });
  }
});

// ====== Admin Routes ======

// Get pending experiments (admin only)
router.get('/admin/pending', auth, checkRole([UserRole.ADMIN]), async (req: AuthRequest, res: any) => {
  try {
    const experiments = await Experiment.find({ status: ExperimentStatus.PENDING_REVIEW })
      .populate('researcher', '-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: experiments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching pending experiments'
    });
  }
});

// Get all experiments for admin
router.get('/admin/all', auth, checkRole([UserRole.ADMIN]), async (req: AuthRequest, res: any) => {
  try {
    const experiments = await Experiment.find()
      .populate('researcher', '-password')
      .populate('adminReview.reviewedBy', '-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: experiments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching experiments'
    });
  }
});

// Approve experiment (admin only)
router.post('/:id/approve', auth, checkRole([UserRole.ADMIN]), async (req: AuthRequest, res: any) => {
  try {
    const { notes } = req.body;
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    // Check if experiment has IRB document
    if (!experiment.irbDocument) {
      return res.status(400).json({
        success: false,
        error: 'Experiment must have an IRB document before approval'
      });
    }

    // Update status and admin review
    experiment.status = ExperimentStatus.APPROVED;
    experiment.adminReview = {
      reviewedBy: req.user!._id,
      reviewDate: new Date(),
      notes: notes || 'Approved'
    };

    await experiment.save();
    await experiment.populate('researcher', '-password');
    await experiment.populate('adminReview.reviewedBy', '-password');

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({
      success: false,
      error: 'Error approving experiment'
    });
  }
});

// Reject experiment (admin only)
router.post('/:id/reject', auth, checkRole([UserRole.ADMIN]), async (req: AuthRequest, res: any) => {
  try {
    const { notes } = req.body;

    if (!notes || notes.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Rejection notes are required'
      });
    }

    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    // Update status and admin review
    experiment.status = ExperimentStatus.REJECTED;
    experiment.adminReview = {
      reviewedBy: req.user!._id,
      reviewDate: new Date(),
      notes
    };

    await experiment.save();
    await experiment.populate('researcher', '-password');
    await experiment.populate('adminReview.reviewedBy', '-password');

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({
      success: false,
      error: 'Error rejecting experiment'
    });
  }
});

export default router;