<template>
  <div class="ctn" v-if="trip">
    <div class="top">
      <div class="profile-photo">
        <img :src="driver.photo_profil || defaultAvatar" alt="Photo du conducteur" />
      </div>
      <div class="infos">
        <div class="info-top">
          <div class="user-name">{{ driver.prenom }} {{ driver.nom }}</div>
        </div>
      </div>
    </div>
    <div class="bottom">
           <div class="separator"></div>
      <div class="trip-data">
        <h4 class="title">Départ</h4>
          <h4 class="date-time">{{ trip.date_depart.split('T')[0] }}</h4>
          <h4 class="date-time">{{ trip.heure_depart }}</h4>
      </div>
      <div class="tarrif">
          <div class="price">
            <p class="amoount">{{ trip.prix_par_place }}</p>
            <p class="currency">XAF</p>
          </div>
          <p class="places-disp">Places disponibles : {{ trip.places_disponibles }}</p>
        <router-link :to="`/trip/${trip.id_trajet}`" class="explore-btn">Voir plus</router-link>
        <button @click="handleDismiss" class="cancel-btn">Annuler</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import defaultAvatar from '../../assets/images/Default-avatar.png'
import apiClient from '../../services/api'

// Définition des props avec les types de données appropriés
const props = defineProps({
  reservationId: {
    type: Number,
    required: true,
  },
  trip: {
    type: Object,
    required: true,
  },
  driver: {
    type: Object,
    required: true,
  }
});

const handleDismiss = async () => {
    try{
        const res = await apiClient.delete(`reservations/${props.reservationId}`)
        if(!res.data.reservation){
            console.log("Echec de la suppression de réservation")
        }
        console.log("Suppression réussie!!", res.data)
    }catch(err){
        console.error("Une erreur est survenue lors de l'annulation de la réservation: ", err)
    }
    
}
</script>

<style scoped>
.ctn {
    width: 300px;
    min-height: 200px;
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
            border-radius: 50px;
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
                    font-size: 0.8rem;
                }
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
                font-size: 0.6rem;
                height: 25px;
                padding: 0;
            }
            .date-time, .stops{
                color: #5C5B5B;
                font-size: 0.5rem;
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
                font-size: 0.6rem;
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
            .cancel-btn{
                width: 80%;
                height: 30px;
                background-color: #cf0c2cff;
                color: #eee;
                text-decoration: none;
                padding-top: 5px;
                border: none;
                border-radius: 30px;
                transition: all .3s ease-in-out;
                &:hover{
                    background-color: #f05c69ff;
                }
            }
        }
    }
}
</style>