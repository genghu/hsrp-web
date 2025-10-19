import { User } from '../../models/User';
import { UserRole } from '../../types';

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a researcher user successfully', async () => {
      const userData = {
        email: 'researcher@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.RESEARCHER,
        institution: 'Test University',
        department: 'Computer Science',
      };

      const user = new User(userData);
      await user.save();

      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(UserRole.RESEARCHER);
      expect(user.institution).toBe(userData.institution);
      expect(user.department).toBe(userData.department);
    });

    it('should create a subject user successfully', async () => {
      const userData = {
        email: 'subject@test.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.SUBJECT,
      };

      const user = new User(userData);
      await user.save();

      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(UserRole.SUBJECT);
      expect(user.institution).toBeUndefined();
    });

    it('should hash password before saving', async () => {
      const plainPassword = 'password123';
      const user = new User({
        email: 'test@test.com',
        password: plainPassword,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.RESEARCHER,
        institution: 'Test Uni',
        department: 'CS',
      });

      await user.save();

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    it('should require email', async () => {
      const user = new User({
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.RESEARCHER,
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require unique email', async () => {
      const email = 'duplicate@test.com';

      const user1 = new User({
        email,
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
        role: UserRole.RESEARCHER,
        institution: 'Test',
        department: 'CS',
      });
      await user1.save();

      const user2 = new User({
        email,
        password: 'password456',
        firstName: 'User',
        lastName: 'Two',
        role: UserRole.RESEARCHER,
        institution: 'Test',
        department: 'CS',
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('Password Comparison', () => {
    it('should correctly compare valid password', async () => {
      const plainPassword = 'password123';
      const user = new User({
        email: 'test@test.com',
        password: plainPassword,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.RESEARCHER,
        institution: 'Test',
        department: 'CS',
      });

      await user.save();

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject invalid password', async () => {
      const user = new User({
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.RESEARCHER,
        institution: 'Test',
        department: 'CS',
      });

      await user.save();

      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('User Roles', () => {
    it('should default to SUBJECT role', async () => {
      const user = new User({
        email: 'default@test.com',
        password: 'password123',
        firstName: 'Default',
        lastName: 'User',
      });

      await user.save();

      expect(user.role).toBe(UserRole.SUBJECT);
    });

    it('should accept ADMIN role', async () => {
      const user = new User({
        email: 'admin@test.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      });

      await user.save();

      expect(user.role).toBe(UserRole.ADMIN);
    });
  });
});
