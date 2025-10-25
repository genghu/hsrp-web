import express from 'express';
import { User } from '../models/User';
import { auth, AuthRequest, checkRole } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// Get user profile
router.get('/me', auth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching user profile'
    });
  }
});

// Update user profile
router.put('/me', auth, async (req: AuthRequest, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'institution', 'department'];
    const updates: any = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating user profile'
    });
  }
});

// Get all researchers (for admin/public purposes) - PERFORMANCE: Added pagination
router.get('/researchers', auth, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [researchers, total] = await Promise.all([
      User.find({ role: UserRole.RESEARCHER })
          .select('-password')
          .skip(skip)
          .limit(limit)
          .lean(), // Use lean() for better performance
      User.countDocuments({ role: UserRole.RESEARCHER })
    ]);

    res.json({
      success: true,
      data: researchers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching researchers'
    });
  }
});

// Get all subjects (for researcher purposes) - PERFORMANCE: Added pagination
router.get('/subjects', auth, checkRole([UserRole.RESEARCHER, UserRole.ADMIN]), async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      User.find({ role: UserRole.SUBJECT })
          .select('-password')
          .skip(skip)
          .limit(limit)
          .lean(), // Use lean() for better performance
      User.countDocuments({ role: UserRole.SUBJECT })
    ]);

    res.json({
      success: true,
      data: subjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching subjects'
    });
  }
});

export default router;
