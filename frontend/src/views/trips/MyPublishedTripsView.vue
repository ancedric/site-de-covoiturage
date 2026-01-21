<template>
    <div>
        <div class="header">
            <h1>Mes trajets</h1>
        </div>
        
        <!-- Affichage de l'état de chargement ou d'absence de données -->
        <div v-if="tripStore.loading || carStore.loading" class="container">
            <p>Chargement des trajets et des véhicules...</p>
        </div>
        <div v-else-if="tripsWithCars.length === 0" class="container">
            <p>Aucun trajet trouvé pour le moment.</p>
        </div>

        <!-- Liste des trajets (utilise les données réactives du computed) -->
        <div v-else class="container">
            <TripCard 
                v-for="tripWithCar in tripsWithCars"
                :key="tripWithCar.trip.id_trajet"
                :trip="tripWithCar.trip"
                :car="tripWithCar.car"
                :driver="userStore.user"
            />
        </div>
    </div>
</template>

<script setup>
    import TripCard from '../../components/trips/TripCard.vue'
    import { computed, onMounted } from 'vue'
    import { useTripStore } from '../../stores/trip.js'
    import { useAuthStore } from '../../stores/auth.js'
    import { useVoitureStore } from '../../stores/voiture.js'
    
    // Initialisation des stores
    const tripStore = useTripStore()
    const userStore = useAuthStore()
    const carStore = useVoitureStore()

    const userId = computed(() => userStore.user?.id_user);

    /**
     * Calcule le tableau des trajets enrichis avec leur voiture correspondante.
     * Lit directement l'état réactif des stores.
     */
    const tripsWithCars = computed(() => {
        const tripsData = tripStore.trips


        // Si l'une des sources est vide, retourner un tableau vide
        if (!tripsData || tripsData.length === 0 ) {
            return [];
        }

        return tripsData.map(trip => {
            const car = trip.vehicule_details

            return {
                trip,
                car, 
            };
        });
    });

    /**
     * Lance le chargement des données.
     */
    const fetchData = async () => {
        if (userId.value) {
            try {
                await tripStore.fetchTrip(userId.value) 
                await carStore.fetchMyVoitures() 
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error)
                // Gérer l'erreur (affichage d'un message utilisateur)
            }
        }
    }

    // Le hook onMounted garantit que le composant est prêt avant le fetch.
    onMounted(() => {
        fetchData();
    });

    // L'expose n'est plus nécessaire car vous utilisez les données dans le template.
    // defineExpose({ trips }) 

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
.container {
    min-height: 59vh;
    padding: 20px;
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
}
</style>