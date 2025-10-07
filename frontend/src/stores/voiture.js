import { defineStore } from 'pinia';
import apiClient from '../services/api';

export const useVoitureStore = defineStore('voiture', {
  state: () => ({
    voitures: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchMyVoitures() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get('/voitures/my-voitures');
        this.voitures = response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur lors de la récupération de vos véhicules.';
        console.error('Erreur fetchMyVoitures:', err.response?.data || err.message);
      } finally {
        this.loading = false;
      }
    },

    async createVoiture(voitureData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/voitures', voitureData);
        // Ajouter la nouvelle voiture au catalogue local si nécessaire
        this.voitures.push(response.data.voiture);
        return response.data.voiture; // Retourne l'objet voiture créé avec son ID
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur lors de l\'ajout du véhicule.';
        console.error('Erreur createVoiture:', err.response?.data || err.message);
        throw err; 
      } finally {
        this.loading = false;
      }
    },
    // On ajoutera des actions pour update et delete si besoin
  },
});
