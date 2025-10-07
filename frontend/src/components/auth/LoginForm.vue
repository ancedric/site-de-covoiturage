<template>
  <div class="auth-container">
    <h2>Connexion</h2>
    <form @submit.prevent="handleLogin" class="auth-form">
      <div class="form-group">
        <label for="email">Email :</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Mot de passe :</label>
        <input type="password" id="password" v-model="mot_de_passe" required />
      </div>

      <p v-if="authStore.error" class="error-message">{{ authStore.error }}</p>
      <p v-if="route.query.registered" class="success-message">
        Votre compte a été créé avec succès ! Veuillez vous connecter.
      </p>

      <button type="submit" :disabled="authStore.loading">
        <span v-if="authStore.loading">Connexion en cours...</span>
        <span v-else>Se connecter</span>
      </button>
    </form>
    <p class="auth-link">Pas encore de compte ? <router-link to="/register">Inscrivez-vous ici</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useRoute } from 'vue-router'; 

const authStore = useAuthStore();
const route = useRoute();

const email = ref('');
const mot_de_passe = ref('');

const handleLogin = async () => {

  try {
    authStore.error = null; 

    if (!email.value || !mot_de_passe.value) {
        authStore.error = 'Veuillez entrer votre email et votre mot de passe.';
        return; 
    }

    // Appel à l'action login du store
    await authStore.login({
      email: email.value,
      mot_de_passe: mot_de_passe.value,
    });

  } catch (err) {
    console.error('Erreur dans le composan:', err);
  }
};
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h2 {
  color: #333;
  margin-bottom: 25px;
  font-size: 1.8em;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  text-align: left;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
  font-size: 0.9em;
}

input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  box-sizing: border-box;
}

input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

button {
  background-color: #007bff;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 15px;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  font-size: 0.9em;
}

.success-message {
  color: #28a745;
  margin-top: 10px;
  font-size: 0.9em;
}

.auth-link {
  margin-top: 20px;
  font-size: 0.9em;
  color: #666;
}

.auth-link a {
  color: #007bff;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>