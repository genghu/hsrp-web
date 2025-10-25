import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../types';
import { User } from '../models/User';
import { getCachedUser, cacheUser } from '../utils/cache';

export interface AuthRequest extends Request {
  user?: any;
  file?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Support both 'Authorization: Bearer TOKEN' and 'x-auth-token: TOKEN'
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // Try to get user from cache first (PERFORMANCE OPTIMIZATION)
    let user = await getCachedUser(decoded.id);

    if (!user) {
      // Cache miss - fetch from database
      user = await User.findById(decoded.id).select('-password').lean();
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      // Cache the user for 5 minutes
      await cacheUser(decoded.id, user, 300);
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