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
            <img :src="trip.conducteur.photo_profil" alt="Photo du conducteur" />
          </div>
          <div class="infos">
            <div class="info-top">
              <div class="user-name">
                {{ trip.conducteur.prenom }} {{ trip.conducteur.nom }}
              </div>
              <div class="stars">
                <StarRating :rating="parseInt(trip.conducteur.evaluation_moyenne)" />
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
            <img :src="trip.vehicule_details.image" alt="Photo du vehicule" />
          </div>
          <div class="contact-driver">
            <p>Contactez le conducteur</p> <img src="../../assets/icons/chat_dotted.png" alt="">
          </div>
          <div class="contact-driver">
            <p>Contactez le conducteur</p> <img src="../../assets/icons/chat_dotted.png" alt="">
          </div>
        </div>
        <div class="bottom">
          <div class="separator-1"></div>
          <div class="separator-2"></div>
          <div class="trip-data">
            <h4 class="title">Départ</h4>
            <p class="adress">
              {{ trip.lieu_depart_details.ville }}
              {{ trip.lieu_depart_details.adresse }}
              {{ trip.lieu_depart_details.nom_lieu }}
            </p>
            <h4 class="date-time">{{ trip.date_depart }}</h4>
            <h4 class="date-time">{{ trip.heure_depart }}</h4>
            <p class="stops"></p>
          </div>
          <div class="trip-data">
            <h4 class="title">Arrivée</h4>
            <p class="adress">
              {{ trip.lieu_arrivee_details.ville }}
              {{ trip.lieu_arrivee_details.adresse }}
              {{ trip.lieu_arrivee_details.nom_lieu }}
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
  import { useTripStore } from '../../stores/trip.js';
  import StarRating from '../../components/common/rating/StarRating.vue';
  import StarRatingInput from '../../components/common/rating/StarRatingInput.vue';
  import Comments from '../../components/common/comments/index.vue'

  const route = useRoute();
  const tripStore = useTripStore();
  const trip = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; 

  let map = null;
  let directionsService = null;
  let directionsRenderer = null;
  let mapScript = null;

  // Fonction pour charger le script de l'API Google Maps
  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      if (document.getElementById('google-maps-script')) {
        resolve();
        return;
      }
      mapScript = document.createElement('script');
      mapScript.id = 'google-maps-script';
      mapScript.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`;
      mapScript.async = true;
      mapScript.defer = true;
      mapScript.onload = resolve;
      mapScript.onerror = reject;
      document.head.appendChild(mapScript);
    });
  };

  // Fonction pour initialiser la carte et tracer l'itinéraire
  const initMap = async () => {
    if (!trip.value || !trip.value.lieu_depart_details || !trip.value.lieu_arrivee_details) {
      return;
    }
    
    try {
      await loadGoogleMapsScript();
      
      // Créer une nouvelle instance de la carte
      map = new google.maps.Map(document.getElementById('map-container'), {
        zoom: 10,
        center: {
          lat: parseFloat(trip.value.lieu_depart_details.latitude),
          lng: parseFloat(trip.value.lieu_depart_details.longitude)
        }
      });

      // Initialiser les services de directions
      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(map);

      const origin = {
        lat: parseFloat(trip.value.lieu_depart_details.latitude),
        lng: parseFloat(trip.value.lieu_depart_details.longitude)
      };
      const destination = {
        lat: parseFloat(trip.value.lieu_arrivee_details.latitude),
        lng: parseFloat(trip.value.lieu_arrivee_details.longitude)
      };

      // Requête pour l'itinéraire
      const request = {
        origin: origin,
        destination: destination,
        travelMode: 'DRIVING'
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
        } else {
          console.error('Erreur de tracé de l\'itinéraire:', status);
        }
      });

    } catch (err) {
      console.error('Échec du chargement de l\'API Google Maps:', err);
    }
  };

  const handleJoinTrip = () => {
    const tripId = trip.value.id_trajet;
    tripStore.addParticipantToTrip(tripId)
      .then(() => {
        alert('Vous avez rejoint le trajet avec succès !');
      })
      .catch(err => {
        console.error('Erreur lors de la participation au trajet:', err);
        alert('Échec de la participation au trajet. Veuillez réessayer plus tard.');
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
      initMap();
    }
  }, { immediate: true });

  onMounted(loadDetails);

  onUnmounted(() => {
    if (mapScript) {
      document.head.removeChild(mapScript);
      mapScript = null;
    }
    map = null;
    directionsService = null;
    directionsRenderer = null;
  });
</script>

<style scoped>
    .header{
        padding-top: 70px;
        background-color: #8EACD6;
        padding-bottom: 10px;
    }
    .container {
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
                    height: 40px;
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
                    height: 40px;
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
                            font-size: 0.7rem;
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
            border-radius: 12px;
            margin: 10px 0;
            background-color: #bebdbd;
          }
        }
        .comments{
          width: 35%;
          min-height: 100px;
          border-radius: 12px;
          background-color: #5C5B5B;
        }
    }
</style>