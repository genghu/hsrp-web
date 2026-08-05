import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser, AccountStatus } from '../types';
import { User } from '../models/User';
import { getCachedUser, cacheUser } from '../utils/cache';


export interface AuthRequest extends Request {
  // user is the cached/lean user object (password removed)
  user?: Omit<IUser, 'password'> & { _id?: any };
  // file is added by multer for single file uploads
  file?: Express.Multer.File;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Token lookup precedence:
    //  1. Authorization header (Bearer scheme) — preferred mechanism used by all current
    //     clients (public/js/api.ts, src/public/api.ts).
    //  2. x-auth-token header — legacy fallback kept for backward compatibility with
    //     older/external clients. Do not remove without a client audit + deprecation notice.
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

    // Check if account is active. Treat a MISSING accountStatus as active,
    // because the User schema defaults to ACTIVE — only an explicitly
    // non-active value (cancelled/suspended) should block access. This also
    // tolerates legacy users created without the accountStatus field.
    if (user.accountStatus && user.accountStatus !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        error: 'Account is not active. Please contact support.'
      });
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