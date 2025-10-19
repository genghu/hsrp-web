# HSRP - Human Subject Recruitment Platform | 人类受试者招募平台

**English** | **中文**

A comprehensive web application for managing research experiments and connecting researchers with human subjects (participants).

一个综合性的 Web 应用程序，用于管理研究实验并连接研究人员与人类受试者（参与者）。

---

## Features | 功能特性

### For Researchers | 研究人员功能

**English:**
- **Experiment Lifecycle Management**
  - Create experiments with requirements and details
  - Upload IRB (Institutional Review Board) approval documents
  - Submit experiments for admin review
  - Withdraw submissions before approval
  - Edit rejected experiments
  - Publish approved experiments (requires at least one session)
  - Close active experiments
  - Reactivate completed experiments
- **Session Management**
  - Schedule multiple experiment sessions
  - Edit session details (time, location, max participants)
  - View and manage participant registrations
- **Participant Tracking**
  - Manage participant status (registered, confirmed, attended, no-show, cancelled)
  - View participant details and contact information
  - Track participation across sessions
- **UI Features**
  - Collapsible experiment cards for easy navigation
  - Priority-based sorting (active experiments first)
  - Status-specific action buttons
  - Real-time experiment creation date display

**中文:**
- **实验生命周期管理**
  - 创建包含要求和详情的实验
  - 上传IRB（机构审查委员会）批准文件
  - 提交实验供管理员审查
  - 在批准前撤回提交
  - 编辑被拒绝的实验
  - 发布已批准的实验（至少需要一个会话）
  - 关闭活动实验
  - 重新激活已完成的实验
- **会话管理**
  - 安排多个实验会话
  - 编辑会话详情（时间、地点、最大参与者数）
  - 查看和管理参与者注册
- **参与者跟踪**
  - 管理参与者状态（已注册、已确认、已参加、缺席、已取消）
  - 查看参与者详细信息和联系方式
  - 跨会话追踪参与情况
- **界面功能**
  - 可折叠的实验卡片，便于导航
  - 基于优先级的排序（活动实验优先）
  - 状态特定的操作按钮
  - 实时显示实验创建日期

### For Admins | 管理员功能

**English:**
- **Review and Approval Workflow**
  - View all pending experiments submitted for review
  - Review experiment details and participant requirements
  - Download and verify IRB (Institutional Review Board) documents
  - Approve experiments with optional notes
  - Reject experiments with required explanatory notes
  - Track review history and decisions
- **System Oversight**
  - View all experiments across all researchers
  - Monitor experiment statuses and progress
  - Access comprehensive experiment data for compliance

**中文:**
- **审查和批准工作流**
  - 查看所有提交审查的待处理实验
  - 审查实验详情和参与者要求
  - 下载并验证IRB（机构审查委员会）文件
  - 批准实验并可添加备注
  - 拒绝实验并必须提供说明性备注
  - 追踪审查历史和决定
- **系统监督**
  - 查看所有研究人员的所有实验
  - 监控实验状态和进展
  - 访问全面的实验数据以保证合规性

### For Participants (Subjects) | 参与者（受试者）功能

**English:**
- Browse available experiments
- View experiment details and requirements
- Register for experiment sessions
- View registered sessions
- Cancel registrations
- Track participation history

**中文:**
- 浏览可用的实验
- 查看实验详情和要求
- 注册实验会话
- 查看已注册的会话
- 取消注册
- 追踪参与历史

### General Features | 通用功能

**English:**
- Secure user authentication with JWT
- Role-based access control (Researcher, Subject, Admin)
- Real-time session availability tracking
- Responsive web interface
- Bilingual support (English/Chinese)
- RESTful API architecture
- MongoDB database for data persistence

**中文:**
- 基于 JWT 的安全用户认证
- 基于角色的访问控制（研究员、受试者、管理员）
- 实时会话可用性跟踪
- 响应式 Web 界面
- 双语支持（英文/中文）
- RESTful API 架构
- MongoDB 数据库持久化存储

---

## Tech Stack | 技术栈

### Backend | 后端

**English:**
- **Node.js** with **TypeScript** - Runtime and language
- **Express.js** - Web framework
- **MongoDB** with **Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging

**中文:**
- **Node.js** 与 **TypeScript** - 运行时和语言
- **Express.js** - Web 框架
- **MongoDB** 与 **Mongoose** - 数据库和 ODM
- **JWT** - 身份验证
- **bcryptjs** - 密码哈希
- **express-validator** - 输入验证
- **Helmet** - 安全头部
- **CORS** - 跨域资源共享
- **Morgan** - HTTP 请求日志

### Frontend | 前端

**English:**
- **HTML5** - Structure
- **CSS3** - Styling with CSS variables
- **TypeScript** - Type-safe client-side logic
- **Fetch API** - HTTP requests

**中文:**
- **HTML5** - 结构
- **CSS3** - 使用 CSS 变量的样式
- **TypeScript** - 类型安全的客户端逻辑
- **Fetch API** - HTTP 请求

---

## Installation | 安装

### Prerequisites | 前置要求

**English:**
- Node.js 18+ and npm
- MongoDB 7+ (local or MongoDB Atlas)

**中文:**
- Node.js 18+ 和 npm
- MongoDB 7+（本地或 MongoDB Atlas）

---

## Local Development Setup | 本地开发环境设置

### 1. Clone the repository | 克隆仓库

```bash
git clone <repository-url>
cd hsrp-web
```

### 2. Install dependencies | 安装依赖

```bash
npm install
```

### 3. Configure environment variables | 配置环境变量

```bash
cp .env.example .env
```

**English:** Edit `.env` with your configuration:

**中文:** 编辑 `.env` 文件进行配置：

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hsrp
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Start MongoDB | 启动 MongoDB

**English:** If running locally:

**中文:** 如果在本地运行：

```bash
mongod
```

**English:** Or use MongoDB Atlas cloud connection string in `.env`

**中文:** 或在 `.env` 中使用 MongoDB Atlas 云连接字符串

### 5. Run the development server | 运行开发服务器

```bash
npm run dev
```

**English:** The application will be available at `http://localhost:3000`

**中文:** 应用程序将在 `http://localhost:3000` 可用

### 6. Build and run for production | 构建并运行生产版本

**English:** Option 1: Build then start (automatic)

**中文:** 选项 1：构建后启动（自动）

```bash
npm start
```

**English:** Option 2: Build separately

**中文:** 选项 2：分别构建

```bash
npm run build
npm start
```

---

## Docker Deployment | Docker 部署

### Using Docker Compose (Recommended) | 使用 Docker Compose（推荐）

**1. Build and run with Docker Compose | 使用 Docker Compose 构建和运行**

```bash
docker-compose up -d
```

**English:** This will start:
- Application server on port 3000
- MongoDB on port 27017

**中文:** 这将启动：
- 应用服务器在端口 3000
- MongoDB 在端口 27017

**2. View logs | 查看日志**

```bash
docker-compose logs -f
```

**3. Stop services | 停止服务**

```bash
docker-compose down
```

**4. Remove volumes (WARNING: This deletes all data) | 删除卷（警告：这将删除所有数据）**

```bash
docker-compose down -v
```

### Using Docker Only | 仅使用 Docker

**1. Build the image | 构建镜像**

```bash
docker build -t hsrp-web .
```

**2. Run the container | 运行容器**

```bash
docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://your-mongodb-host:27017/hsrp \
  -e JWT_SECRET=your-secret-key \
  --name hsrp-app \
  hsrp-web
```

---

## Cloud Deployment | 云部署

### Deploy to AWS EC2, DigitalOcean, or any VPS | 部署到 AWS EC2、DigitalOcean 或任何 VPS

**1. SSH into your server | SSH 连接到服务器**

```bash
ssh user@your-server-ip
```

**2. Install Docker and Docker Compose | 安装 Docker 和 Docker Compose**

**English:** For Ubuntu:

**中文:** Ubuntu 系统：

```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
```

**3. Clone and configure | 克隆和配置**

```bash
git clone <repository-url>
cd hsrp-web
nano .env  # Configure your environment variables | 配置环境变量
```

**4. Start with Docker Compose | 使用 Docker Compose 启动**

```bash
sudo docker-compose up -d
```

**5. Set up reverse proxy (Optional but recommended) | 设置反向代理（可选但推荐）**

**English:** Use Nginx or Caddy to handle SSL/TLS:

**中文:** 使用 Nginx 或 Caddy 处理 SSL/TLS：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Deploy to Heroku | 部署到 Heroku

**1. Install Heroku CLI | 安装 Heroku CLI**

```bash
npm install -g heroku
```

**2. Login to Heroku | 登录 Heroku**

```bash
heroku login
```

**3. Create a new app | 创建新应用**

```bash
heroku create your-app-name
```

**4. Set environment variables | 设置环境变量**

```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
```

**5. Deploy | 部署**

```bash
git push heroku main
```

---

### Deploy to Railway, Render, or Fly.io | 部署到 Railway、Render 或 Fly.io

**English:** These platforms support Docker deployments:
1. Connect your GitHub repository
2. Configure environment variables in the platform dashboard
3. The platform will automatically detect `Dockerfile` and build/deploy

**中文:** 这些平台支持 Docker 部署：
1. 连接您的 GitHub 仓库
2. 在平台控制面板中配置环境变量
3. 平台将自动检测 `Dockerfile` 并构建/部署

---

## API Documentation | API 文档

### Authentication Endpoints | 身份验证接口

#### Register User | 注册用户

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "subject|researcher",
  "institution": "University Name",  // Optional, for researchers | 可选，研究员需要
  "department": "Psychology"         // Optional, for researchers | 可选，研究员需要
}
```

#### Login | 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User | 获取当前用户

```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### Experiment Endpoints | 实验接口

#### List Experiments | 列出实验

```http
GET /api/experiments?status=open&search=memory
Authorization: Bearer <token>
```

#### Create Experiment (Researcher only) | 创建实验（仅研究员）

```http
POST /api/experiments
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Memory Study",
  "description": "Testing short-term memory",
  "location": "Psychology Building, Room 301",
  "duration": 60,
  "compensation": "$20 or 2 credits",
  "maxParticipants": 5,
  "requirements": ["18+ years old", "Native English speaker"]
  // Note: status defaults to "draft" on creation
  // Workflow: draft → pending_review → approved → open → in_progress → completed
}
```

#### Upload IRB Document (Researcher only) | 上传IRB文件（仅研究员）

```http
POST /api/experiments/:id/irb
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "irbDocument": <file>  // PDF or DOC file required for submission | 提交审查需要 PDF 或 DOC 文件
}
```

#### Get Experiment Details | 获取实验详情

```http
GET /api/experiments/:id
Authorization: Bearer <token>
```

#### Update Experiment (Researcher only) | 更新实验（仅研究员）

```http
PATCH /api/experiments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "open",
  "compensation": "$25"
}
```

#### Delete Experiment (Researcher only) | 删除实验（仅研究员）

```http
DELETE /api/experiments/:id
Authorization: Bearer <token>
```

---

### Session Endpoints | 会话接口

#### Add Session (Researcher only) | 添加会话（仅研究员）

```http
POST /api/experiments/:id/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "startTime": "2024-12-01T10:00:00Z",
  "endTime": "2024-12-01T11:00:00Z",
  "location": "Room 301",
  "maxParticipants": 5,
  "notes": "Please arrive 10 minutes early"
}
```

#### Update Session (Researcher only) | 更新会话（仅研究员）

```http
PATCH /api/experiments/:id/sessions/:sessionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "startTime": "2024-12-01T14:00:00Z",
  "location": "Room 302",
  "maxParticipants": 8
}
```

#### Delete Session (Researcher only) | 删除会话（仅研究员）

```http
DELETE /api/experiments/:id/sessions/:sessionId
Authorization: Bearer <token>
```

#### Register for Session (Subject only) | 注册会话（仅受试者）

```http
POST /api/experiments/:id/sessions/:sessionId/register
Authorization: Bearer <token>
```

#### Cancel Registration (Subject only) | 取消注册（仅受试者）

```http
DELETE /api/experiments/:id/sessions/:sessionId/register
Authorization: Bearer <token>
```

#### Update Participant Status (Researcher only) | 更新参与者状态（仅研究员）

```http
PATCH /api/experiments/:id/sessions/:sessionId/participants/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed|attended|no_show|cancelled"
}
```

#### Get My Sessions (Subject only) | 获取我的会话（仅受试者）

```http
GET /api/experiments/my-sessions
Authorization: Bearer <token>
```

---

### Admin Endpoints | 管理员接口

#### Get Pending Experiments (Admin only) | 获取待审查实验（仅管理员）

```http
GET /api/experiments/admin/pending
Authorization: Bearer <token>
```

#### Get All Experiments (Admin only) | 获取所有实验（仅管理员）

```http
GET /api/experiments/admin/all
Authorization: Bearer <token>
```

#### Approve Experiment (Admin only) | 批准实验（仅管理员）

```http
POST /api/experiments/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Approved with recommendations for participant screening"  // Optional | 可选
}
```

#### Reject Experiment (Admin only) | 拒绝实验（仅管理员）

```http
POST /api/experiments/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "IRB document needs revision - please update consent form"  // Required | 必需
}
```

#### Download IRB Document (Admin only) | 下载IRB文件（仅管理员）

```http
GET /api/experiments/:id/irb
Authorization: Bearer <token>
```

---

## Database Schema | 数据库架构

### User Schema | 用户架构

```typescript
{
  email: string (unique, lowercase)
  password: string (hashed)
  firstName: string
  lastName: string
  role: 'researcher' | 'subject' | 'admin'
  institution?: string
  department?: string
  createdAt: Date
  updatedAt: Date
}
```

### Experiment Schema | 实验架构

```typescript
{
  title: string
  description: string
  researcher: ObjectId (ref: User)
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'open' | 'in_progress' | 'completed' | 'cancelled'
  location: string
  duration: number (minutes | 分钟)
  compensation: string
  requirements: string[]
  maxParticipants: number
  sessions: Session[]
  irbDocument?: {
    filename: string
    originalName: string
    mimetype: string
    size: number
    uploadDate: Date
  }
  adminReview?: {
    reviewedBy: ObjectId (ref: User)
    reviewedAt: Date
    decision: 'approved' | 'rejected'
    notes?: string
  }
  createdAt: Date
  updatedAt: Date
}
```

**Experiment Status Workflow | 实验状态工作流:**

**English:**
1. **draft** - Initial creation state, researcher can edit freely
2. **pending_review** - Submitted for admin review, requires IRB document
3. **approved** - Approved by admin, researcher can add sessions and publish
4. **rejected** - Rejected by admin with notes, returns to draft for revision
5. **open** - Published and open for participant recruitment
6. **in_progress** - Currently running with active sessions
7. **completed** - Finished, can be reactivated to draft
8. **cancelled** - Cancelled by researcher or admin

**中文:**
1. **draft（草稿）** - 初始创建状态，研究人员可自由编辑
2. **pending_review（待审查）** - 提交供管理员审查，需要IRB文件
3. **approved（已批准）** - 管理员批准，研究人员可添加会话并发布
4. **rejected（已拒绝）** - 管理员拒绝并附说明，返回草稿状态修订
5. **open（开放）** - 已发布并开放参与者招募
6. **in_progress（进行中）** - 当前运行，有活动会话
7. **completed（已完成）** - 已结束，可重新激活为草稿
8. **cancelled（已取消）** - 被研究人员或管理员取消

### Session Schema (Subdocument) | 会话架构（子文档）

```typescript
{
  _id: ObjectId
  experiment: ObjectId (ref: Experiment)
  startTime: Date
  endTime: Date
  maxParticipants: number
  location: string
  notes?: string
  participants: [{
    user: ObjectId (ref: User)
    status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled'
    signupTime: Date
  }]
}
```

---

## Project Structure | 项目结构

```
hsrp-web/
├── src/
│   ├── index.ts              # Application entry point | 应用程序入口
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions | TypeScript 类型定义
│   ├── models/
│   │   ├── User.ts           # User model | 用户模型
│   │   └── Experiment.ts     # Experiment model | 实验模型
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware | 身份验证中间件
│   │   └── validation.ts     # Input validation rules | 输入验证规则
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes | 身份验证路由
│   │   ├── experiments.ts    # Experiment routes | 实验路由
│   │   └── users.ts          # User routes | 用户路由
│   ├── __tests__/            # Test files | 测试文件
│   │   ├── setup.ts          # Test environment setup | 测试环境设置
│   │   ├── utils/
│   │   │   └── testHelpers.ts # Testing utilities | 测试工具
│   │   ├── models/
│   │   │   ├── User.test.ts  # User model tests | 用户模型测试
│   │   │   └── Experiment.test.ts # Experiment tests | 实验测试
│   │   └── routes/
│   │       ├── auth.test.ts  # Auth API tests | 身份验证 API 测试
│   │       └── experiments.test.ts # Experiments API tests | 实验 API 测试
│   └── public/
│       └── api.ts            # TypeScript API client | TypeScript API 客户端
├── scripts/
│   ├── create-admin.ts       # Admin creation script | 管理员创建脚本
│   └── README.md             # Scripts documentation | 脚本文档
├── public/
│   ├── index.html            # Main HTML file | 主 HTML 文件
│   ├── css/
│   │   └── styles.css        # Application styles | 应用程序样式
│   └── js/
│       ├── api.js            # Compiled API client | 编译后的 API 客户端
│       └── app.js            # Main application logic | 主应用程序逻辑
├── uploads/                  # IRB document uploads | IRB 文件上传
├── dist/                     # Compiled backend JavaScript | 编译后的后端 JavaScript
├── .env.example              # Environment variables template | 环境变量模板
├── .dockerignore             # Docker ignore file | Docker 忽略文件
├── .gitignore                # Git ignore file | Git 忽略文件
├── Dockerfile                # Docker image definition | Docker 镜像定义
├── docker-compose.yml        # Docker Compose configuration | Docker Compose 配置
├── jest.config.js            # Jest testing configuration | Jest 测试配置
├── package.json              # Dependencies and scripts | 依赖和脚本
├── tsconfig.json             # Backend TypeScript configuration | 后端 TypeScript 配置
├── tsconfig.frontend.json    # Frontend TypeScript configuration | 前端 TypeScript 配置
├── TESTING_PLAN.md           # Testing documentation | 测试文档
└── README.md                 # This file | 本文件
```

---

## Security Considerations | 安全注意事项

**English:**
1. **Environment Variables**: Never commit `.env` file to version control
2. **JWT Secret**: Use a strong, random secret key in production
3. **HTTPS**: Always use HTTPS in production (use reverse proxy like Nginx/Caddy)
4. **Password Policy**: Enforce strong passwords (minimum 6 characters, consider adding complexity requirements)
5. **Rate Limiting**: Consider adding rate limiting for API endpoints
6. **Input Validation**: All inputs are validated using express-validator
7. **SQL Injection**: Protected by Mongoose parameterized queries
8. **XSS**: Frontend sanitizes user inputs

**中文:**
1. **环境变量**：切勿将 `.env` 文件提交到版本控制
2. **JWT 密钥**：在生产环境中使用强随机密钥
3. **HTTPS**：在生产环境中始终使用 HTTPS（使用 Nginx/Caddy 等反向代理）
4. **密码策略**：强制使用强密码（至少6个字符，考虑添加复杂度要求）
5. **速率限制**：考虑为 API 端点添加速率限制
6. **输入验证**：所有输入都使用 express-validator 进行验证
7. **SQL 注入**：通过 Mongoose 参数化查询进行保护
8. **XSS**：前端对用户输入进行清理

---

## Troubleshooting | 故障排除

### MongoDB Connection Issues | MongoDB 连接问题

```bash
# Check MongoDB is running | 检查 MongoDB 是否正在运行
sudo systemctl status mongod

# Check MongoDB connection string in .env | 检查 .env 中的 MongoDB 连接字符串
echo $MONGODB_URI

# Test MongoDB connection | 测试 MongoDB 连接
mongosh mongodb://localhost:27017/hsrp
```

### Port Already in Use | 端口已被占用

```bash
# Find process using port 3000 | 查找使用端口 3000 的进程
lsof -i :3000

# Kill the process | 终止进程
kill -9 <PID>

# Or change port in .env | 或在 .env 中更改端口
PORT=3001
```

### Docker Issues | Docker 问题

```bash
# View container logs | 查看容器日志
docker logs hsrp-app

# Restart container | 重启容器
docker restart hsrp-app

# Remove and rebuild | 删除并重建
docker-compose down
docker-compose up --build
```

---

## Development | 开发

### Available Scripts | 可用脚本

**English:**
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build all TypeScript (backend and frontend)
- `npm run build:backend` - Build backend TypeScript only
- `npm run build:frontend` - Build frontend TypeScript only
- `npm start` - Start production server
- `npm test` - Run all tests with Jest
- `npm run test:watch` - Run tests in watch mode (re-run on file changes)
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:unit` - Run unit tests only (models)
- `npm run test:integration` - Run integration tests only (routes/API)
- `npm run test:verbose` - Run tests with verbose output
- `npm run lint` - Run ESLint
- `npm run type-check` - Check all TypeScript types
- `npm run create-admin` - Create admin user account

**中文:**
- `npm run dev` - 启动带自动重载的开发服务器
- `npm run build` - 构建所有 TypeScript（后端和前端）
- `npm run build:backend` - 仅构建后端 TypeScript
- `npm run build:frontend` - 仅构建前端 TypeScript
- `npm start` - 启动生产服务器
- `npm test` - 使用 Jest 运行所有测试
- `npm run test:watch` - 以监视模式运行测试（文件更改时重新运行）
- `npm run test:coverage` - 运行测试并生成覆盖率报告
- `npm run test:unit` - 仅运行单元测试（模型）
- `npm run test:integration` - 仅运行集成测试（路由/API）
- `npm run test:verbose` - 以详细输出运行测试
- `npm run lint` - 运行 ESLint
- `npm run type-check` - 检查所有 TypeScript 类型
- `npm run create-admin` - 创建管理员用户账户

### Testing | 测试

**English:**

The project includes comprehensive automated testing with **Jest** and **Supertest**:

**Test Coverage:**
- **Unit Tests** - Model validation, password hashing, status transitions
- **Integration Tests** - Complete API workflows, authentication, authorization
- **40+ Test Cases** covering all critical user workflows
- **MongoDB Memory Server** for isolated, repeatable testing

**Running Tests:**
```bash
# Run all tests
npm test

# Run with coverage report (minimum 80% required)
npm run test:coverage

# Run in watch mode for development
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

**Test Structure:**
```
src/__tests__/
├── setup.ts                 # Test environment configuration
├── utils/
│   └── testHelpers.ts       # Shared testing utilities
├── models/
│   ├── User.test.ts         # User model unit tests
│   └── Experiment.test.ts   # Experiment model unit tests
└── routes/
    ├── auth.test.ts         # Authentication API tests
    └── experiments.test.ts  # Experiments API tests
```

**Coverage Requirements:**
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

For detailed testing documentation, see [TESTING_PLAN.md](TESTING_PLAN.md)

**中文:**

项目包含使用 **Jest** 和 **Supertest** 的全面自动化测试：

**测试覆盖范围:**
- **单元测试** - 模型验证、密码哈希、状态转换
- **集成测试** - 完整的 API 工作流、身份验证、授权
- **40+ 测试用例**涵盖所有关键用户工作流
- **MongoDB Memory Server** 用于隔离、可重复的测试

**运行测试:**
```bash
# 运行所有测试
npm test

# 运行并生成覆盖率报告（最低要求 80%）
npm run test:coverage

# 以监视模式运行用于开发
npm run test:watch

# 仅运行单元测试
npm run test:unit

# 仅运行集成测试
npm run test:integration
```

**测试结构:**
```
src/__tests__/
├── setup.ts                 # 测试环境配置
├── utils/
│   └── testHelpers.ts       # 共享测试工具
├── models/
│   ├── User.test.ts         # 用户模型单元测试
│   └── Experiment.test.ts   # 实验模型单元测试
└── routes/
    ├── auth.test.ts         # 身份验证 API 测试
    └── experiments.test.ts  # 实验 API 测试
```

**覆盖率要求:**
- 语句：80%+
- 分支：75%+
- 函数：80%+
- 行数：80%+

详细的测试文档请参阅 [TESTING_PLAN.md](TESTING_PLAN.md)

### Admin Account Setup | 管理员账户设置

**English:**

To create an admin account, you can use the automated script:

```bash
npm run create-admin
```

**Default Admin Credentials:**
- Email: `admin@hsrp.com`
- Password: `admin123456`

**Manual Setup (if needed):**

If the script doesn't work, you can create an admin manually in MongoDB:

```javascript
// Connect to MongoDB
mongosh mongodb://localhost:27017/hsrp

// Create admin user
db.users.insertOne({
  email: "admin@hsrp.com",
  password: "$2a$10$YourBcryptHashHere",  // Use bcrypt to hash "admin123456"
  firstName: "Admin",
  lastName: "User",
  role: "admin",  // IMPORTANT: Must be lowercase "admin"
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Important Notes:**
- Role must be lowercase `"admin"` not `"ADMIN"`
- Password must be hashed with bcrypt (10 rounds)
- Change default password after first login in production

**中文:**

要创建管理员账户，可以使用自动化脚本：

```bash
npm run create-admin
```

**默认管理员凭据:**
- 电子邮件：`admin@hsrp.com`
- 密码：`admin123456`

**手动设置（如需要）:**

如果脚本不起作用，可以在 MongoDB 中手动创建管理员：

```javascript
// 连接到 MongoDB
mongosh mongodb://localhost:27017/hsrp

// 创建管理员用户
db.users.insertOne({
  email: "admin@hsrp.com",
  password: "$2a$10$YourBcryptHashHere",  // 使用 bcrypt 对 "admin123456" 进行哈希
  firstName: "Admin",
  lastName: "User",
  role: "admin",  // 重要：必须是小写 "admin"
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**重要说明:**
- 角色必须是小写的 `"admin"` 而不是 `"ADMIN"`
- 密码必须使用 bcrypt（10轮）进行哈希
- 在生产环境中首次登录后更改默认密码

### Contributing | 贡献

**English:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**中文:**
1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

---

## License | 许可证

This project is licensed under the MIT License.

本项目采用 MIT 许可证。

---

## Support | 支持

**English:** For issues, questions, or contributions, please open an issue on GitHub.

**中文:** 如有问题、疑问或贡献，请在 GitHub 上提出 issue。
