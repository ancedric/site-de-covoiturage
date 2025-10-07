<template>
    <div>
        <Banner/>
        <div class="search">
            <SearchComponent/>
        </div>
        <div class="roadmap">
            <div class="content">
                <div class="top">
                    <div class="head">
                        <p class="no-color">How it</p>
                        <p class="colored">Works</p>
                    </div>
                </div>
                <div class="bottom">
                    <div class="tips">
                        <div class="img">
                            <img src="../assets/icons/origin.png" alt="">
                        </div>
                        <div class="text">Sélectionnez votre lieu de départ</div>
                    </div>
                    <div class="tips">
                        <div class="img">
                            <img src="../assets/icons/destination.png" alt="">
                        </div>
                        <div class="text">Sélectionez votre destination</div>
                    </div>
                    <div class="tips">
                        <div class="img">
                            <img src="../assets/icons/parcours.png" alt="">
                        </div>
                        <div class="text">Choisissez le trajet qui vous convient</div>
                    </div>
                    <div class="tips">
                        <div class="img">
                            <img src="../assets/icons/chat_filled.png" alt="">
                        </div>
                        <div class="text">Contactez le conducteur</div>
                    </div>
                    <div class="tips">
                        <div class="img">
                            <img src="../assets/icons/laugh.png" alt="">
                        </div>
                        <div class="text">Profitez du voyage</div>
                    </div>
                </div>
            </div>
            <div class="car-img"></div>
        </div>
        <div class="popular">
            <div class="head">
                <p class="no-color">Popular</p>
                <p class="colored">Trips</p>
            </div>
            <div class="body">
                <div class="left">
                    <div class="trip">
                        <p>Douala</p>
                        <div class="img"><img src="../assets/icons/arrow-right.png"/></div>
                        <p>Yaoundé</p>
                    </div>
                    <div class="trip">
                        <p>Douala</p>
                        <div class="img"><img src="../assets/icons/arrow-right.png"/></div>
                        <p>Kribi</p>
                    </div>
                    <div class="trip">
                        <p>Yaoundé</p>
                        <div class="img"><img src="../assets/icons/arrow-right.png"/></div>
                        <p>Bafoussam</p>
                    </div>
                </div>
                <div class="right">
                    <h3>Auj.</h3>
                    <TripCard v-for="trip in filteredTrips"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import Banner from '../components/common/banner/index.vue';
    import SearchComponent from '../components/common/searchComponent/index.vue'
    import TripCard from '../components/trips/TripCard.vue'
    import apiClient from '../services/api'
    import { ref } from 'vue'

    
    const filteredTrips = ref(null);

    const loadPopularTrips = async () => {
        const response = await apiClient.get('/trips')
        const now = new Date
        const trips = [];
        console.log('1. loaded trips: ', response)

        response.forEach(res => {
            if (res.date_depart === now.ToISOString)
                trips.value.append(res)
        });
        return trips
    }
    
    filteredTrips.value = loadPopularTrips
</script>

<style scoped>
    .search {
        position: absolute;
        top: 90vh;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index:20;
    }
    .roadmap {
        width: 100%;
        height: 100vh;
        background-color: #eee;
        .content{
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            .top {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                .head {
                    display: flex;
                    gap: 0.5rem;
                    font-size: 2.5rem;
                    font-weight: 600;
                    color: #000;
                    z-index: 5;
                    .no-color {
                        color: #000;
                    }
                    .colored {
                        color: #FF6347;
                    }
                }
            }
            .bottom {
                display: flex;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                width: 100%;
                gap: 2rem;
                margin-top: 2rem;
                .tips {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    width: 200px;
                    z-index: 5;
                    .img {
                        width: 50px;
                        height: 50px;
                        img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                    }
                    .text {
                        margin-top: 0.5rem;
                        font-size: 1.2rem;
                        color: #333;
                    }
                }
            }
        }
        .car-img {
            position: absolute;
            top:75vh;
            right: 0;
            width: 50%;
            height: 100%;
            background-image: url('../assets/images/volkswagen-2021-golf-gti.png');
            background-size: cover;
            background-position: center;
        }
    }
    .popular{
        width: 100%;
        padding: 10px;
        background-image: linear-gradient(to top, #C6DCFB, #eee);
        .head {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            font-size: 2.5rem;
            font-weight: 600;
            color: #000;
            z-index: 5;
            .no-color {
                color: #000;
            }
            .colored {
                color: #FF6347;
            }
        }
    }
    .body{
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;

        .left{
            width: 50%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 10px;
            .trip{
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 5px;
                width: 60%;
                background-color: #eee;
                border: 1px solid #487BFB;
                border-radius: 10px;
                padding: 10px;

                p{
                    font-size: 1rem;
                    font-weight: 600;
                }
                .img{
                    width: 50px;
                    height: 20px;

                    img{
                        width: 10%;
                        height:100%;
                        object-fit: cover;
                    }
                }

            }
        }
        .right{
            width: 40%;
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 20px;
            padding: 10px;

            h3{
                width: 100%;
                text-align: left;
            }
        }
    }
</style>