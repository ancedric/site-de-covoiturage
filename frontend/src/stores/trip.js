import { defineStore } from 'pinia';
import apiClient from '../services/api';

export const useTripStore = defineStore('trip', {
  state: () => ({
    allTrips: [],
    trips: [],
    reservations: [],
    currentTrip: null,
    loading: false,
    error: null,
  }),
  actions: {
    async createTrip(tripData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/trips', tripData);
        // Ajouter le nouveau trajet à la liste locale si nécessaire
        this.trips.push(response.data.trip);
        return response.data.trip; 
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur lors de la publication du trajet.';
        console.error('Erreur createTrip:', err.response?.data || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async fetchTrip(userId){
      try{
        const response = await apiClient.get(`/trips/my-trips/${userId}`);
        this.trips = response.data.trips;
      } catch(e){
        console.error("Error fetching trips: ", e);
      }
    },
    async fetchAllTrips(){
      try{
        const response = await apiClient.get(`/trips/`);
        this.allTrips = response.data;
      } catch(e){
        console.error("Error fetching trips: ", e);
      }
    },

    async getTripParticipants(tripId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get(`/trips/${tripId}/participants`)
        if (!response.data || !Array.isArray(response.data.participants)) {
          console.log("Aucun participant trouvé ou format de données incorrect.");
        }
        return response.data.participants; // Retourne la liste des participants
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur lors de la récupération des participants.';
        console.error('Erreur getTripParticipants:', err.response?.data || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async fetchTripDetails(tripId) {
      this.loading = true;
      this.error = null;
      this.currentTrip = null;

      try {
        const tripResponse = await apiClient.get(`/trips/${tripId}`);
        const tripData = tripResponse.data;
        if (!tripData || !tripData.utilisateur_id_user) {
          throw new Error("Détails du trajet ou ID du conducteur introuvable.");
        }
        
        const conducteurId = tripData.utilisateur_id_user;
        
        const conducteurResponse = await apiClient.get(`/users/${conducteurId}`);
        const conducteurData = conducteurResponse.data;
        
        if (!conducteurData) {
          throw new Error("Détails du conducteur introuvable.");
        }

        const participantsResponse = await this.getTripParticipants(tripId);
        
        const mergedTripData = {
          ...tripData,
          conducteur: conducteurData,
          participants: participantsResponse || [],
        };
        this.currentTrip = mergedTripData;

      } catch (err) {
        this.error = err.message;
        console.error('Erreur lors du chargement des détails:', err);
      } finally {
        this.loading = false;
      }
    },

    async addParticipantToTrip(tripId, userId) {
      this.loading = true;
      this.error = null;

      try {
        const res = await apiClient.post(`/reservations/${userId}`, {tripId})
        // Mettre à jour le trajet actuel pour refléter le nouvel état
        if (this.currentTrip && this.currentTrip.id_trajet === tripId) {
          this.currentTrip.places_disponibles -= 1; 
          this.currentTrip.participants.push(userId);
        }
      } catch (err) {
        this.error = err.res?.data?.message || 'Erreur lors de l\'ajout du participant.';
        console.error('Erreur addParticipantToTrip:', err.res?.data || err.message);
      } finally {
        this.loading = false;
      }
    },
    async updatePlacesDisponibles(tripId, newPlaces) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.patch(`/trips/${tripId}`, { places_disponibles: newPlaces });
        console.log('Places disponibles mises à jour avec succès:', response.data);
        // Mettre à jour le trajet actuel pour refléter le nouvel état
        if (this.currentTrip && this.currentTrip.id_trajet === tripId) {
          this.currentTrip.places_disponibles = newPlaces; // Mettre à jour les places disponibles
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur lors de la mise à jour des places disponibles.';
        console.error('Erreur updatePlacesDisponibles:', err.response?.data || err.message);
      }
      finally {
        this.loading = false;
      }
    },
    async fetchReservations(userId){
      try{
        const response = await apiClient.get(`/reservations/user/${userId}`);
        this.reservations = response.data;
        console.log("reservations trouvées: ", this.reservations)
      } catch(e){
        console.error("Error fetching reservations: ", e);
      }
    },
    // On ajoutera des actions pour fetchTrips, updateTrip, deleteTrip ici
  },
});
