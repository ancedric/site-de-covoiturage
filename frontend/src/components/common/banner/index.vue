<template>
    <div id="banner">
        <h1 class="first">EVITEZ LES TRAFFICS, ECONOMISEZ </h1>
            <h1 class="second">ET SAUVEZ LA PLANETE</h1>
        <p>Conducteurs, rejoignez Colcar et transformez votre trajet en source de revenue suplémentaire. <br>
            Passagers, trouvez un trajet qui vous convient et faites des économies, rencontrez de nouvelles personnes, et faites du revenu en aidant à la réduction des embouteillages urbains et des émissions de gaz, et construisez une communauté éco-amicale. <br>
        </p>
        <router-link to="/publish-trip" class="cta-btn">Publiez un trajet</router-link>
    </div>
</template>

<script setup>
</script>

<style scoped>
#banner {
    position: relative;
    color: #ffffff;
    background-image: url('../../../assets/images/hero-bg.jpg');
    background-size: cover;
    background-position: center;
    height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    &:after{
        content: "";
        width: 100%;
        height: 100vh;
        background-color: #20202075;
        position: absolute;
        top:0;
        left: 0;

    }

    h1{
        font-size: 48px;
        font-weight: bold;
        margin: 0;
        z-index: 2;
        transition: all .3s ease-in-out;
        animation: slide-up 1s ease-in-out;
    }
    .second{
        animation-delay: .5s;
    }
    p{
        font-size: 20px;
        font-weight: 400;
        font-style: normal;
        text-align: center;
        max-width: 900px;
        margin: 20px 0;
        z-index: 2;
        transition: all .3s ease-in-out;
        animation: slide-up 1s ease-in-out;
        animation-delay: .8s;
    }
    .cta-btn{
        background-color: #487BFB;
        text-decoration: none;
        color: #eee;
        text-align:  center;
        font-size: 20px;
        width: 800px;
        height: 50px;
        padding-top: 20px;
        border-radius: 15px;
        transition: all .3s ease-in-out;
        z-index: 10;

        &:hover{
            background-color: #8fadfaff;
        }
    }
}
@keyframes slide-up{
    from{
        transform: translateY(100%);
        opacity: 0;
    }
    to{
        transform: translateY(0);
        opacity: 1;
    }
}
</style>