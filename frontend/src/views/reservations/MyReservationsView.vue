<template>
    <div>
        <div class="header">
            <h1>Mes Réservations</h1>
        </div>
        <div v-if="loadingDetails || tripStore.loading" class="container">
            <p>Chargement des trajets et des détails...</p>
        </div>
        <div v-else class="container">
            <ReservationCard 
                v-for="reservation in reservations"
                :key="reservation.id_reservation"
                :reservationId="reservation.id_reservation"
                :trip="reservation.trip_details"
                :driver="reservation.user_details"
            />
        </div>
    </div>
</template>

<script setup>
import ReservationCard from '../../components/reservations/reservationCard.vue'
    import { computed, onMounted, ref } from 'vue'
    import { useTripStore } from '../../stores/trip.js'
    import { useAuthStore } from '../../stores/auth.js'
    import { useVoitureStore } from '../../stores/voiture.js'
    
    // Initialisation des stores
    const tripStore = useTripStore()
    const userStore = useAuthStore()

    const userId = computed(() => userStore.user?.id_user);
    const reservations = ref(null)
    const loadingDetails = ref(false)

/*const reservations = async (reservationsData) => {
        if (!reservationsData || reservationsData.length === 0) {
            return [];
        }

        loadingDetails.value = true;
        
        try {
            const detailPromises = reservationsData.map(async reservation => {
                const user = await userStore.getUser(reservation.utilisateur_id_user) 
                const car = await carStore.fetchVoiture(reservation.id_vehicule)

                return {
                    reservation,
                    car, 
                    user,
                };
            });

            const results = await Promise.all(detailPromises);
            console.log(results)
            return results;

        } catch (e) {
            console.error("Erreur lors de l'enrichissement des trajets:", e);
            return [];
        } finally {
            loadingDetails.value = false;
        }
    }

    const fetchData = async () => {
        if (userId.value) {
            try {
                await tripStore.fetchReservations(userId.value) 
                enrichedData.value = await enrichedReservations(tripStore.reservations)
                console.log(enrichedData.value)
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error)
                // Gérer l'erreur (affichage d'un message utilisateur)
            }
        }
    }
*/
    onMounted(async () => {
        await tripStore.fetchReservations(userId.value) 
        reservations.value = tripStore.reservations
        console.log('reservations: ', reservations.value)
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
.container {
    min-height: 59vh;
    padding: 20px;
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
}
</style>