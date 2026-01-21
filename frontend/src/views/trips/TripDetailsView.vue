<template>
  <div>
    <div class="header">
      <h1>Détails du trajet</h1>
    </div>
    <!-- Afficher le contenu seulement si le trajet a été chargé -->
    <div v-if="trip" class="container">
      <div class="details">
        <div class="top">
          <div class="profile-photo">
            <img :src="trip.conducteur.photo_profil || defaultAvatar" alt="Photo du conducteur" />
          </div>
          <div class="infos">
            <div class="info-top">
              <div class="user-name">
                {{ trip.conducteur.prenom }} {{ trip.conducteur.nom }}
              </div>
              <div class="stars">
                <!-- S'assurer que StarRating reçoit un nombre pour la note -->
                <StarRating :rating="parseInt(trip.conducteur.evaluation_moyenne) || 0" />
              </div>
            </div>
            <div class="info-bottom">
              <p class="car-info">
                {{ trip.vehicule_details.plaque_immatriculation }} |
                {{ trip.vehicule_details.marque }}
                {{ trip.vehicule_details.modele }} | {{ trip.vehicule_details.annee }}
              </p>
            </div>
          </div>
        </div>
        <div class="middle">
          <div class="car-img">
            <img :src="trip.vehicule_details.image || defaultCar" alt="Photo du vehicule" />
          </div>
          <div class="contact-driver">
            <p>Contactez le conducteur</p> <img src="../../assets/icons/chat_dotted.png" alt="">
            <!-- Remplacer l'icône statique par un bouton cliquable pour une meilleure UX -->
          </div>
        </div>
        <div class="bottom">
          <!-- Les séparateurs semblent être des éléments de style dans votre CSS original -->
          <div class="separator-1"></div>
          <div class="separator-2"></div>
          <div class="trip-data">
            <h4 class="title">Départ</h4>
            <p class="adress">
              {{ trip.lieu_depart_details.adresse }}
            </p>
            <h4 class="date-time">Date départ : {{ trip.date_depart.split('T')[0] }}</h4>
            <h4 class="date-time"> Heure départ : {{ trip.heure_depart }}</h4>
            <p class="stops"></p>
          </div>
          <div class="trip-data">
            <h4 class="title">Arrivée</h4>
            <p class="adress">
              {{ trip.lieu_arrivee_details.adresse }}
            </p>
            <h4 class="date-time">{{ trip.date_arrivee }}</h4>
            <h4 class="date-time">{{ trip.heure_arrivee }}</h4>
          </div>
          <div class="tarrif">
            <div class="price">
              <p class="amoount">{{ trip.prix_par_place }}</p>
              <p class="currency">XAF</p>
            </div>
            <p class="places-disp">Places disponibles : {{ trip.places_disponibles }}</p>
            <button @click="handleJoinTrip" class="explore-btn">Rejoindre</button>
          </div>
        </div>
        <!-- C'est ici que la carte Leaflet sera initialisée -->
        <div id="map-container" class="map"></div>
        <div class="rate">
          <StarRatingInput/>
        </div>
      </div>
      
      <div class="comments">
        <Comments :tripId="trip.id_trajet" :driverId="trip.conducteur.id_user" />
      </div>
    </div>
    <!-- Message de chargement ou d'erreur -->
    <div v-else-if="loading" class="loading-message">Chargement des détails du trajet...</div>
    <div v-else-if="error" class="error-message">Erreur : {{ error }}</div>
    <div v-else class="not-found-message">Le trajet n'a pas été trouvé.</div>
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useAuthStore } from '../../stores/auth.js';
  import { useTripStore } from '../../stores/trip.js';
  import defaultAvatar from '../../assets/images/Default-avatar.png'
  import defaultCar from '../../assets/images/default-car.webp'
  import StarRating from '../../components/common/rating/StarRating.vue';
  import StarRatingInput from '../../components/common/rating/StarRatingInput.vue';
  import Comments from '../../components/common/comments/index.vue'
  
  // Importer Leaflet et son CSS (critique pour l'affichage)
  import * as L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import 'leaflet-routing-machine';

  const route = useRoute();
  const tripStore = useTripStore();
  const userStore = useAuthStore()
  const trip = ref(null);
  const loading = ref(false);
  const error = ref(null);

  let map = null;
  
  // CORRECTION CRITIQUE 1: Corriger le chemin des icônes Leaflet
  // Ceci est nécessaire car le bundler casse souvent les chemins d'images par défaut de Leaflet
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  
  // Fonction pour initialiser la carte et tracer l'itinéraire avec Leaflet
  const initMap = () => {
    if (!trip.value || !trip.value.lieu_depart_details || !trip.value.lieu_arrivee_details) {
      console.warn("Détails du trajet manquants pour l'initialisation de la carte.");
      return;
    }
    
    // Si la carte existe déjà (par exemple lors d'un re-chargement), on la nettoie
    if (map) {
      map.remove();
      map = null;
    }

    const startLat = parseFloat(trip.value.lieu_depart_details.latitude);
    const startLng = parseFloat(trip.value.lieu_depart_details.longitude);
    const endLat = parseFloat(trip.value.lieu_arrivee_details.latitude);
    const endLng = parseFloat(trip.value.lieu_arrivee_details.longitude);

    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
      console.error("Coordonnées de départ/arrivée invalides. Vérifiez les données du trajet.");
      return;
    }

    // 1. Initialiser la carte Leaflet
    const startPoint = L.latLng(startLat, startLng);
    map = L.map('map-container').setView(startPoint, 12);

    // 2. Ajouter la couche de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // CORRECTION CRITIQUE 2: Recalibrer la taille de la carte. 
    // Ceci corrige les tuiles désordonnées et les zones vides.
    map.invalidateSize(); 

    // 3. Tracer l'itinéraire avec Leaflet Routing Machine
    L.Routing.control({
      waypoints: [
        startPoint,
        L.latLng(endLat, endLng)
      ],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      dargableWaypoints: false,
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1' // Service OSRM
      }),
      // Style de la ligne de l'itinéraire
      lineOptions: {
        styles: [{ color: '#487BFB', weight: 6, opacity: 0.7 }]
      },
      fitSelectedRoutes: true // S'assurer que la vue englobe tout l'itinéraire
    }).addTo(map);
  };

  const handleJoinTrip = () => {
    // Utiliser console.log au lieu d'alert
    if (!trip.value) return; 
    
    const tripId = trip.value.id_trajet;
    tripStore.addParticipantToTrip(tripId, userStore.user.id_user)
      .then(() => {
        alert('Vous avez rejoint le trajet avec succès !');
        // Remplacer l'alert par un modal UI
      })
      .catch(err => {
        console.error('Erreur lors de la participation au trajet:', err);
        // Remplacer l'alert par un modal UI
        console.log('Échec de la participation au trajet. Veuillez réessayer plus tard.');
      });
  }

  const loadDetails = async () => {
    loading.value = true;
    error.value = null;
    const tripId = route.params.id;
    if (tripId) {
      try {
        await tripStore.fetchTripDetails(tripId);
        trip.value = tripStore.currentTrip;
      } catch (err) {
        error.value = err.message || 'Échec de la récupération des détails du trajet.';
        console.error(err);
      } finally {
        loading.value = false;
      }
    }
  };

  watch(trip, (newTrip) => {
    if (newTrip) {
      // CORRECTION CRITIQUE 3: Utiliser setTimeout pour s'assurer que le DOM a rendu 
      // le conteneur de la carte (après la résolution du v-if)
      setTimeout(initMap, 0); 
    }
  }, { immediate: true });

  onMounted(loadDetails);

  onUnmounted(() => {
    // Nettoyer l'instance de la carte Leaflet lors du démontage du composant
    if (map) {
      map.remove();
      map = null;
    }
  });
</script>

<style scoped>
    /* Importation des styles Leaflet et Leaflet Routing Machine */
    @import 'leaflet/dist/leaflet.css';
    @import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

    .header{
      padding-top: 70px;
      background-color: #8EACD6;
      padding-bottom: 10px;
    }
    .container {
      min-height: 59vh;
      padding: 20px;
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      gap: 30px;

      .details {
        width: 630px;
        padding: 20px;
        background-color: #eee;
        border-radius: 12px;
        box-shadow: 0 0 50px rgba(0,0,0,0.3);

        .top{
          display: flex;
          justify-content: space-between;
          align-items: center;
          .profile-photo{
            width: 40px;
            border-radius: 50%;
            overflow: hidden;
            img{
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }
          .infos{
            width:100%;
            padding: 0;
            .info-top{
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin:0;
              .user-name{
                margin: 0;
                padding: 0;
                padding-left: 15px;
                width: 100%;
                height: 20px;
                font-weight: 600;
                text-align: left;
              }
            }
            .info-bottom{
              width: 100%;
              margin: 0;
              p{
                color: #5C5B5B;
                font-size: 1rem;
              }
            }
          }
        }
        .middle{
          width: 100%;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          .car-img{
            width: 90%;
            height: 50vh;
            margin: 5px;
            background-color: #bebdbd;
            border-radius: 12px;
            overflow: hidden;

            img{
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }
          .contact-driver, .comment, .rate{
            display: flex;
            justify-content: space-around;
            align-items: center;
            width: 95%;
            margin: 10px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;

            img{
              cursor: pointer;
            }
          }
        }
        .bottom{
          position: relative;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 5px;
          padding: 0;

          .separator-1, .separator-2{
            width: 1px;
            height: 80px;
            background-color: #586079ff;
          }
          .separator-1{
            position: absolute;
            top: 60px;
            left: 35%;
          }
          .separator-2{
            position: absolute;
            top: 60px;
            left: 68%;
          }
          .trip-data, .tarrif{
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            gap: 5px;
            width: 30%;
            .title{
              font-weight: 600;
              color: #2b2727ff;
              height: 2px;
              padding: 0;
            }
            .adress{
              color: #5C5B5B;
              font-size: 0.8rem;
              height: 25px;
              padding: 0;
              padding-bottom: 20px;
            }
            .date-time, .stops{
              color: #5C5B5B;
              font-size: 0.7rem;
              padding: 0;
              margin: 0;
            }
            .price{
              display: flex;
              justify-content: center;
              align-items: center;
              color: #5C5B5B;
            }
            .places-disp{
              font-size: 0.7rem;
            }
            .explore-btn{
              width: 80%;
              height: 30px;
              background-color: #487BFB;
              color: #eee;
              text-decoration: none;
              padding-top: 5px;
              border: none;
              border-radius: 30px;
              transition: all .3s ease-in-out;
              &:hover{
                background-color: #91affaff;
              }
            }
          }
        }
      .map{
        width: 100%;
        height: 400px;
        border: 1px solid #ccc;
        border-radius: 12px;
        margin: 10px 0;
        /* Le background-color: #bebdbd; ne sera plus visible après l'initialisation de Leaflet */
      }
      /* Surcharger les styles pour corriger l'affichage des tuiles Leaflet */
      .map :deep(.leaflet-container) {
          border-radius: 12px;
      }
    }
    .comments{
      width: 35%;
      min-height: 100px;
      border-radius: 12px;
      background-color: #5C5B5B;
    }
  }
  :deep(.leaflet-routing-container) {
    display: none !important;
  }
</style>