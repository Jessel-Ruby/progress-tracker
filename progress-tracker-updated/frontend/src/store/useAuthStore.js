import { create } from 'zustand';
import api from '../services/api';
import { getErrorMessage } from '../utils/apiError';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: !!localStorage.getItem('access_token'),

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const token = response.data.access_token;
      localStorage.setItem('access_token', token);
      
      // Fetch user data
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        user: userRes.data, 
        token, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: getErrorMessage(error, 'Invalid username or password'),
      };
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

export default useAuthStore;
