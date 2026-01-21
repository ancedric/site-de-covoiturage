<template>
  <div class="add-trip">
    <div class="header">
      <h1>Publier un trajet</h1>
    </div>
    <form @submit.prevent="submitTrip">
      <div class="map-container">
        <div id="publish-map" class="map"></div>
        <div class="map-overlay-info">
          {{ !markerArrivee ? '📍 Cliquez pour placer l\'ARRIVÉE' : '✅ Départ et Arrivée définis' }}
        </div>
      </div>
      <div class="car-img"></div>

      <div id="part1" class="form-part">
        <div class="title">Informations sur le trajet</div>
        <div class="separator"></div>
        <div class="content"> 
          <!-- CHAMP LIEU DE DÉPART -->
          <div class="input-ctn">
            <label for="depart-lieu">Lieu de départ</label>
            <input
              type="text"
              id="depart-lieu"
              placeholder="Choisissez un point de départ"
              v-model="formData.departLieu.nom"
              @input="searchLieu('depart', $event.target.value)"
            >
            <!-- Liste des suggestions de départ -->
            <ul v-if="suggestionsDepart.length" class="suggestions-list">
                <li
                    v-for="suggestion in suggestionsDepart"
                    :key="suggestion.lat + suggestion.lon"
                    @click="selectSuggestion(suggestion, 'departLieu')"
                >
                    <!-- CHANGEMENT ICI : Utiliser display_name au lieu de formatted_address -->
                    {{ suggestion.display_name }}
                </li>
            </ul>
          </div>
          
          <!-- CHAMP LIEU D'ARRIVÉE -->
          <div class="input-ctn">
            <label for="arrivee-lieu">Lieu d'arrivée</label>
            <input
              type="text"
              id="arrivee-lieu"
              placeholder="Choisissez un lieu d'arrivée"
              v-model="formData.arriveeLieu.nom"
              @input="searchLieu('arrivee', $event.target.value)"
            >
             <!-- Liste des suggestions d'arrivée -->
            <ul v-if="suggestionsArrivee.length" class="suggestions-list">
                <li
                    v-for="suggestion in suggestionsArrivee"
                    :key="suggestion.lat + suggestion.lon"
                    @click="selectSuggestion(suggestion, 'arriveeLieu')"
                >
                    <!-- CHANGEMENT ICI : Utiliser display_name au lieu de formatted_address -->
                    {{ suggestion.display_name }}
                </li>
            </ul>
          </div>

          <div class="input-ctn">
            <label for="date-depart">Date de départ</label>
            <input type="date" id="date-depart" v-model="formData.dateDepart">
          </div>
          <div class="input-ctn">
            <label for="heure-depart">Heure de départ</label>
            <input type="time" id="heure-depart" v-model="formData.heureDepart">
          </div>
          <div class="input-ctn">
            <label for="arrets">Arrêts (optionnel)</label>
            <input type="text" id="arrets" placeholder="Ajoutez des arrêts intermédiaires" v-model="formData.arrets">
          </div>
          <div class="btn-ctn">
            <button type="button" class="next" @click="scrollToPart('part2')">Suivant</button>
          </div>
        </div>
      </div>

      <div id="part2" class="form-part">
        <div class="title">Informations du véhicule</div>
        <div class="separator"></div>
        <div class="car-picker">
          <div class="left">
            <h4>Choisissez un véhicule</h4>
            <div class="car-catalog">
              <p v-if="voitureStore.loading">Chargement des véhicules...</p>
              <p v-else-if="voitureStore.error" class="error-message">{{ voitureStore.error }}</p>
              <p v-else-if="!voitureStore.voitures || voitureStore.voitures.length === 0">Vous n'avez aucun véhicule enregistré. Veuillez en ajouter un ci-dessous.</p>
              <div class="car-carousel" v-else>
                <div v-for="car in voitureStore.voitures" :key="car.id_voiture" class="car-item">
                  <input type="radio" :id="'car-' + car.id_voiture" :value="car.id_voiture" v-model="formData.selectedVehicleId" @change="selectExistingCar(car)">
                  <label :for="'car-' + car.id_voiture">
                    {{ car.marque }} {{ car.modele }} ({{ car.plaque_immatriculation }})
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="right">
            <div class="img-picker">
              <img 
                :src="selectedCarImageUrl || defaultImage" 
                alt="Image du véhicule" 
                class="car-image"
                @click="pickImage"
              />
              <input type="file" ref="fileInput" @change="handleImageUpload" style="display: none;">
            </div>
          </div>
        </div>
        <div class="content">
          <h3>Ajouter un nouveau véhicule (si non sélectionné ci-dessus)</h3>
          <div class="input-ctn">
            <label for="vehicule-marque">Marque</label>
            <input type="text" id="vehicule-marque" placeholder="Entrez la marque" v-model="formData.vehicule.marque">
          </div>
          <div class="input-ctn">
            <label for="vehicule-modele">Modèle</label>
            <input type="text" id="vehicule-modele" placeholder="Entrez le modèle" v-model="formData.vehicule.modele">
          </div>
          <div class="input-ctn">
            <label for="vehicule-annee">Année</label>
            <input type="number" id="vehicule-annee" placeholder="Entrez l'année du véhicule" v-model="formData.vehicule.annee">
          </div>
          <div class="input-ctn">
            <label for="vehicule-plaque">Plaque d'immatriculation</label>
            <input type="text" id="vehicule-plaque" placeholder="Entrez le numéro d'immatriculation" v-model="formData.vehicule.plaqueImmatriculation">
          </div>
          <div class="input-ctn">
            <label for="vehicule-couleur">Couleur</label>
            <input type="color" id="vehicule-couleur" placeholder="Choisissez la couleur du véhicule" v-model="formData.vehicule.couleur">
          </div>
          <div class="input-ctn">
            <label for="vehicule-places">Nombre de places</label>
            <input type="number" id="vehicule-places" placeholder="Entrez le nombre de places disponibles" v-model.number="formData.vehicule.nbPlaces">
          </div>
          <div class="input-ctn">
            <label for="vehicule-image">Image de la voiture</label>
            <input type="file" id="vehicule-image" @change="handleImageUpload">
            <span v-if="formData.vehicule.image">{{ formData.vehicule.image.name }}</span>
          </div>
          <div class="btn-ctn">
            <button type="button" class="next" @click="scrollToPart('part3')">Suivant</button>
          </div>
        </div>
      </div>

      <div id="part3" class="form-part">
        <div class="title">Tarif</div>
        <div class="separator"></div>
        <div class="content">
          <div class="input-ctn">
            <label for="tarif-passager">Tarif par passager</label>
            <input type="number" id="tarif-passager" placeholder="Proposez un tarif" v-model.number="formData.tarif">
          </div>
          <div class="btn-ctn">
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              <span v-if="isSubmitting">Publication en cours...</span>
              <span v-else>Envoyer</span>
            </button>
          </div>
        </div>
      </div>
    </form>
    <p v-if="submitError" class="error-message">{{ submitError }}</p>
    <p v-if="submitSuccess" class="success-message">{{ submitSuccess }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useVoitureStore } from '../../stores/voiture';
import { useTripStore } from '../../stores/trip';
import { useRouter } from 'vue-router';

const voitureStore = useVoitureStore();
const tripStore = useTripStore();
const userStore = useAuthStore();
const router = useRouter();

const isSubmitting = ref(false);
const submitError = ref(null);
const submitSuccess = ref(null);
const selectedCarImageUrl = ref(null);
import defaultImage from '../../assets/icons/add-image.png';
import apiClient from '../../services/api';
import * as L from 'leaflet';

let map = null;
let markerDepart = null;
let markerArrivee = null;
let searchTimeout = null;

// Nouveaux états pour gérer les suggestions de lieux
const suggestionsDepart = ref([]);
const suggestionsArrivee = ref([]);

const formData = ref({
  departLieu: { nom: '', adresse: '', ville: '', pays: '', latitude: null, longitude: null },
  arriveeLieu: { nom: '', adresse: '', ville: '', pays: '', latitude: null, longitude: null },
  dateDepart: '',
  heureDepart: '',
  arrets: '',
  selectedVehicleId: null,
  vehicule: { 
    marque: '',
    modele: '',
    annee: null,
    plaqueImmatriculation: '',
    couleur: '#000000',
    nbPlaces: null,
    image: null
  },
  tarif: null
});


// Fonction de recherche (qui utilise votre API backend)
const searchLieu = (type, query) => {
console.log("recherche de lieu")
    // Nettoyer les suggestions précédentes du champ opposé
    if (type === 'depart') {
        suggestionsArrivee.value = [];
    } else {
        suggestionsDepart.value = [];
    }

    // Effacer le timer précédent pour appliquer le debounce
    clearTimeout(searchTimeout);

    if (query.length < 3) {
        if (type === 'depart') suggestionsDepart.value = [];
        else suggestionsArrivee.value = [];
        return;
    }

    // Définir un nouveau timer pour n'appeler l'API que 300ms après la dernière frappe
    searchTimeout = setTimeout(async () => {
        try {
            // API Nominatim (OpenStreetMap)
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=10&addressdetails=1&q=${encodeURIComponent(query)}`;
            
            const response = await fetch(nominatimUrl, {
                // Il est recommandé d'inclure un User-Agent pour l'API Nominatim
                headers: {
                    'User-Agent': 'TripShare/1.0 (ancedric55@gmail.com)' 
                }
            });
            
            if (!response.ok) {
                throw new Error(`La recherche de lieu Nominatim a échoué: ${response.statusText}`);
            }

            const results = await response.json();
            
            if (type === 'depart') {
                suggestionsDepart.value = results;
            } else {
                suggestionsArrivee.value = results;
            }
        } catch (error) {
            console.error(`Erreur lors de la recherche de lieu (${type}):`, error);
        }
    }, 300);
};

// Fonction pour récupérer le nom d'un lieu à partir de coordonnées (Reverse Geocoding)
const reverseGeocode = async (lat, lng, type) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    const adresse = data.display_name;
    
    if (type === 'depart') {
      formData.value.departLieu = {
        nom: adresse, adresse, latitude: lat, longitude: lng,
        ville: data.address.city || data.address.town || '',
        pays: data.address.country || ''
      };
    } else {
      formData.value.arriveeLieu = {
        nom: adresse, adresse, latitude: lat, longitude: lng,
        ville: data.address.city || data.address.town || '',
        pays: data.address.country || ''
      };
    }
  } catch (e) {
    console.error("Erreur reverse geocoding", e);
  }
};

const initPublishMap = () => {
  // Initialisation sur Douala comme vous l'aviez prévu
  map = L.map('publish-map').setView([4.05, 9.7], 12); 
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    updateWhenIdle: true
      keepBuffer: 2;
  // 1. Géolocalisation pour le DÉPART
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 15);
      
      markerDepart = L.marker([latitude, longitude], { 
        draggable: true, 
        icon: iconVerte 
      }).addTo(map).bindPopup("Point de départ");
      setTimeout(() => {
          map.invalidateSize();
      }, 400);

      reverseGeocode(latitude, longitude, 'depart');

      markerDepart.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        reverseGeocode(newPos.lat, newPos.lng, 'depart');
      });
    });
  }

  // 2. Clic sur la carte pour définir l'ARRIVÉE (ou déplacer le départ si on veut)
  map.on('click', (e) => {
    if (!markerArrivee) {
      markerArrivee = L.marker(e.latlng, { 
        draggable: true, 
        icon: iconRouge 
      }).addTo(map).bindPopup("Point d'arrivée").openPopup();
    } else {
      markerArrivee.setLatLng(e.latlng);
    }
    reverseGeocode(e.latlng.lat, e.latlng.lng, 'arrivee');
    
    markerArrivee.on('dragend', (ev) => {
      const newPos = ev.target.getLatLng();
      reverseGeocode(newPos.lat, newPos.lng, 'arrivee');
    });
  });
};

// Pour sélectionner une suggestion de lieu
const selectSuggestion = (suggestion, formField) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    formData.value[formField] = {
        nom: suggestion.display_name, 
        adresse: suggestion.display_name, 
        nom_lieu: suggestion.display_name,
        ville: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '',
        pays: suggestion.address?.country || '',
        latitude: lat,
        longitude: lng
    };

    // Déplacer le marqueur correspondant sur la carte
    if (formField === 'departLieu') {
        if (markerDepart) markerDepart.setLatLng([lat, lng]);
        else markerDepart = L.marker([lat, lng], {draggable:true, icon:iconVerte}).addTo(map);
        map.panTo([lat, lng]);
        suggestionsDepart.value = [];
    } else {
        if (markerArrivee) markerArrivee.setLatLng([lat, lng]);
        else markerArrivee = L.marker([lat, lng], {draggable:true, icon:iconRouge}).addTo(map);
        map.panTo([lat, lng]);
        suggestionsArrivee.value = [];
    }
};

// Icônes personnalisées pour différencier Départ (Vert) et Arrivée (Rouge)
const iconVerte = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});
const iconRouge = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const fileInput = ref(null);

onMounted(async  () => {
  initPublishMap();
  voitureStore.fetchMyVoitures(userStore.user.id_user);
  if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    }

    // On attend un petit peu que le DOM soit stable avant d'init la carte
    setTimeout(() => {
        initPublishMap();
    }, 100);

    await voitureStore.fetchMyVoitures(userStore.user.id_user);
});

// Suppression de onUnmounted car Google Maps n'est plus utilisé

const pickImage = () => {
  fileInput.value.click();
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    formData.value.vehicule.image = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedCarImageUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const selectExistingCar = (car) => {
  formData.value.vehicule = {
    marque: car.marque,
    modele: car.modele,
    annee: car.annee,
    plaqueImmatriculation: car.plaque_immatriculation,
    couleur: car.couleur,
    nbPlaces: car.nb_places,
    image: null
  };
  formData.value.selectedVehicleId = car.id_voiture;
  selectedCarImageUrl.value = car.url_image_vehicule ? `http://localhost:3000${car.url_image_vehicule}` : defaultImage;
};

const scrollToPart = (partId) => {
  const element = document.getElementById(partId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const submitTrip = async () => {
  isSubmitting.value = true;
  submitError.value = null;
  submitSuccess.value = null;

  try {
    if (!formData.value.departLieu.latitude || !formData.value.arriveeLieu.latitude) {
      throw new Error('Veuillez **sélectionner** un lieu de départ et d\'arrivée à partir des suggestions pour enregistrer les coordonnées.');
    }
    
    // --- Étape 1: Créer/Récupérer les lieux de départ et d'arrivée
    const departLieu = {
      nom_lieu: formData.value.departLieu.nom,
      adresse: formData.value.departLieu.adresse,
      ville: formData.value.departLieu.ville,
      pays: formData.value.departLieu.pays,
      latitude: formData.value.departLieu.latitude,
      longitude: formData.value.departLieu.longitude
    };
    
    const arriveeLieu = {
      nom_lieu: formData.value.arriveeLieu.nom,
      adresse: formData.value.arriveeLieu.adresse,
      ville: formData.value.arriveeLieu.ville,
      pays: formData.value.arriveeLieu.pays,
      latitude: formData.value.arriveeLieu.latitude,
      longitude: formData.value.arriveeLieu.longitude
    };

    const createdDepartLieu = await apiClient.post('/lieux', departLieu);
    const createdArriveeLieu = await apiClient.post('/lieux', arriveeLieu);
    
    const idLieuDepart = createdDepartLieu.data.lieu.id_lieu;
    const idLieuArrivee = createdArriveeLieu.data.lieu.id_lieu;
    
    // --- Étape 2: Gérer le véhicule ---
    let finalVehicleId = null;

    if (formData.value.selectedVehicleId) {
      finalVehicleId = formData.value.selectedVehicleId;
    } else {
      const newCarData = new FormData();
      newCarData.append('marque', formData.value.vehicule.marque);
      newCarData.append('modele', formData.value.vehicule.modele);
      newCarData.append('annee', formData.value.vehicule.annee);
      newCarData.append('plaque_immatriculation', formData.value.vehicule.plaqueImmatriculation);
      newCarData.append('couleur', formData.value.vehicule.couleur);
      newCarData.append('nb_places', formData.value.vehicule.nbPlaces);
      if (formData.value.vehicule.image) {
        newCarData.append('imageVoiture', formData.value.vehicule.image);
      }

      if (!formData.value.vehicule.marque || !formData.value.vehicule.modele || !formData.value.vehicule.annee || !formData.value.vehicule.plaqueImmatriculation || !formData.value.vehicule.nbPlaces) {
        throw new Error('Veuillez remplir toutes les informations du nouveau véhicule ou en sélectionner un existant.');
      }

      const response = await apiClient.post('/voitures', newCarData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.voiture) {
        finalVehicleId = response.data.voiture.id_voiture;
      }
    }

    if (!finalVehicleId) {
      throw new Error('Impossible d\'associer un véhicule au trajet.');
    }

    // --- Étape 3: Créer le trajet ---
    const tripData = {
      id_lieu_depart: idLieuDepart,
      id_lieu_arrivee: idLieuArrivee,
      date_depart: formData.value.dateDepart,
      heure_depart: formData.value.heureDepart,
      places_disponibles: formData.value.vehicule.nbPlaces,
      prix_par_place: formData.value.tarif,
      id_vehicule: finalVehicleId,
      statut: 'actif'
    };

    if (!tripData.date_depart || !tripData.heure_depart || !tripData.places_disponibles || !tripData.prix_par_place) {
      throw new Error('Veuillez remplir toutes les informations du trajet.');
    }
    if (tripData.prix_par_place <= 0) {
      throw new Error('Le tarif par passager doit être supérieur à zéro.');
    }

    await tripStore.createTrip(tripData);
    submitSuccess.value = 'Trajet publié avec succès !';
    // router.push('/my-published-trips'); // Laissez ceci décommenté lorsque vous êtes prêt
    console.log("Trajet publié. Redirection vers /my-published-trips...");


  } catch (err) {
    submitError.value = err.message || 'Une erreur est survenue lors de la publication du trajet.';
    console.error('Erreur soumission trajet:', err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.add-trip{
    width: 100%;
    background-color:#eee;
    .header{
        padding-top: 70px;
        background-color: #8EACD6;
        padding-bottom: 10px;
        h1 {
            color: #2c3e50;
        }
    }
    form{
        position: relative;
        width: 100%;
        min-height: 1400px;

        .map-container{
            position: absolute;
            top: 20px;
            right: 220px;
            height: 350px;
            width: 35%;
            border-radius: 15px;
            border: 2px solid #8EACD6;
            overflow: hidden;
            z-index: 1;

            #publish-map {
              height: 350px; /* Taille fixe pour être sûr qu'elle s'affiche */
              width: 100%;
              border-radius: 15px;
              border: 2px solid #8EACD6;
              z-index: 1;
            }

            .map-overlay-info {
              position: absolute;
              top: 10px;
              right: 10px;
              background: rgba(255, 255, 255, 0.9);
              padding: 8px 15px;
              border-radius: 20px;
              font-size: 0.8rem;
              font-weight: bold;
              color: #487BFB;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              z-index: 1000;
              pointer-events: none;
            }

            .suggestions-list {
              background: white;
              border: 1px solid #ccc;
              list-style: none;
              padding: 0;
              margin: 0;
              max-height: 200px;
              overflow-y: auto;
              position: absolute;
              width: 100%;
              z-index: 2000;
            }

            .suggestions-list li {
              padding: 10px;
              cursor: pointer;
              border-bottom: 1px solid #eee;
            }

            .suggestions-list li:hover {
              background-color: #f0f0f0;
            }
        }
        .car-img{
            position: absolute;
            top: 40%;
            left: 100px;
            width: 600px;
            height:600px;
            background-image: url('../../assets/images/renault-clio-930.png');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
        }
        .form-part{
            width: 400px;
            border-radius: 12px;
            border: 1px solid #487bfbff;
            background-color: #eee;
            padding: 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-shadow: 0 0 50px rgba(72, 123, 251, .5);

            .title{
                font-weight: 600;
                font-size: 1.2rem;
                margin-bottom: 10px;
            }
            .separator{
                width: 80%;
                height: 1px;
                background-color: #000;
                margin-bottom: 10px;
            }
            .content{
                display: flex;
                flex-direction: column;
                .input-ctn{
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    width: 300px;
                    label{
                        width: 100%;
                        text-align: left;
                        font-weight: 600;
                    }
                    input{
                        height: 30px;
                        background-color: transparent;
                        color: #0e0e0e;
                        border: 1px solid #487BFB;
                        border-radius: 10px;
                        padding-left: 10px;
                    }
                    .suggestions-list {
                        position: absolute;
                        top: 100%;
                        z-index: 1000; /* Assurez-vous qu'elle est au-dessus des autres éléments */
                        background-color: white;
                        border: 1px solid #ccc;
                        list-style: none;
                        padding: 0;
                        margin-top: 5px;
                        width: 100%;
                        max-height: 200px;
                        overflow-y: auto;
                        border-radius: 4px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

                        li {
                            padding: 10px;
                            cursor: pointer;
                            border-bottom: 1px solid #eee;
                            transition: background-color 0.2s;

                            &:hover {
                                background-color: #f0f0f0;
                            }
                        }
                        li:last-child {
                            border-bottom: none;
                        }
                    }
                }
                .btn-ctn{
                    margin-top: 15px;
                    display: flex;
                    justify-content: flex-end;
                    .next{
                        width: 150px;
                        height: 35px;
                        border-radius: 40px;
                        color: #487BFB;
                        background-color: transparent;
                        border: 1px solid #487BFB;
                        cursor: pointer;
                    }
                    .submit-btn{
                        width: 150px;
                        height: 35px;
                        border-radius: 40px;
                        color: #eee;
                        background-color: #487BFB;
                        cursor: pointer;
                    }
                }
            }
            .car-picker{
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 250px;
                height: 150px;
                border: 1px solid #000;
                border-radius: 10px;
                padding: 10px;
                .left{
                    width: 60%;
                    h4{
                        font-size: 0.8rem;
                    }
                    p{
                        font-size: 0.7rem;
                        color: #3b3a3aff;
                    }
                }
                .right{
                    width: 40%;
                    height: 100%;
                    .img-picker{
                        width: 100%;
                        height: 100%;
                        img{
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                        }
                    }
                }
            }
        }
        #part1{
            position: absolute;
            top: 20px;
            left: 200px;
        }
        #part2{
            position: absolute;
            top: 400px;
            right: 200px;
        }
        #part3{
            position: absolute;
            top: 1150px;
            left: 200px;
        }
    }
}
/* Empêche les micro-espaces entre les tuiles de la carte */
:deep(.leaflet-tile-container img) {
    outline: 1px solid transparent;
    box-shadow: 0 0 1px transparent;
}

/* Évite que des transitions CSS globales n'affectent les tuiles */
:deep(.leaflet-tile) {
    transition: none !important;
    filter: inherit;
}

/* Force la carte à prendre toute la place et gère l'affichage */
#publish-map {
    height: 400px;
    width: 100%;
    border-radius: 15px;
    border: 2px solid #8EACD6;
    background-color: #f8f9fa; /* Fond neutre pendant le chargement */
    z-index: 1;
    display: block;
}

</style>