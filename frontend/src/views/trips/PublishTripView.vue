<template>
  <div class="add-trip">
    <div class="header">
      <h1>Publier un trajet</h1>
    </div>
    <form @submit.prevent="submitTrip">
      <div class="map"></div>
      <div class="car-img"></div>

      <div id="part1" class="form-part">
        <div class="title">Informations sur le trajet</div>
        <div class="separator"></div>
        <div class="content">
          <div class="input-ctn">
            <label for="depart-lieu">Lieu de départ</label>
            <input
              type="text"
              id="depart-lieu"
              placeholder="Choisissez un point de départ"
              v-model="formData.departLieu.nom"
            >
          </div>
          <div class="input-ctn">
            <label for="arrivee-lieu">Lieu d'arrivée</label>
            <input
              type="text"
              id="arrivee-lieu"
              placeholder="Choisissez un lieu d'arrivée"
              v-model="formData.arriveeLieu.nom"
            >
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
              <p v-else-if="voitureStore.voitures.length === 0">Vous n'avez aucun véhicule enregistré. Veuillez en ajouter un ci-dessous.</p>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useVoitureStore } from '../../stores/voiture';
import { useTripStore } from '../../stores/trip';
import { useRouter } from 'vue-router';
import axios from 'axios';

const voitureStore = useVoitureStore();
const tripStore = useTripStore();
const router = useRouter();

const isSubmitting = ref(false);
const submitError = ref(null);
const submitSuccess = ref(null);
const selectedCarImageUrl = ref(null);
import defaultImage from '../../assets/icons/add-image.png';

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

let autocompleteDepart;
let autocompleteArrivee;
let googleMapsScript;

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-maps-places-script')) {
      resolve();
      return;
    }
    googleMapsScript = document.createElement('script');
    googleMapsScript.id = 'google-maps-places-script';
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
    googleMapsScript.async = true;
    googleMapsScript.defer = true;
    googleMapsScript.onload = resolve;
    googleMapsScript.onerror = reject;
    document.head.appendChild(googleMapsScript);
  });
};

const initAutocomplete = async () => {
  await loadGoogleMapsScript();
  const departInput = document.getElementById('depart-lieu');
  const arriveeInput = document.getElementById('arrivee-lieu');

  if (departInput && google.maps && google.maps.places) {
    autocompleteDepart = new google.maps.places.Autocomplete(departInput);
    autocompleteDepart.addListener('place_changed', () => {
      const place = autocompleteDepart.getPlace();
      if (place.geometry) {
        updateLocationData(place, 'departLieu');
      }
    });
  }

  if (arriveeInput && google.maps && google.maps.places) {
    autocompleteArrivee = new google.maps.places.Autocomplete(arriveeInput);
    autocompleteArrivee.addListener('place_changed', () => {
      const place = autocompleteArrivee.getPlace();
      if (place.geometry) {
        updateLocationData(place, 'arriveeLieu');
      }
    });
  }
};

const updateLocationData = (place, type) => {
  const addressComponents = place.address_components;
  let ville = '';
  let pays = '';
  let adresse = place.name;

  for (const component of addressComponents) {
    if (component.types.includes('locality')) {
      ville = component.long_name;
    }
    if (component.types.includes('country')) {
      pays = component.long_name;
    }
    if (component.types.includes('route') || component.types.includes('street_number')) {
      adresse = place.formatted_address;
    }
  }

  formData.value[type] = {
    nom: place.name,
    adresse: adresse,
    ville: ville,
    pays: pays,
    latitude: place.geometry.location.lat(),
    longitude: place.geometry.location.lng()
  };
};

const fileInput = ref(null);

onMounted(() => {
  voitureStore.fetchMyVoitures();
  initAutocomplete();
});

onUnmounted(() => {
  if (googleMapsScript) {
    document.head.removeChild(googleMapsScript);
  }
});

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
      throw new Error('Veuillez sélectionner un lieu de départ et d\'arrivée à partir des suggestions.');
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

    const createdDepartLieu = await axios.post('/api/lieux', departLieu);
    const createdArriveeLieu = await axios.post('/api/lieux', arriveeLieu);
    
    const idLieuDepart = createdDepartLieu.data.id_lieu;
    const idLieuArrivee = createdArriveeLieu.data.id_lieu;
    
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

      const response = await axios.post('/api/voitures', newCarData, {
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
    router.push('/my-published-trips');

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

        .map{
            position: absolute;
            top: 20px;
            right: 220px;
            width: 400px;
            height:360px;
            border-radius: 12px;
            background-image: url('../../assets/images/map.jpg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
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


</style>