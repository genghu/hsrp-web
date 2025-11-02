// API Response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// User interface
interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'researcher' | 'subject' | 'admin';
  institution?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

// Experiment interface
interface Experiment {
  _id: string;
  title: string;
  description: string;
  researcher: User;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  location: string;
  duration: number;
  compensation: string;
  requirements: string[];
  maxParticipants: number;
  sessions: Session[];
  createdAt: string;
  updatedAt: string;
}

// Session interface
interface Session {
  _id: string;
  startTime: string;
  endTime: string;
  participants: Participant[];
  maxParticipants: number;
  location: string;
  notes?: string;
}

// Participant interface
interface Participant {
  user: User | string;
  status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
  signupTime: string;
}

// API handler class
class API {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data as T;
  }

  // User authentication
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password })
      });

      const data = await this.handleResponse<{ token: string; user: User }>(response);
      localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    institution?: string;
    department?: string;
  }): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData)
      });

      const data = await this.handleResponse<{ token: string; user: User }>(response);
      localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await fetch('/api/auth/me', {
        headers: this.getHeaders(true)
      });

      return this.handleResponse<User>(response);
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: this.getHeaders(true),
        body: JSON.stringify(profileData)
      });

      return this.handleResponse<User>(response);
    } catch (error) {
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ currentPassword, newPassword })
      });

      return this.handleResponse<{ message: string }>(response);
    } catch (error) {
      throw error;
    }
  }

  // Experiment management
  async getExperiments(query?: { status?: string }): Promise<Experiment[]> {
    try {
      const queryString = query ? '?' + new URLSearchParams(query as any).toString() : '';
      const response = await fetch(`/api/experiments${queryString}`, {
        headers: this.getHeaders(true)
      });

      return this.handleResponse<Experiment[]>(response);
    } catch (error) {
      throw error;
    }
  }

  async getExperiment(id: string): Promise<Experiment> {
    try {
      const response = await fetch(`/api/experiments/${id}`, {
        headers: this.getHeaders(true)
      });

      return this.handleResponse<Experiment>(response);
    } catch (error) {
      throw error;
    }
  }

  async createExperiment(experimentData: Partial<Experiment>): Promise<Experiment> {
    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(experimentData)
      });

      return this.handleResponse<Experiment>(response);
    } catch (error) {
      throw error;
    }
  }

  async updateExperiment(id: string, experimentData: Partial<Experiment>): Promise<Experiment> {
    try {
      const response = await fetch(`/api/experiments/${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(true),
        body: JSON.stringify(experimentData)
      });

      return this.handleResponse<Experiment>(response);
    } catch (error) {
      throw error;
    }
  }

  async deleteExperiment(id: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`/api/experiments/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(true)
      });

      return this.handleResponse<{ message: string }>(response);
    } catch (error) {
      throw error;
    }
  }

  // Session management
  async createSession(experimentId: string, sessionData: Partial<Session>): Promise<Experiment> {
    try {
      const response = await fetch(`/api/experiments/${experimentId}/sessions`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(sessionData)
      });

      return this.handleResponse<Experiment>(response);
    } catch (error) {
      throw error;
    }
  }

  async updateSession(experimentId: string, sessionId: string, sessionData: Partial<Session>): Promise<Experiment> {
    try {
      const response = await fetch(`/api/experiments/${experimentId}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: this.getHeaders(true),
        body: JSON.stringify(sessionData)
      });

      return this.handleResponse<Experiment>(response);
    } catch (error) {
      throw error;
    }
  }

  async deleteSession(experimentId: string, sessionId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`/api/experiments/${experimentId}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: this.getHeaders(true)
      });

      return this.handleResponse<{ message: string }>(response);
    } catch (error) {
      throw error;
    }
  }

  async registerForSession(experimentId: string, sessionId: string): Promise<Experiment> {
    try {
      const response = await fetch(`/api/experiments/${experimentId}/sessions/${sessionId}/register`, {
        method: 'POST',
        headers: this.getHeaders(true)
      });

      return this.handleResponse<Experiment>(response);
    } catch (error) {
      throw error;
    }
  }

  async cancelRegistration(experimentId: string, sessionId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`/api/experiments/${experimentId}/sessions/${sessionId}/register`, {
        method: 'DELETE',
        headers: this.getHeaders(true)
      });

      return this.handleResponse<{ message: string }>(response);
    } catch (error) {
      throw error;
    }
  }

  async updateParticipantStatus(
    experimentId: string,
    sessionId: string,
    userId: string,
    status: string
  ): Promise<Experiment> {
    try {
      const response = await fetch(
        `/api/experiments/${experimentId}/sessions/${sessionId}/participants/${userId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(true),
          body: JSON.stringify({ status })
        }
      );

      return this.handleResponse<Experiment>(response);
    } catch (error) {
      throw error;
    }
  }

  async getMySession(): Promise<Experiment[]> {
    try {
      const response = await fetch('/api/experiments/my-sessions', {
        headers: this.getHeaders(true)
      });

      return this.handleResponse<Experiment[]>(response);
    } catch (error) {
      throw error;
    }
  }

  // User profile management
  async getUserProfile(): Promise<User> {
    try {
      const response = await fetch('/api/users/me', {
        headers: this.getHeaders(true)
      });

      return this.handleResponse<User>(response);
    } catch (error) {
      throw error;
    }
  }

  async updateUserProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify(profileData)
      });

      return this.handleResponse<User>(response);
    } catch (error) {
      throw error;
    }
  }
}

// Export a singleton instance
const api = new API();
