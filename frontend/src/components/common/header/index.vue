<template>
  <header>
    <div class="content">
      <div class="logo">
        <img src="../../../assets/images/logo.png">
      </div>
      <div class="menu">
        <nav>  
          <router-link to="/">Accueil</router-link> 
          <router-link to="/search-trips">Rechercher</router-link> 
          <template v-if="authStore.isAuthenticated">
            <router-link to="/dashboard" v-if="authStore.user.role === 'admin'">Tableau de Bord</router-link> 
            <router-link to="/publish-trip">Publier un trajet</router-link>
          </template>
        </nav>
      </div>
      <div class="user">
        <template v-if="authStore.isAuthenticated">
          <div class="user-menu">
            <div class="photo-profil">
              <div class="img">
                <img :src="authStore.user.photo_profil" alt="">
              </div>
              <span>{{ authStore.user.prenom }} {{ authStore.user.nom }}</span>
            </div>
            <div class="collapsed">
              <router-link to="/my-published-trips">Mes Trajets</router-link>
              <router-link to="/my-reservations">Mes Réservations</router-link>
              <router-link to="/search-trips">Tous les Trajets</router-link>
              <router-link to="/profile">Mon Compte</router-link>
                      
              <button @click="authStore.logout()" :disabled="authStore.loading">Déconnexion</button>
            </div>
          </div>
        </template>    
        <template v-else>
          <div class="user-menu">
            <router-link to="/auth" class="auth">Connexion</router-link>
          </div>
        </template>
      </div>
    </div>
    <div class="separator"></div>
    </header>
</template>

<script setup>
    import { useAuthStore } from '../../../stores/auth';
    
    const authStore = useAuthStore();
</script>

<style scoped>
header {
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 0;
  left: 0;
  justify-content: center;
  align-items: center;
  background-color: #ffffff07;
  padding-top: 10px;
  padding-bottom: 2px;
  margin:0;
  width:100%;
  z-index: 100;

  .content{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;

    .logo{
      width: 30%;

      img{
        width: 180px;
        height: 70px;
        object-fit: cover;
      }
    }

    .menu{
      width: 40%;

      nav {
        display: flex;
        justify-content: center;
        gap: 15px;
        align-items: center;
        margin-bottom: 20px;

        a {
          font-weight: bold;
          color: #f3f5f7;
          text-decoration: none;
          padding: 5px 10px;
          border-radius: 5px;

          .router-link-exact-active {
            color: #007bff;
          }
        }
      }
    }

    .user{
      width: 30%;

      .user-menu{
          position: relative;
          display: flex;
          align-items: center;
          cursor: pointer;

          .photo-profil {
            display: flex;
            align-items: center;
            gap: 10px;

            .img {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              overflow: hidden;

              img {
                width: 100%;
                height: auto;
              }
            }
            span{
              color: #eee;
              font-weight: bold;
            }
          }

          .collapsed {
            position: absolute;
            top: 100%;
            left: 0;
            width: 250px;
            text-align: center;
            background-color: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 10px;
            border-radius: 5px;
            display: none;

            a {
              display: block;
              padding: 5px 10px;
              color: #333;

              &:hover {
                background-color: #f1f1f1;
              }
            }
          }

          &:hover .collapsed {
            display: block;
          }
          button {
            background-color: #dc3545;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;

            &:hover {
              background-color: #c82333;
            }
          }
          .auth{
          width: 150px;
          height: 30px;
          background-color: #487BFB;
          color: #eee;
          text-decoration: none;
          border-radius: 50px;
          padding-top: 10px;
          margin-left: 150px;
        }
      }
    }
  }
  .separator{
    width: 90%;
    height: 1px;
    background-color: #e7e7e7;
  }
}
</style>