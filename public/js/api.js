"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// API handler class
class API {
    getToken() {
        return localStorage.getItem('token');
    }
    getHeaders(includeAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['x-auth-token'] = token;
            }
        }
        return headers;
    }
    handleResponse(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Request failed');
            }
            return data.data;
        });
    }
    // User authentication
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/auth/login', {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ email, password })
                });
                const data = yield this.handleResponse(response);
                localStorage.setItem('token', data.token);
                return data;
            }
            catch (error) {
                throw error;
            }
        });
    }
    register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/auth/register', {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(userData)
                });
                const data = yield this.handleResponse(response);
                localStorage.setItem('token', data.token);
                return data;
            }
            catch (error) {
                throw error;
            }
        });
    }
    // Experiment management
    getExperiments(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const queryString = query ? '?' + new URLSearchParams(query).toString() : '';
                const response = yield fetch(`/api/experiments${queryString}`, {
                    headers: this.getHeaders(true)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    getExperiment(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`/api/experiments/${id}`, {
                    headers: this.getHeaders(true)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    createExperiment(experimentData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/experiments', {
                    method: 'POST',
                    headers: this.getHeaders(true),
                    body: JSON.stringify(experimentData)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    updateExperiment(id, experimentData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`/api/experiments/${id}`, {
                    method: 'PATCH',
                    headers: this.getHeaders(true),
                    body: JSON.stringify(experimentData)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    deleteExperiment(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`/api/experiments/${id}`, {
                    method: 'DELETE',
                    headers: this.getHeaders(true)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    // Session management
    createSession(experimentId, sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`/api/experiments/${experimentId}/sessions`, {
                    method: 'POST',
                    headers: this.getHeaders(true),
                    body: JSON.stringify(sessionData)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    deleteSession(experimentId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`/api/experiments/${experimentId}/sessions/${sessionId}`, {
                    method: 'DELETE',
                    headers: this.getHeaders(true)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    registerForSession(experimentId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`/api/experiments/${experimentId}/sessions/${sessionId}/register`, {
                    method: 'POST',
                    headers: this.getHeaders(true)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    cancelRegistration(experimentId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`/api/experiments/${experimentId}/sessions/${sessionId}/register`, {
                    method: 'DELETE',
                    headers: this.getHeaders(true)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    updateParticipantStatus(experimentId, sessionId, userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`/api/experiments/${experimentId}/sessions/${sessionId}/participants/${userId}`, {
                    method: 'PATCH',
                    headers: this.getHeaders(true),
                    body: JSON.stringify({ status })
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    getMySession() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/experiments/my-sessions', {
                    headers: this.getHeaders(true)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    // User profile management
    getUserProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/users/me', {
                    headers: this.getHeaders(true)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
    updateUserProfile(profileData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/users/me', {
                    method: 'PUT',
                    headers: this.getHeaders(true),
                    body: JSON.stringify(profileData)
                });
                return this.handleResponse(response);
            }
            catch (error) {
                throw error;
            }
        });
    }
}
// Export a singleton instance
const api = new API();
