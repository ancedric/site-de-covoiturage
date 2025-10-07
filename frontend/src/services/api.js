import axios from 'axios';
import { useAuthStore } from '../stores/auth'; 

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

//Intercepteur pour gérer les erreurs globales (ex: déconnexion automatique sur 401)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Si une requête API renvoie 401 (non autorisé), cela peut signifier que le JWT est expiré ou invalide.
      // On peut alors tenter une déconnexion automatique côté client.
      const authStore = useAuthStore();
      authStore.logout();
      console.warn('Session expirée. Déconnexion automatique.');
    }
    return Promise.reject(error);
  }
);


export default apiClient;