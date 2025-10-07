<template>
    <div>
        <div class="header">
            <h1>Mes trajets</h1>
        </div>
        <div class="container">
            <TripCard 
                v-for="tripWithCar in tripsWithCars"
                :key="tripWithCar.trip.id"
                :trip="tripWithCar.trip"
                :car="tripWithCar.car"
                :driver="userStore.user"
            />
        </div>
    </div>
</template>

<script setup>
    import TripCard from '../../components/trips/TripCard.vue'
    import { ref, computed } from 'vue'
    import { useTripStore } from '../../stores/trip.js'
    import { useAuthStore } from '../../stores/auth.js'
    import { useVoitureStore } from '../../stores/voiture.js'
    
    const trips = ref([])
    const cars = ref([])
    const tripStore = useTripStore()
    const userStore = useAuthStore()
    const carStore = useVoitureStore()
    const userId = userStore.user.id_user
    
    const tripsWithCars = computed(() => {
        if (trips.value.length === 0 || cars.value.length === 0) {
            return [];
        }

        // Pour chaque trajet, trouve la voiture correspondante par son ID
        return trips.value.map(trip => {
            const car = cars.value.find(car => car.id === trip.carId);
            return {
                trip,
                car, 
            };
        });
    });

    const fetchTrips = async () => {
        await tripStore.fetchTrip(userId)
        trips.value = tripStore.trips
    }

    const fetchCars = async () => {
        await carStore.fetchMyVoitures()
        cars.value = carStore.voitures
    }
    // Fonction pour récupérer les données des trajets et des voitures
    const fetchData = async () => {
        await fetchTrips();
        await fetchCars();
    }

    fetchData();
    
    defineExpose({
        trips
    })

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
    padding: 20px;
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
}
</style>