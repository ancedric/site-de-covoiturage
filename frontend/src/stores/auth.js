import { defineStore } from 'pinia';
import apiClient from '../services/api';
import router from '../router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }),
  actions: {
    // --- Action pour l'inscription ---
    async register(userData) {
      this.loading = true;
      this.error = null; 
      try {
        const response = await apiClient.post('/register', userData);
        
        // Après une inscription réussie, l'utilisateur est redirigé vers la page de connexion.
        router.push('/login?registered=true');
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur lors de l\'inscription.';
        console.error('Erreur inscription (store):', err.response?.data || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // --- Action pour la connexion ---
    async login(credentials) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/login', credentials);
        
        this.user = response.data.user;
        this.isAuthenticated = true;
        router.push('/');
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Identifiants invalides.';
        console.error('Erreur connexion (store):', err.response?.data || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // --- Action pour la déconnexion ---
    async logout() {
      this.loading = true;
      this.error = null;
      try {
        await apiClient.post('/logout');
        this.user = null; 
        this.isAuthenticated = false; 
        router.push('/'); 
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur lors de la déconnexion.';
        console.error('Erreur déconnexion (store):', err.response?.data || err.message);
        this.user = null;
        this.isAuthenticated = false;
        router.push('/login');
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // --- Action pour vérifier l'état d'authentification (au chargement de l'app ou navigation) ---
    async checkAuth() {
      this.loading = true;
      this.error = null; 
      try {
        const response = await apiClient.get('/me');
        
        this.user = response.data.user;
        this.isAuthenticated = true;
      } catch (err) {
        this.user = null;
        this.isAuthenticated = false;
      } finally {
        this.loading = false;
      }
    },
  },
});