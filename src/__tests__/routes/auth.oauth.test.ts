import request from 'supertest';
import express from 'express';
import axios from 'axios';
import authRouter from '../../routes/auth';
import { User } from '../../models/User';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

const WECHAT_ENV_VARS = ['WECHAT_APP_ID', 'WECHAT_APP_SECRET', 'WECHAT_REDIRECT_URI'] as const;
const QQ_ENV_VARS = ['QQ_APP_ID', 'QQ_APP_KEY', 'QQ_REDIRECT_URI'] as const;

function clearEnvVars(vars: readonly string[]) {
  for (const key of vars) {
    delete process.env[key];
  }
}

describe('WeChat/QQ OAuth callback routes', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  describe('GET /api/auth/wechat/callback', () => {
    it('returns 503 and creates no User when WeChat is not configured', async () => {
      clearEnvVars(WECHAT_ENV_VARS);

      const response = await request(app)
        .get('/api/auth/wechat/callback')
        .query({ code: 'some-code', state: 'some-state' })
        .expect(503);

      expect(response.body.success).toBe(false);

      const user = await User.findOne({ wechatId: { $exists: true } });
      expect(user).toBeNull();
    });

    it('returns a success response and creates a User when configured and axios calls succeed', async () => {
      process.env.WECHAT_APP_ID = 'test-wechat-app-id';
      process.env.WECHAT_APP_SECRET = 'test-wechat-app-secret';
      process.env.WECHAT_REDIRECT_URI = 'http://localhost:3000/api/auth/wechat/callback';

      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('access_token')) {
          return Promise.resolve({
            data: {
              access_token: 'mock-wechat-access-token',
              openid: 'mock-wechat-openid'
            }
          });
        }
        if (url.includes('userinfo')) {
          return Promise.resolve({
            data: {
              openid: 'mock-wechat-openid',
              nickname: 'Mock WeChat Nick',
              headimgurl: ''
            }
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const response = await request(app)
        .get('/api/auth/wechat/callback')
        .query({ code: 'some-code', state: 'some-state' })
        .expect(200);

      expect(response.text).toContain('登录成功');

      const user = await User.findOne({ wechatId: 'mock-wechat-openid' });
      expect(user).not.toBeNull();
      expect(user!.firstName).toBe('Mock WeChat Nick');
    });
  });

  describe('GET /api/auth/wechat/qr', () => {
    it('returns configured: false when WeChat env vars are cleared', async () => {
      clearEnvVars(WECHAT_ENV_VARS);

      const response = await request(app)
        .get('/api/auth/wechat/qr')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.configured).toBe(false);
      expect(response.body.data.ticket).toBeDefined();
      expect(response.body.data.qrCodeUrl).toBeDefined();
      expect(response.body.data.expiresIn).toBe(300);
    });

    it('returns configured: true when WeChat env vars are set', async () => {
      process.env.WECHAT_APP_ID = 'test-wechat-app-id';
      process.env.WECHAT_APP_SECRET = 'test-wechat-app-secret';
      process.env.WECHAT_REDIRECT_URI = 'http://localhost:3000/api/auth/wechat/callback';

      const response = await request(app)
        .get('/api/auth/wechat/qr')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.configured).toBe(true);
      expect(response.body.data.ticket).toBeDefined();
      expect(response.body.data.qrCodeUrl).toBeDefined();
    });
  });

  describe('GET /api/auth/qq/qr', () => {
    it('returns configured: false when QQ env vars are cleared', async () => {
      clearEnvVars(QQ_ENV_VARS);

      const response = await request(app)
        .get('/api/auth/qq/qr')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.configured).toBe(false);
      expect(response.body.data.ticket).toBeDefined();
      expect(response.body.data.qrCodeUrl).toBeDefined();
      expect(response.body.data.expiresIn).toBe(300);
    });

    it('returns configured: true when QQ env vars are set', async () => {
      process.env.QQ_APP_ID = 'test-qq-app-id';
      process.env.QQ_APP_KEY = 'test-qq-app-key';
      process.env.QQ_REDIRECT_URI = 'http://localhost:3000/api/auth/qq/callback';

      const response = await request(app)
        .get('/api/auth/qq/qr')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.configured).toBe(true);
      expect(response.body.data.ticket).toBeDefined();
      expect(response.body.data.qrCodeUrl).toBeDefined();
    });
  });

  describe('GET /api/auth/qq/callback', () => {
    it('returns 503 and creates no User when QQ is not configured', async () => {
      clearEnvVars(QQ_ENV_VARS);

      const response = await request(app)
        .get('/api/auth/qq/callback')
        .query({ code: 'some-code', state: 'some-state' })
        .expect(503);

      expect(response.body.success).toBe(false);

      const user = await User.findOne({ qqId: { $exists: true } });
      expect(user).toBeNull();
    });

    it('returns a success response and creates a User when configured and axios calls succeed', async () => {
      process.env.QQ_APP_ID = 'test-qq-app-id';
      process.env.QQ_APP_KEY = 'test-qq-app-key';
      process.env.QQ_REDIRECT_URI = 'http://localhost:3000/api/auth/qq/callback';

      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('oauth2.0/token')) {
          return Promise.resolve({
            data: {
              access_token: 'mock-qq-access-token'
            }
          });
        }
        if (url.includes('oauth2.0/me')) {
          return Promise.resolve({
            data: {
              openid: 'mock-qq-openid'
            }
          });
        }
        if (url.includes('get_user_info')) {
          return Promise.resolve({
            data: {
              ret: 0,
              msg: '',
              nickname: 'Mock QQ Nick',
              figureurl: ''
            }
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const response = await request(app)
        .get('/api/auth/qq/callback')
        .query({ code: 'some-code', state: 'some-state' })
        .expect(200);

      expect(response.text).toContain('登录成功');

      const user = await User.findOne({ qqId: 'mock-qq-openid' });
      expect(user).not.toBeNull();
      expect(user!.firstName).toBe('Mock QQ Nick');
    });
  });
});
