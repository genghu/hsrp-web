# HSRP - Human Subject Recruitment Platform

A comprehensive web application for managing research experiments and connecting researchers with human subjects (participants).

## Features

### For Researchers
- Create and manage experiments
- Schedule multiple experiment sessions
- Track participant registrations
- Manage participant status (registered, confirmed, attended, no-show, cancelled)
- View participant details and contact information
- Control experiment status (draft, open, in progress, completed, cancelled)

### For Participants (Subjects)
- Browse available experiments
- View experiment details and requirements
- Register for experiment sessions
- View registered sessions
- Cancel registrations
- Track participation history

### General Features
- Secure user authentication with JWT
- Role-based access control (Researcher, Subject, Admin)
- Real-time session availability tracking
- Responsive web interface
- RESTful API architecture
- MongoDB database for data persistence

## Tech Stack

### Backend
- **Node.js** with **TypeScript** - Runtime and language
- **Express.js** - Web framework
- **MongoDB** with **Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with CSS variables
- **TypeScript** - Type-safe client-side logic
- **Fetch API** - HTTP requests

## Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB 7+ (local or MongoDB Atlas)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hsrp-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/hsrp
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Start MongoDB**

   If running locally:
   ```bash
   mongod
   ```

   Or use MongoDB Atlas cloud connection string in `.env`

5. **Run the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

6. **Build and run for production**

   **Option 1: Build then start (automatic)**
   ```bash
   npm start
   ```
   This will automatically build the TypeScript files before starting.

   **Option 2: Build separately**
   ```bash
   npm run build
   npm start
   ```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - Application server on port 3000
   - MongoDB on port 27017

2. **View logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

4. **Remove volumes (WARNING: This deletes all data)**
   ```bash
   docker-compose down -v
   ```

### Using Docker Only

1. **Build the image**
   ```bash
   docker build -t hsrp-web .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e MONGODB_URI=mongodb://your-mongodb-host:27017/hsrp \
     -e JWT_SECRET=your-secret-key \
     --name hsrp-app \
     hsrp-web
   ```

## Cloud Deployment

### Deploy to AWS EC2, DigitalOcean, or any VPS

1. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Docker and Docker Compose**
   ```bash
   # Docker installation commands for your OS
   # For Ubuntu:
   sudo apt update
   sudo apt install docker.io docker-compose -y
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd hsrp-web
   nano .env  # Configure your environment variables
   ```

4. **Start with Docker Compose**
   ```bash
   sudo docker-compose up -d
   ```

5. **Set up reverse proxy (Optional but recommended)**

   Use Nginx or Caddy to handle SSL/TLS:
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

### Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create a new app**
   ```bash
   heroku create your-app-name
   ```

4. **Set environment variables**
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set MONGODB_URI=your-mongodb-atlas-uri
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### Deploy to Railway, Render, or Fly.io

These platforms support Docker deployments:

1. Connect your GitHub repository
2. Configure environment variables in the platform dashboard
3. The platform will automatically detect `Dockerfile` and build/deploy

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "subject|researcher",
  "institution": "University Name",  // Optional, for researchers
  "department": "Psychology"         // Optional, for researchers
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Experiment Endpoints

#### List Experiments
```http
GET /api/experiments?status=open&search=memory
Authorization: Bearer <token>
```

#### Create Experiment (Researcher only)
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
  "requirements": ["18+ years old", "Native English speaker"],
  "status": "draft|open|in_progress|completed"
}
```

#### Get Experiment Details
```http
GET /api/experiments/:id
Authorization: Bearer <token>
```

#### Update Experiment (Researcher only)
```http
PATCH /api/experiments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "open",
  "compensation": "$25"
}
```

#### Delete Experiment (Researcher only)
```http
DELETE /api/experiments/:id
Authorization: Bearer <token>
```

### Session Endpoints

#### Add Session (Researcher only)
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

#### Update Session (Researcher only)
```http
PATCH /api/experiments/:id/sessions/:sessionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "maxParticipants": 8
}
```

#### Delete Session (Researcher only)
```http
DELETE /api/experiments/:id/sessions/:sessionId
Authorization: Bearer <token>
```

#### Register for Session (Subject only)
```http
POST /api/experiments/:id/sessions/:sessionId/register
Authorization: Bearer <token>
```

#### Cancel Registration (Subject only)
```http
DELETE /api/experiments/:id/sessions/:sessionId/register
Authorization: Bearer <token>
```

#### Update Participant Status (Researcher only)
```http
PATCH /api/experiments/:id/sessions/:sessionId/participants/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed|attended|no_show|cancelled"
}
```

#### Get My Sessions (Subject only)
```http
GET /api/experiments/my-sessions
Authorization: Bearer <token>
```

## Database Schema

### User Schema
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

### Experiment Schema
```typescript
{
  title: string
  description: string
  researcher: ObjectId (ref: User)
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
  location: string
  duration: number (minutes)
  compensation: string
  requirements: string[]
  maxParticipants: number
  sessions: Session[]
  createdAt: Date
  updatedAt: Date
}
```

### Session Schema (Subdocument)
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

## Project Structure

```
hsrp-web/
├── src/
│   ├── index.ts              # Application entry point
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── models/
│   │   ├── User.ts           # User model
│   │   └── Experiment.ts     # Experiment model
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   └── validation.ts     # Input validation rules
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   ├── experiments.ts    # Experiment routes
│   │   └── users.ts          # User routes
│   └── public/
│       └── api.ts            # TypeScript API client
├── public/
│   ├── index.html            # Main HTML file
│   ├── css/
│   │   └── styles.css        # Application styles
│   └── js/
│       ├── api.js            # Compiled API client
│       └── app.js            # Main application logic
├── dist/                     # Compiled backend JavaScript (generated)
├── .env.example              # Environment variables template
├── .dockerignore             # Docker ignore file
├── .gitignore                # Git ignore file
├── Dockerfile                # Docker image definition
├── docker-compose.yml        # Docker Compose configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # Backend TypeScript configuration
├── tsconfig.frontend.json    # Frontend TypeScript configuration
└── README.md                 # This file
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` file to version control
2. **JWT Secret**: Use a strong, random secret key in production
3. **HTTPS**: Always use HTTPS in production (use reverse proxy like Nginx/Caddy)
4. **Password Policy**: Enforce strong passwords (minimum 6 characters, consider adding complexity requirements)
5. **Rate Limiting**: Consider adding rate limiting for API endpoints
6. **Input Validation**: All inputs are validated using express-validator
7. **SQL Injection**: Protected by Mongoose parameterized queries
8. **XSS**: Frontend sanitizes user inputs

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Check MongoDB connection string in .env
echo $MONGODB_URI

# Test MongoDB connection
mongosh mongodb://localhost:27017/hsrp
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Docker Issues
```bash
# View container logs
docker logs hsrp-app

# Restart container
docker restart hsrp-app

# Remove and rebuild
docker-compose down
docker-compose up --build
```

## Development

### Available Scripts
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build all TypeScript (backend and frontend)
- `npm run build:backend` - Build backend TypeScript only
- `npm run build:frontend` - Build frontend TypeScript only
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)
- `npm run lint` - Run ESLint
- `npm run type-check` - Check all TypeScript types

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.
