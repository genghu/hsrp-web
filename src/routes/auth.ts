import express from 'express';
import axios from 'axios';
import { User } from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';
import { Request, Response } from 'express';
import { loginRateLimiter } from '../middleware/rateLimiter';
import jwt from 'jsonwebtoken';
import { LoginCredentials, AuthResponse, UserRole, AccountStatus } from '../types';
import { registerValidation, loginValidation } from '../middleware/validation';
import crypto from 'crypto';
import { setQRState, getQRState, deleteQRState } from '../utils/cache';
import { sanitizeUser } from '../utils/sanitizeUser';
import { getWechatConfig, getQQConfig } from '../config/oauth';

const router = express.Router();

// QR Code state is now managed in Redis/cache (PERFORMANCE OPTIMIZATION)
// No more in-memory Map - prevents memory leaks and supports horizontal scaling

// Register new user
router.post('/register', registerValidation, async (req: Request, res: Response) => {
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
    const userResponse = sanitizeUser(user);

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
router.post('/login', loginValidation, loginRateLimiter, async (req: Request, res: Response) => {
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

    // Check if account is active. Treat a MISSING accountStatus as active
    // (the User schema defaults to ACTIVE); only explicitly cancelled/suspended
    // accounts are blocked. Tolerates legacy users created without the field.
    if (user.accountStatus && user.accountStatus !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been cancelled or suspended. Please contact support.'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = sanitizeUser(user);

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
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
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

// Change current user's password (role-agnostic — any authenticated user)
router.post('/change-password', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    // Use .save() so the pre-save hook in User.ts hashes the new password.
    // (findByIdAndUpdate would skip hashing and store the plaintext password.)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error changing password' });
  }
});

// ====== WeChat OAuth Routes ======

// Generate WeChat QR code for login/registration
router.get('/wechat/qr', async (req: Request, res: Response) => {
  try {
    // Generate a unique ticket
    const ticket = crypto.randomBytes(32).toString('hex');

    const wechatConfig = getWechatConfig();

    let qrCodeUrl: string;
    if (wechatConfig) {
      const qrUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${wechatConfig.appId}&redirect_uri=${encodeURIComponent(wechatConfig.redirectUri)}&response_type=code&scope=snsapi_login&state=${ticket}#wechat_redirect`;
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`;
    } else {
      // Dev fallback: WeChat isn't configured in this environment, so render a
      // placeholder QR code that encodes the ticket only. This keeps local
      // development/demo flows working without live WeChat credentials.
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`wechat-login:${ticket}`)}`;
    }

    // Store QR code state in Redis/cache (PERFORMANCE OPTIMIZATION)
    await setQRState(ticket, {
      ticket,
      status: 'pending',
      provider: 'wechat',
      createdAt: Date.now()
    }, 300); // TTL 5 minutes

    res.json({
      success: true,
      data: {
        ticket,
        qrCodeUrl,
        expiresIn: 300 // 5 minutes
      }
    });
  } catch (error) {
    console.error('WeChat QR generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate WeChat QR code'
    });
  }
});

// Check WeChat QR code scan status
router.get('/wechat/check', async (req: Request, res: Response) => {
  try {
    const { ticket } = req.query;

    if (!ticket) {
      return res.status(400).json({
        success: false,
        error: 'Ticket is required'
      });
    }

    const state = await getQRState(ticket as string);

    if (!state) {
      // State not found or expired (TTL handled by Redis)
      return res.json({
        success: true,
        data: {
          status: 'expired'
        }
      });
    }

    if (state.status === 'scanned' && state.userData) {
      // Clean up the QR code state
      await deleteQRState(ticket as string);

      return res.json({
        success: true,
        data: {
          status: 'scanned',
          token: state.userData.token,
          user: state.userData.user
        }
      });
    }

    res.json({
      success: true,
      data: {
        status: state.status
      }
    });
  } catch (error) {
    console.error('WeChat check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check WeChat QR code status'
    });
  }
});

// WeChat OAuth callback (called by WeChat after user scans QR code)
router.get('/wechat/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid callback parameters'
      });
    }

    const wechatConfig = getWechatConfig();
    if (!wechatConfig) {
      return res.status(503).json({
        success: false,
        error: 'WeChat login is not configured on this server'
      });
    }

    // 1. Exchange code for access token
    let tokenData: { access_token?: string; openid?: string; errcode?: number; errmsg?: string };
    try {
      const tokenResponse = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
        params: {
          appid: wechatConfig.appId,
          secret: wechatConfig.appSecret,
          code,
          grant_type: 'authorization_code'
        }
      });
      tokenData = tokenResponse.data;
    } catch (err) {
      console.error('WeChat token exchange network error:', err);
      return res.status(502).json({ success: false, error: 'Failed to reach WeChat OAuth service' });
    }

    // WeChat returns HTTP 200 with an { errcode, errmsg } payload on failure.
    if (!tokenData.access_token || !tokenData.openid || tokenData.errcode) {
      console.error('WeChat token exchange error:', tokenData);
      return res.status(502).json({
        success: false,
        error: `WeChat OAuth error: ${tokenData.errmsg || 'unknown error'}`
      });
    }

    // 2. Get user info from WeChat
    let wechatUserInfo: { openid?: string; nickname?: string; headimgurl?: string; errcode?: number; errmsg?: string };
    try {
      const userInfoResponse = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
        params: {
          access_token: tokenData.access_token,
          openid: tokenData.openid
        }
      });
      wechatUserInfo = userInfoResponse.data;
    } catch (err) {
      console.error('WeChat userinfo network error:', err);
      return res.status(502).json({ success: false, error: 'Failed to reach WeChat OAuth service' });
    }

    if (!wechatUserInfo.openid || wechatUserInfo.errcode) {
      console.error('WeChat userinfo error:', wechatUserInfo);
      return res.status(502).json({
        success: false,
        error: `WeChat OAuth error: ${wechatUserInfo.errmsg || 'unknown error'}`
      });
    }

    // Find or create user based on WeChat OpenID
    let user = await User.findOne({ wechatId: wechatUserInfo.openid });

    if (!user) {
      // Create new user with WeChat info
      user = new User({
        email: `${wechatUserInfo.openid}@wechat.placeholder`, // Placeholder email
        // WeChat only provides a single nickname; the User schema requires both
        // firstName and lastName (non-empty), so use the nickname as firstName
        // and a fixed provider label as lastName.
        firstName: wechatUserInfo.nickname || 'WeChat',
        lastName: 'User',
        role: UserRole.SUBJECT,
        wechatId: wechatUserInfo.openid,
        password: crypto.randomBytes(32).toString('hex') // Random password for OAuth users
      });

      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = sanitizeUser(user);

    // Update QR code state in cache
    const qrState = await getQRState(state as string);
    if (qrState) {
      qrState.status = 'scanned';
      qrState.userData = {
        token,
        user: userResponse
      };
      await setQRState(state as string, qrState, 60); // Keep for 1 minute for polling to retrieve
    }

    // Redirect to success page or close window
    res.send(`
      <html>
        <body>
          <h2>登录成功！ / Login Successful!</h2>
          <p>您可以关闭此窗口 / You can close this window now.</p>
          <script>
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('WeChat callback error:', error);
    res.status(500).send('Login failed');
  }
});

// ====== QQ OAuth Routes ======

// Generate QQ QR code for login/registration
router.get('/qq/qr', async (req: Request, res: Response) => {
  try {
    // Generate a unique ticket
    const ticket = crypto.randomBytes(32).toString('hex');

    const qqConfig = getQQConfig();

    let qrCodeUrl: string;
    if (qqConfig) {
      const qrUrl = `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${qqConfig.appId}&redirect_uri=${encodeURIComponent(qqConfig.redirectUri)}&state=${ticket}&scope=get_user_info`;
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`;
    } else {
      // Dev fallback: QQ isn't configured in this environment, so render a
      // placeholder QR code that encodes the ticket only. This keeps local
      // development/demo flows working without live QQ credentials.
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`qq-login:${ticket}`)}`;
    }

    // Store QR code state in Redis/cache (PERFORMANCE OPTIMIZATION)
    await setQRState(ticket, {
      ticket,
      status: 'pending',
      provider: 'qq',
      createdAt: Date.now()
    }, 300); // TTL 5 minutes

    res.json({
      success: true,
      data: {
        ticket,
        qrCodeUrl,
        expiresIn: 300 // 5 minutes
      }
    });
  } catch (error) {
    console.error('QQ QR generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QQ QR code'
    });
  }
});

// Check QQ QR code scan status
router.get('/qq/check', async (req: Request, res: Response) => {
  try {
    const { ticket } = req.query;

    if (!ticket) {
      return res.status(400).json({
        success: false,
        error: 'Ticket is required'
      });
    }

    const state = await getQRState(ticket as string);

    if (!state) {
      // State not found or expired (TTL handled by Redis)
      return res.json({
        success: true,
        data: {
          status: 'expired'
        }
      });
    }

    if (state.status === 'scanned' && state.userData) {
      // Clean up the QR code state
      await deleteQRState(ticket as string);

      return res.json({
        success: true,
        data: {
          status: 'scanned',
          token: state.userData.token,
          user: state.userData.user
        }
      });
    }

    res.json({
      success: true,
      data: {
        status: state.status
      }
    });
  } catch (error) {
    console.error('QQ check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check QQ QR code status'
    });
  }
});

// QQ OAuth callback (called by QQ after user scans QR code)
router.get('/qq/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid callback parameters'
      });
    }

    const qqConfig = getQQConfig();
    if (!qqConfig) {
      return res.status(503).json({
        success: false,
        error: 'QQ login is not configured on this server'
      });
    }

    // 1. Exchange code for access token
    let tokenData: { access_token?: string; error?: number; error_description?: string };
    try {
      const tokenResponse = await axios.get('https://graph.qq.com/oauth2.0/token', {
        params: {
          grant_type: 'authorization_code',
          client_id: qqConfig.appId,
          client_secret: qqConfig.appKey,
          code,
          redirect_uri: qqConfig.redirectUri
        }
      });
      tokenData = tokenResponse.data;
    } catch (err) {
      console.error('QQ token exchange network error:', err);
      return res.status(502).json({ success: false, error: 'Failed to reach QQ OAuth service' });
    }

    // QQ returns HTTP 200 with an { error, error_description } payload on failure.
    if (!tokenData.access_token || tokenData.error) {
      console.error('QQ token exchange error:', tokenData);
      return res.status(502).json({
        success: false,
        error: `QQ OAuth error: ${tokenData.error_description || 'unknown error'}`
      });
    }

    // 2. Get OpenID
    let openIdData: { openid?: string; error?: number; error_description?: string };
    try {
      const openIdResponse = await axios.get('https://graph.qq.com/oauth2.0/me', {
        params: {
          access_token: tokenData.access_token
        }
      });
      openIdData = openIdResponse.data;
    } catch (err) {
      console.error('QQ openid network error:', err);
      return res.status(502).json({ success: false, error: 'Failed to reach QQ OAuth service' });
    }

    if (!openIdData.openid || openIdData.error) {
      console.error('QQ openid error:', openIdData);
      return res.status(502).json({
        success: false,
        error: `QQ OAuth error: ${openIdData.error_description || 'unknown error'}`
      });
    }

    // 3. Get user info
    let qqUserInfo: { nickname?: string; figureurl?: string; ret?: number; msg?: string };
    try {
      const userInfoResponse = await axios.get('https://graph.qq.com/user/get_user_info', {
        params: {
          access_token: tokenData.access_token,
          oauth_consumer_key: qqConfig.appId,
          openid: openIdData.openid
        }
      });
      qqUserInfo = userInfoResponse.data;
    } catch (err) {
      console.error('QQ userinfo network error:', err);
      return res.status(502).json({ success: false, error: 'Failed to reach QQ OAuth service' });
    }

    // QQ's user/get_user_info returns { ret, msg } where ret !== 0 indicates an error.
    if (qqUserInfo.ret) {
      console.error('QQ userinfo error:', qqUserInfo);
      return res.status(502).json({
        success: false,
        error: `QQ OAuth error: ${qqUserInfo.msg || 'unknown error'}`
      });
    }

    // Find or create user based on QQ OpenID
    let user = await User.findOne({ qqId: openIdData.openid });

    if (!user) {
      // Create new user with QQ info
      user = new User({
        email: `${openIdData.openid}@qq.placeholder`, // Placeholder email
        // QQ only provides a single nickname; the User schema requires both
        // firstName and lastName (non-empty), so use the nickname as firstName
        // and a fixed provider label as lastName.
        firstName: qqUserInfo.nickname || 'QQ',
        lastName: 'User',
        role: UserRole.SUBJECT,
        qqId: openIdData.openid,
        password: crypto.randomBytes(32).toString('hex') // Random password for OAuth users
      });

      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = sanitizeUser(user);

    // Update QR code state in cache
    const qrState = await getQRState(state as string);
    if (qrState) {
      qrState.status = 'scanned';
      qrState.userData = {
        token,
        user: userResponse
      };
      await setQRState(state as string, qrState, 60); // Keep for 1 minute for polling to retrieve
    }

    // Redirect to success page or close window
    res.send(`
      <html>
        <body>
          <h2>登录成功！ / Login Successful!</h2>
          <p>您可以关闭此窗口 / You can close this window now.</p>
          <script>
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('QQ callback error:', error);
    res.status(500).send('Login failed');
  }
});

export default router;