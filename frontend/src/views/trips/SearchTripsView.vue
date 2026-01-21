<template>
    <div>
        <div class="header">
            <h1>Trajets publiés</h1>
        </div>
        
        <form @submit.prevent="handleSubmit">
            <div class="head">
                <h4 class="filter-title">Filtrer les trajets</h4>
            </div>
            <div class="form-body">
                <div class="form-input">
                    <label for="filter-select">Sélectionnez un filtre</label>
                    <select id="filter-select" class="input" v-model="filter">
                        <option value="" disabled>Choisissez un filtre</option>
                        <option value="proximite">À proximité de moi (km)</option>
                        <option value="lieu_depart">Lieu de départ </option>
                        <option value="lieu_arrivee">Lieu d'arrivée </option>
                        <option value="date_depart">Date de départ </option>
                        <option value="prix_trajet">Prix du trajet </option>
                    </select>
                </div>
                
                <div class="form-input">
                    <label for="filter-value">Valeur</label>
                    <input id="filter-value"
                           :type="filter === 'date_depart' ? 'date' : 'text' " 
                           class="input" 
                           v-model="value"
                           :placeholder="filter ? `Entrez la valeur pour ${filter}` : 'Sélectionnez un filtre d\'abord'"
                           :disabled="!filter"
                    >
                </div>
                
                <div class="form-input">
                    <button type="submit" class="submission" :disabled="!filter || !value">
                        Chercher
                    </button>
                    <!-- Nouveau bouton pour réinitialiser le filtre -->
                    <button type="button" @click="resetFilters" class="" :disabled="!filter && !value">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.133C6.7 4.493 8.35 4 10 4s3.3.493 5 1.133V3a1 1 0 112 0v5h-2V6.133C13.3 5.493 11.65 5 10 5s-3.3.493-5 1.133V8H3V3a1 1 0 011-1z" clip-rule="evenodd" />
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-4-9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
                        </svg>
                    </button>
                </div>
            </div>
        </form>

        <div v-if="loadingDetails || tripStore.loading" class="container">
            <p>Chargement des trajets et des détails...</p>
        </div>
        <div v-else-if="filteredTripsWithDetails.length === 0" class="container">
            <p>Aucun trajet trouvé pour le moment correspondant à ce filtre.</p>
        </div>

        <div v-else v-for="item in filteredTripsWithDetails" :key="item.trip.id_trajet">
            <p v-if="item.distance" style="color: blue; font-weight: bold;">
            📍 À {{ item.distance.toFixed(1) }} km
            </p>
            <TripCard :trip="item.trip" :car="item.car" :driver="item.user" />
        </div>
    </div>
</template>

<script setup>
    import TripCard from '../../components/trips/TripCard.vue'
    import { onMounted, ref, watch } from 'vue' 
    import { useTripStore } from '../../stores/trip.js'
    import { useAuthStore } from '../../stores/auth.js'
    import { useVoitureStore } from '../../stores/voiture.js'
    
    const tripStore = useTripStore()
    const userStore = useAuthStore()
    const carStore = useVoitureStore()

    const filter = ref("")
    const value = ref("")
    const userCoords = ref(null);

    const allTripsWithDetails = ref([]) 
    const filteredTripsWithDetails = ref([]) 
    const loadingDetails = ref(false) 

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Rayon de la terre en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    const enrichTripsWithDetails = async (tripsData) => {
        if (!tripsData || tripsData.length === 0) return [];
        loadingDetails.value = true;
        
        try {
            const detailPromises = tripsData.map(async trip => {
                const user = await userStore.getUser(trip.utilisateur_id_user);
                const car = await carStore.fetchVoiture(trip.id_vehicule);
                
                let distance = null;
                if (userCoords.value && trip.lieu_depart_details) {
                    distance = calculateDistance(
                        userCoords.value.lat, 
                        userCoords.value.lng,
                        parseFloat(trip.lieu_depart_details.latitude),
                        parseFloat(trip.lieu_depart_details.longitude)
                    );
                }

                return { trip, car, user, distance };
            });

            const results = await Promise.all(detailPromises);
            
            // Tri automatique par proximité
            return results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        } catch (e) {
            console.error("Erreur d'enrichissement:", e);
            return [];
        } finally {
            loadingDetails.value = false;
        }
    }

    /**
     * Lance le chargement initial des données.
     */
    const fetchData = async () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    userCoords.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    await loadTrips();
                },
                async () => {
                    console.warn("Géolocalisation refusée");
                    await loadTrips();
                }
            );
        } else {
            await loadTrips();
        }
    }

    // Créez cette fonction séparée pour éviter la répétition
    const loadTrips = async () => {
        try {
            await tripStore.fetchAllTrips();
            const enrichedData = await enrichTripsWithDetails(tripStore.allTrips);
            allTripsWithDetails.value = enrichedData;
            filteredTripsWithDetails.value = enrichedData;
        } catch (error) {
            console.error("Erreur:", error);
        }
    }
    
    // --- LOGIQUE DE FILTRAGE CÔTÉ CLIENT ---
    
    const applyFilter = () => {
        const currentFilter = filter.value.trim();
        const currentValue = String(value.value).trim().toLowerCase();

        // 1. Pas de filtre ou valeur vide : afficher tout
        if (!currentFilter || !currentValue) {
            filteredTripsWithDetails.value = allTripsWithDetails.value;
            return;
        }

        // 2. Filtrer les données originales
        filteredTripsWithDetails.value = allTripsWithDetails.value.filter(item => {
            const trip = item.trip;
            let tripValue = null;

            switch (currentFilter) {
                case 'proximite':
                    if (!item.distance) return false;
                    const maxDist = parseFloat(currentValue) || 50; // 50km par défaut
                    return item.distance <= maxDist;
                    break;
                case 'lieu_depart':
                    tripValue = `${trip.lieu_depart_details?.ville || ''} ${trip.lieu_depart_details?.adresse || ''}`.toLowerCase();
                    break;
                case 'lieu_arrivee':
                    tripValue = `${trip.lieu_arrivee_details?.ville || ''} ${trip.lieu_arrivee_details?.adresse || ''}`.toLowerCase();
                    break;
                case 'date_depart':
                    tripValue = trip.date_depart;
                    break;
                case 'prix_trajet':
                    const price = parseFloat(trip.prix_par_place);
                    const filterPrice = parseFloat(currentValue);
                    
                    if (isNaN(price) || isNaN(filterPrice)) return false;
                    
                    return price <= filterPrice; 
                default:
                    return true;
            }

            // Logique de comparaison générale (sauf pour le prix géré ci-dessus)
            if (currentFilter === 'prix_trajet') {
                 return true; 
            }
            
            if (tripValue) {
                return tripValue.includes(currentValue);
            }

            return false;
        });
    }

    const handleSubmit = () => {
        applyFilter();
    }
    
    const resetFilters = () => {
        filter.value = "";
        value.value = "";

        filteredTripsWithDetails.value = allTripsWithDetails.value;
    }

    onMounted(fetchData);

    // OPTIONNEL : Vous pourriez utiliser un watcher pour appliquer le filtre 
    // en temps réel dès que l'utilisateur tape, au lieu d'attendre le clic sur "Chercher".
    watch([filter, value], () => {
        applyFilter();
    });
</script>

<style scoped>
.header{
    padding-top: 70px;
    background-color: #8EACD6;
    padding-bottom: 10px;
}
.header h1 {
    color: #2c3e50;
    text-align: center;
}
form{
        display: flex;
        flex-direction:column;
        justify-content: center;
        align-items: center;
        gap: 20px;
        width: 100%;
        border: 1px solid #8EACD6;
        border-radius: 12px;
        background-color: #f5f5f5;
        .head{
            width: 100%;
            text-align: center;
            color: #8EACD6;
        }
        .form-body{
            width: 100%;
            display: flex;
            justify-content: space-around;
            align-items: center;
            gap: 15px;

            .form-input{
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                padding:10px;
                gap: 30px;

                label{
                    width: 25%;
                    text-align: left;
                }
                .input{
                    width: 25%;
                    height: 30px;
                    background-color: transparent;
                    border: 1px solid #487BFB;
                    border-radius: 12px;
                    padding-left: 20px;
                    color: #333;
                }
                .submission{
                    width: 25%;
                    height: 40px;
                    background-color: #487BFB;;
                    color: #eee;
                    border-radius: 12px;
                    cursor: pointer;
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
.container {
    min-height: 59vh;
    padding: 20px;
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}
</style>