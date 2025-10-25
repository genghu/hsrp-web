import express from 'express';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { LoginCredentials, AuthResponse, UserRole } from '../types';
import { registerValidation, loginValidation } from '../middleware/validation';
import crypto from 'crypto';
import { QRCodeState, setQRState, getQRState, deleteQRState } from '../utils/cache';

const router = express.Router();

// QR Code state is now managed in Redis/cache (PERFORMANCE OPTIMIZATION)
// No more in-memory Map - prevents memory leaks and supports horizontal scaling

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

// ====== WeChat OAuth Routes ======

// Generate WeChat QR code for login/registration
router.get('/wechat/qr', async (req: any, res: any) => {
  try {
    // Generate a unique ticket
    const ticket = crypto.randomBytes(32).toString('hex');

    // TODO: Integrate with WeChat Open Platform
    // 1. Get WeChat App ID and App Secret from environment variables
    // 2. Call WeChat API to generate QR code: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
    // 3. Use the returned code to construct QR code URL
    //
    // Example WeChat OAuth URL:
    // const wechatAppId = process.env.WECHAT_APP_ID;
    // const redirectUri = encodeURIComponent(`${process.env.APP_URL}/api/auth/wechat/callback`);
    // const state = ticket;
    // const qrUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${wechatAppId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
    // const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`;

    // For development: Generate a placeholder QR code
    const mockQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`wechat-login:${ticket}`)}`;

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
        qrCodeUrl: mockQRUrl,
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
router.get('/wechat/check', async (req: any, res: any) => {
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
router.get('/wechat/callback', async (req: any, res: any) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid callback parameters'
      });
    }

    // TODO: Integrate with WeChat Open Platform
    // 1. Exchange code for access token
    // const tokenResponse = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
    //   params: {
    //     appid: process.env.WECHAT_APP_ID,
    //     secret: process.env.WECHAT_APP_SECRET,
    //     code,
    //     grant_type: 'authorization_code'
    //   }
    // });
    //
    // 2. Get user info from WeChat
    // const userInfoResponse = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
    //   params: {
    //     access_token: tokenResponse.data.access_token,
    //     openid: tokenResponse.data.openid
    //   }
    // });
    //
    // const wechatUserInfo = userInfoResponse.data;

    // For development: Mock user data
    const mockWechatUser = {
      openid: `wx_${Date.now()}`,
      nickname: 'WeChat User',
      headimgurl: ''
    };

    // Find or create user based on WeChat OpenID
    let user = await User.findOne({ wechatId: mockWechatUser.openid });

    if (!user) {
      // Create new user with WeChat info
      user = new User({
        email: `${mockWechatUser.openid}@wechat.placeholder`, // Placeholder email
        firstName: mockWechatUser.nickname,
        lastName: '',
        role: UserRole.SUBJECT,
        wechatId: mockWechatUser.openid,
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
    const userResponse: any = user.toObject();
    delete userResponse.password;

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
router.get('/qq/qr', async (req: any, res: any) => {
  try {
    // Generate a unique ticket
    const ticket = crypto.randomBytes(32).toString('hex');

    // TODO: Integrate with QQ Connect
    // 1. Get QQ App ID and App Key from environment variables
    // 2. Call QQ Connect API to generate QR code: https://wiki.connect.qq.com/
    // 3. Use the returned code to construct QR code URL
    //
    // Example QQ OAuth URL:
    // const qqAppId = process.env.QQ_APP_ID;
    // const redirectUri = encodeURIComponent(`${process.env.APP_URL}/api/auth/qq/callback`);
    // const state = ticket;
    // const qrUrl = `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${qqAppId}&redirect_uri=${redirectUri}&state=${state}&scope=get_user_info`;
    // const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`;

    // For development: Generate a placeholder QR code
    const mockQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`qq-login:${ticket}`)}`;

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
        qrCodeUrl: mockQRUrl,
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
router.get('/qq/check', async (req: any, res: any) => {
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
router.get('/qq/callback', async (req: any, res: any) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid callback parameters'
      });
    }

    // TODO: Integrate with QQ Connect
    // 1. Exchange code for access token
    // const tokenResponse = await axios.get('https://graph.qq.com/oauth2.0/token', {
    //   params: {
    //     grant_type: 'authorization_code',
    //     client_id: process.env.QQ_APP_ID,
    //     client_secret: process.env.QQ_APP_KEY,
    //     code,
    //     redirect_uri: `${process.env.APP_URL}/api/auth/qq/callback`
    //   }
    // });
    //
    // 2. Get OpenID
    // const openIdResponse = await axios.get('https://graph.qq.com/oauth2.0/me', {
    //   params: {
    //     access_token: tokenResponse.data.access_token
    //   }
    // });
    //
    // 3. Get user info
    // const userInfoResponse = await axios.get('https://graph.qq.com/user/get_user_info', {
    //   params: {
    //     access_token: tokenResponse.data.access_token,
    //     oauth_consumer_key: process.env.QQ_APP_ID,
    //     openid: openIdResponse.data.openid
    //   }
    // });

    // For development: Mock user data
    const mockQQUser = {
      openid: `qq_${Date.now()}`,
      nickname: 'QQ User',
      figureurl: ''
    };

    // Find or create user based on QQ OpenID
    let user = await User.findOne({ qqId: mockQQUser.openid });

    if (!user) {
      // Create new user with QQ info
      user = new User({
        email: `${mockQQUser.openid}@qq.placeholder`, // Placeholder email
        firstName: mockQQUser.nickname,
        lastName: '',
        role: UserRole.SUBJECT,
        qqId: mockQQUser.openid,
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
    const userResponse: any = user.toObject();
    delete userResponse.password;

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