// Standalone entity classes replacing Base44 SDK
import { apiClient } from './apiClient';

class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async list(orderBy = '-created_at', limit = 100) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    
    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
    
    return await apiClient.get(url);
  }

  async filter(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
    
    return await apiClient.get(url);
  }

  async create(data) {
    return await apiClient.post(this.endpoint, data);
  }

  async update(id, data) {
    return await apiClient.put(`${this.endpoint}/${id}`, data);
  }

  async delete(id) {
    return await apiClient.delete(`${this.endpoint}/${id}`);
  }

  async getById(id) {
    return await apiClient.get(`${this.endpoint}/${id}`);
  }
}

// User authentication and management
class UserAuth {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  }

  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  }

  async logout() {
    await apiClient.post('/auth/logout');
    apiClient.setToken(null);
  }

  async me() {
    return await apiClient.get('/auth/me');
  }

  async updateMyUserData(data) {
    return await apiClient.put('/users/profile', data);
  }

  async list() {
    return await apiClient.get('/users');
  }

  async resetPassword(userId, passwordData) {
    return await apiClient.post(`/users/${userId}/reset-password`, passwordData);
  }
}

// Shop visits entity
class ShopVisitEntity extends BaseEntity {
  constructor() {
    super('/visits');
  }
}

// Customers entity
class CustomerEntity extends BaseEntity {
  constructor() {
    super('/customers');
  }
}

// Configuration entity
class ConfigurationEntity extends BaseEntity {
  constructor() {
    super('/config');
  }
}

// File upload functionality
class FileUpload {
  static async uploadFile({ file }) {
    return await apiClient.uploadFile(file);
  }
}

// Export entities
export const ShopVisit = new ShopVisitEntity();
export const Customer = new CustomerEntity();
export const Configuration = new ConfigurationEntity();
export const User = new UserAuth();
export const UploadFile = FileUpload.uploadFile;

// Mock audit log entity (simplified for this implementation)
export const AuditLog = {
  async list(orderBy = '-created_at', limit = 100) {
    // This would be implemented if audit logs are needed in the frontend
    return [];
  },
  async create(data) {
    // Audit logs are created automatically on the backend
    return data;
  }
};

// Mock UserProfile entity (users table handles this)
export const UserProfile = {
  async list() {
    return await apiClient.get('/users');
  },
  async create(data) {
    return await apiClient.post('/auth/register', data);
  },
  async update(id, data) {
    return await apiClient.put(`/users/${id}`, data);
  }
};