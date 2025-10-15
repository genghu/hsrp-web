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

// Get all researchers (for admin/public purposes)
router.get('/researchers', auth, async (req: AuthRequest, res) => {
  try {
    const researchers = await User.find({ role: UserRole.RESEARCHER })
      .select('-password');

    res.json({
      success: true,
      data: researchers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching researchers'
    });
  }
});

// Get all subjects (for researcher purposes)
router.get('/subjects', auth, checkRole([UserRole.RESEARCHER, UserRole.ADMIN]), async (req: AuthRequest, res) => {
  try {
    const subjects = await User.find({ role: UserRole.SUBJECT })
      .select('-password');

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching subjects'
    });
  }
});

export default router;
