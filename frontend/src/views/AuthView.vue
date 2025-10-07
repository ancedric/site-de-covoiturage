<template>
    <div class="auth-view">
        <h1>Authentication</h1>
        <div class="tabs">
            <div @click="switchForm">Connexion</div>
            <div @click="switchForm">Inscription</div>
        </div>
        <div class="content-viewer">
            <LoginForm v-if="isLoginVisible" />
            <RegisterForm v-if="isRegisterVisible" />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import LoginForm from '../components/auth/LoginForm.vue';
import RegisterForm from '../components/auth/RegisterForm.vue';
const isLoginVisible = ref(true);
const isRegisterVisible = ref(false);

const switchForm = () => {
    isLoginVisible.value = !isLoginVisible.value;
    isRegisterVisible.value = !isRegisterVisible.value;
}
</script>

<style scoped>
.auth-view {
    padding: 2rem;
    text-align: center;
}
.tabs {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
}
.tabs div {
    cursor: pointer;
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    margin: 0 0.5rem;
    border-radius: 4px;
    background-color: #f9f9f9;
}
.tabs div:hover {
    background-color: #e9e9e9;
}
.content-viewer {
    display: flex;
    justify-content: center;
}
.auth-container {
    max-width: 400px;
    margin: 50px auto;
    padding: 30px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    text-align: center;
}
</style>