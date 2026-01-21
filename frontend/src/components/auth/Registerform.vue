<template>
<div class="auth-container">
  <h2>Inscription</h2>
  <form @submit.prevent="handleRegister" class="auth-form">
    <div class="form-group">
      <label for="firstname">Prénom</label>
      <input type="text" id="username" v-model="firstname" required />
    </div>
    <div class="form-group">
      <label for="lastname">Nom</label>
      <input type="text" id="username" v-model="lastname" required />
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" v-model="email" required />
    </div>
    <div class="form-group">
      <label for="phone">Téléphone</label>
      <input type="phone" id="phone" v-model="phone" required />
    </div>
    <div class="form-group">
      <label for="password">Mot de passe</label>
      <input type="password" id="password" v-model="password" required />
    </div>
    <div class="form-group">
      <label for="confirmPassword">Confirmer le mot de passe</label>
      <input type="password" id="confirmPassword" v-model="confirmPassword" required />   
    </div>
    <button type="submit" :disabled="authStore.loading">S'inscrire</button>
    <div v-if="authStore.error" class="error-message">{{ authStore.error }}</div>
  </form>
</div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();

const firstname = ref('');
const lastname = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const successMessage = ref('');
const role = ref('')

const handleRegister = async () => {
  successMessage.value = '';

  if (password.value !== confirmPassword.value) {
    authStore.error = 'Les mots de passe ne correspondent pas.';
    return;
  }

  if (!firstname.value || !lastname.value || !email.value || !password.value) {
      authStore.error = 'Veuillez remplir tous les champs.';
      return;
  }
  
  try {
    await authStore.register({
      prenom: firstname.value,
      nom: lastname.value,
      email: email.value,
      telephone: phone.value,
      mot_de_passe: password.value,
      role: role.value
    });
  } catch (err) {
    console.error('Erreur dans le composant:', err);
  }
};
</script>

<style scoped>
/* Styles de base pour les formulaires d'authentification */
.auth-container {
  width: 280px;
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

input[type="text"],
input[type="email"],
input[type="password"],
input[type="phone"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background-color: transparent;
  color: #40518b;
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