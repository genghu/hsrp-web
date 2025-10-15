import express from 'express';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { LoginCredentials, AuthResponse, UserRole } from '../types';
import { registerValidation, loginValidation } from '../middleware/validation';

const router = express.Router();

// Register new user
router.post('/register', registerValidation, async (req: any, res: any) => {
  try {
    const { email, password, firstName, lastName, role, institution, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: role || UserRole.SUBJECT,
      institution,
      department
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse: any = user.toObject();
    delete userResponse.password;

    const response: AuthResponse = {
      success: true,
      data: {
        token,
        user: userResponse
      }
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creating user'
    });
  }
});

// Login user
router.post('/login', loginValidation, async (req: any, res: any) => {
  try {
    const { email, password }: LoginCredentials = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse: any = user.toObject();
    delete userResponse.password;

    const response: AuthResponse = {
      success: true,
      data: {
        token,
        user: userResponse
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error logging in'
    });
  }
});

// Get current user
router.get('/me', auth, async (req: any, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching user'
    });
  }
});

export default router;