import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../types';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Support both 'Authorization: Bearer TOKEN' and 'x-auth-token: TOKEN'
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // Fetch user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Please authenticate' });
  }
};

export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Please authenticate' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    next();
  };
};