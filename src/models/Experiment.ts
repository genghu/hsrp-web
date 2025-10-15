import mongoose, { Schema, Document } from 'mongoose';
import { IExperiment, ExperimentStatus, ISession, ParticipantStatus } from '../types';

const sessionSchema = new Schema({
  experiment: {
    type: Schema.Types.ObjectId,
    ref: 'Experiment',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ParticipantStatus),
      default: ParticipantStatus.REGISTERED
    },
    signupTime: {
      type: Date,
      default: Date.now
    }
  }],
  maxParticipants: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  notes: String
}, {
  timestamps: true
});

export interface ExperimentDocument extends IExperiment, Document {}

const experimentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  researcher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ExperimentStatus),
    default: ExperimentStatus.DRAFT
  },
  location: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  compensation: {
    type: String,
    required: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  maxParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  sessions: [sessionSchema]
}, {
  timestamps: true
});

// Virtual field for current participant count
experimentSchema.virtual('currentParticipants').get(function(this: ExperimentDocument) {
  return this.sessions.reduce((total, session) => 
    total + session.participants.filter(p => 
      p.status !== ParticipantStatus.CANCELLED
    ).length, 0);
});

// Indexes for better query performance
experimentSchema.index({ title: 'text', description: 'text' }); // Full-text search
experimentSchema.index({ researcher: 1 }); // Filter experiments by researcher
experimentSchema.index({ status: 1 }); // Filter experiments by status
experimentSchema.index({ createdAt: -1 }); // Sort by creation date
experimentSchema.index({ 'sessions.startTime': 1 }); // Find sessions by date

export const Experiment = mongoose.model<ExperimentDocument>('Experiment', experimentSchema);