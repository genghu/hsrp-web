// User role enum
export enum UserRole {
  RESEARCHER = 'researcher',
  SUBJECT = 'subject',
  ADMIN = 'admin'
}

// User interface
export interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  institution?: string;
  department?: string;
  wechatId?: string;
  qqId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Experiment status enum
export enum ExperimentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Experiment interface
export interface IExperiment {
  title: string;
  description: string;
  researcher: string | IUser; // Reference to User
  status: ExperimentStatus;
  location: string;
  duration: number; // in minutes
  compensation: string;
  requirements: string[];
  maxParticipants: number;
  sessions: ISession[];
  irbDocument?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    uploadDate: Date;
  };
  adminReview?: {
    reviewedBy?: string | IUser;
    reviewDate?: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Session interface
export interface ISession {
  experiment: string | IExperiment; // Reference to Experiment
  startTime: Date;
  endTime: Date;
  participants: Array<{
    user: string | IUser; // Reference to User
    status: ParticipantStatus;
    signupTime: Date;
  }>;
  maxParticipants: number;
  location: string;
  notes?: string;
}

// Participant status in a session
export enum ParticipantStatus {
  REGISTERED = 'registered',
  CONFIRMED = 'confirmed',
  ATTENDED = 'attended',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled'
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// Authentication interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse extends ApiResponse<{
  token: string;
  user: Omit<IUser, 'password'>;
}> {}