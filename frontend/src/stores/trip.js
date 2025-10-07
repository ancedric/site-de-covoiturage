import { defineStore } from 'pinia';
import apiClient from '../services/api';

export const useTripStore = defineStore('trip', {
  state: () => ({
    trips: [],
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
      console.log("user id: ", userId);
      try{
        const response = await apiClient.get(`/trips/my-trips/${userId}`);
        this.trips = response.data.trips;
      } catch{

      }
    },

    async getTripParticipants(tripId) {
      this.loading = true;
      this.error = null;
      try {
        console.log("DEBUG: Entrée dans la récupération des participants")
        const response = await apiClient.get(`/trips/${tripId}/participants`);
        console.log("DEBUG: Participants récupérés pour le trajet:", response.data.participants);
        if (!response.data || !Array.isArray(response.data.participants)) {
          throw new Error("Aucun participant trouvé ou format de données incorrect.");
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
        console.log("DEBUG: Arrivée dans le store avec l'id: ", tripId)
        const tripResponse = await apiClient.get(`/trips/${tripId}`);
        const tripData = tripResponse.data;
        console.log("DEBUG: données du trajet sélectionné: ", tripData)
        if (!tripData || !tripData.utilisateur_id_user) {
          throw new Error("Détails du trajet ou ID du conducteur introuvable.");
        }
        
        const conducteurId = tripData.utilisateur_id_user;
        console.log("DEBUG: Id du conducteur du trajet sélectionné: ", conducteurId)
        
        const conducteurResponse = await apiClient.get(`/users/${conducteurId}`);
        const conducteurData = conducteurResponse.data;
        console.log("DEBUG: données du conducteur du trajet sélectionné: ", conducteurData)
        
        if (!conducteurData) {
          throw new Error("Détails du conducteur introuvable.");
        }

        console.log("DEBUG: Recherche des données des participants")
        const participantsResponse = await this.getTripParticipants(tripId);
        console.log("DEBUG: Participants du trajet sélectionné: ", participantsResponse)
        
        const mergedTripData = {
          ...tripData,
          conducteur: conducteurData,
          participants: participantsResponse || [],
        };
        console.log("DEBUG: données extraites du trajet sélectionné: ", mergedTripData)
        this.currentTrip = mergedTripData;

        console.log('DEBUG: Données complètes du trajet stockées:', this.currentTrip);

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
        const response = await apiClient.post(`/trips/${tripId}/participants`, { userId });
        console.log('Participant ajouté avec succès:', response.data);
        // Mettre à jour le trajet actuel pour refléter le nouvel état
        if (this.currentTrip && this.currentTrip.id_trajet === tripId) {
          this.currentTrip.places_disponibles -= 1; 
          this.currentTrip.participants.push(response.data.participant); // Ajouter le participant à la liste
          console.log('Participant ajouté au trajet actuel:', this.currentTrip.participants);
          this.updatePlacesDisponibles(tripId, this.currentTrip.places_disponibles);
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur lors de l\'ajout du participant.';
        console.error('Erreur addParticipantToTrip:', err.response?.data || err.message);
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

    // On ajoutera des actions pour fetchTrips, updateTrip, deleteTrip ici
  },
});
