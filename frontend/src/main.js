import { createApp } from 'vue';
import App from './App.vue';
import './style.css'
import router from './router';
import { createPinia } from 'pinia';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia(); 

app.use(pinia);
app.use(router);

router.isReady().then(async () => {
  const authStore = useAuthStore();
  await authStore.checkAuth(); 

  app.mount('#app');
});