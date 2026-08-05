import { IUser } from '../types';

/**
 * Strips the password field from a Mongoose user document/object for safe
 * inclusion in API responses.
 */
export function sanitizeUser(user: { toObject: () => any }): Omit<IUser, 'password'> {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}
