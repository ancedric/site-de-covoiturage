<template>
    <div class="container">
        <form @submit.prevent="handleSearch">
            <div class="form">
                <!-- CHAMP DEPART -->
                <div class="form-input">
                    <label for="depart">Départ</label>
                    <input 
                        type="text" 
                        name="depart" 
                        class="input" 
                        v-model="searchData.departLieu.nom"
                        @input="searchLieu('depart', searchData.departLieu.nom)"
                    >
                    <!-- Liste des suggestions de départ -->
                    <ul v-if="suggestionsDepart.length" class="suggestions-list">
                        <li
                            v-for="suggestion in suggestionsDepart"
                            :key="suggestion.latitude + suggestion.longitude"
                            @click="selectSuggestion(suggestion, 'departLieu')"
                        >
                            {{ suggestion.formatted_address }}
                        </li>
                    </ul>
                </div>

                <!-- CHAMP DESTINATION -->
                <div class="form-input">
                    <label for="destination">Destination</label>
                    <input 
                        type="text" 
                        name="destination" 
                        class="input" 
                        v-model="searchData.arriveeLieu.nom"
                        @input="searchLieu('arrivee', searchData.arriveeLieu.nom)"
                    >
                    <!-- Liste des suggestions d'arrivée -->
                    <ul v-if="suggestionsArrivee.length" class="suggestions-list">
                        <li
                            v-for="suggestion in suggestionsArrivee"
                            :key="suggestion.latitude + suggestion.longitude"
                            @click="selectSuggestion(suggestion, 'arriveeLieu')"
                        >
                            {{ suggestion.formatted_address }}
                        </li>
                    </ul>
                </div>
                
                <div class="form-input">
                    <label for="date">Date de départ</label>
                    <input type="date" name="date" class="input" v-model="searchData.dateDepart">
                </div>
            </div>
            <div class="submission">
                <input type="submit" class="submit-btn" value="Rechercher un trajet">
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
// Importez la logique de votre store de voyage si nécessaire

// Nouveaux états pour les données de recherche complètes
const searchData = ref({
    departLieu: { nom: '', latitude: null, longitude: null },
    arriveeLieu: { nom: '', latitude: null, longitude: null },
    dateDepart: ''
});

// Nouveaux états pour gérer les suggestions de lieux
const suggestionsDepart = ref([]);
const suggestionsArrivee = ref([]);
let searchTimeout = null; // Pour le debounce

// Fonction de recherche (utilise votre API backend)
const searchLieu = (type, query) => {
    // Nettoyer les suggestions précédentes
    if (type === 'depart') {
        suggestionsArrivee.value = [];
    } else {
        suggestionsDepart.value = [];
    }

    clearTimeout(searchTimeout);

    if (query.length < 3) {
        if (type === 'depart') suggestionsDepart.value = [];
        else suggestionsArrivee.value = [];
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await axios.get(`/api/lieux/suggestions?q=${encodeURIComponent(query)}`);
            
            if (type === 'depart') {
                suggestionsDepart.value = response.data;
            } else {
                suggestionsArrivee.value = response.data;
            }
        } catch (error) {
            console.error(`Erreur lors de la recherche de lieu (${type}):`, error);
        }
    }, 300);
};

// Fonction pour sélectionner une suggestion
const selectSuggestion = (suggestion, formField) => {
    // 1. Mettre à jour les données du formulaire avec les infos de géolocalisation
    searchData.value[formField].nom = suggestion.formatted_address;
    searchData.value[formField].latitude = suggestion.latitude;
    searchData.value[formField].longitude = suggestion.longitude;
    
    // 2. Masquer la liste de suggestions
    if (formField === 'departLieu') {
        suggestionsDepart.value = [];
    } else {
        suggestionsArrivee.value = [];
    }
};

const handleSearch = () => {
    // Vous pouvez maintenant utiliser searchData.value.departLieu.latitude/longitude 
    // et searchData.value.arriveeLieu.latitude/longitude pour votre recherche.

    if (!searchData.value.departLieu.latitude || !searchData.value.arriveeLieu.latitude) {
         console.warn("Veuillez sélectionner le départ et la destination depuis les suggestions.");
         // Vous pouvez afficher un message d'erreur ou ignorer la recherche si les coordonnées manquent
         return; 
    }

    const searchPayload = {
        depart_lat: searchData.value.departLieu.latitude,
        depart_lng: searchData.value.departLieu.longitude,
        arrivee_lat: searchData.value.arriveeLieu.latitude,
        arrivee_lng: searchData.value.arriveeLieu.longitude,
        date: searchData.value.dateDepart,
    };

    console.log('Recherche lancée avec les données :', searchPayload);
    // Ici, vous appelleriez votre store ou votre API pour effectuer la recherche de trajets.
};
</script>

<style scoped>
/* Ajoutez un style de base pour la liste de suggestions si elle n'est pas déjà dans votre CSS global */
.form-input {
    position: relative; /* Conteneur de l'input et des suggestions */
}
.suggestions-list {
    position: absolute;
    z-index: 1000;
    background-color: white;
    border: 1px solid #ccc;
    color: #333;
    list-style: none;
    padding: 0;
    margin-top: 5px;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.suggestions-list li {
    padding: 10px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
}
.suggestions-list li:hover {
    background-color: #f0f0f0;
}
.suggestions-list li:last-child {
    border-bottom: none;
}
</style>

<style scoped>
    .container{
        width: 80%;
        background-color: #eee;
        color: #000;
        border-radius: 15px;
        height: 130px;
        box-shadow: 0 0 50px rgba(0,0,0,0.3);

        form{
            display: flex;
            flex-direction:column;
            justify-content: center;
            align-items: center;
            gap: 20px;
            width: 100%;
            .form{
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 60px;
                width: 100%;

                .form-input{
                    display: flex;
                    flex-direction:column;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    color: #333;

                    label{
                        text-align: left;
                    }
                    .input{
                        width: 70%;
                        height: 30px;
                        background-color: transparent;
                        border: 1px solid #487BFB;
                        border-radius: 12px;
                        padding-left: 20px;
                    }
                }
            }
            .submission{
                width: 100%;

                input{
                    width: 80%;
                    height: 40px;
                    background-color: #487BFB;;
                    color: #eee;
                    border-radius: 12px;
                    cursor: pointer;
                }
            }
        }
    }
</style>