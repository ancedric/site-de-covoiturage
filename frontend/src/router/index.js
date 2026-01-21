import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth'; 

const routes = [
  // ===========================================
  // 1. ROUTES PUBLIQUES (ACCESSIBLES À TOUS)
  // ===========================================
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'), 
    meta: {
      requiresAuth: false,
      title: 'Accueil - Mon Covoiturage'
    }
  },
  {
    path: '/auth',
    name: 'Authentication',
    component: () => import('../views/AuthView.vue'), 
    meta: {
      requiresAuth: false,
      title: 'Connexion'
    }
  },
  {
    path: '/search-trips',
    name: 'SearchTrips',
    component: () => import('../views/trips/SearchTripsView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Rechercher un trajet'
    }
  },
  {
    path: '/about', 
    name: 'About',
    component: () => import('../views/AboutView.vue'),
    meta: {
      requiresAuth: false,
      title: 'À propos'
    }
  },
  // Pour une recherche de trajet qui affiche les détails d'un trajet (par ID)
  // Si l'utilisateur n'est pas connecté, il peut voir les détails mais pas réserver
  {
    path: '/trip/:id',
    name: 'TripDetails',
    component: () => import('../views/trips/TripDetailsView.vue'),
    props: true, 
    meta: {
      requiresAuth: false,
      title: 'Détails du Trajet'
    }
  },


  // ===========================================
  // 2. ROUTES PROTÉGÉES (NÉCESSITENT AUTHENTIFICATION)
  // ===========================================
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/dashboard/UserDashboardView.vue'), 
    meta: {
      requiresAuth: true,
      title: 'Mon Tableau de Bord'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/profile/ProfileView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Mon Profil'
    }
  },
  {
    path: '/my-reservations',
    name: 'MyReservations',
    component: () => import('../views/reservations/MyReservationsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Mes Réservations'
    }
  },
  {
    path: '/my-reviews', 
    name: 'MyReviews',
    component: () => import('../views/reviews/MyReviewsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Mes Avis'
    }
  },
  /*{
    path: '/create-reservation/:tripId', 
    name: 'CreateReservation',
    component: () => import('../views/reservations/CreateReservationView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Réserver un trajet'
    }
  },*/

  // ===========================================
  // 3. ROUTES SPÉCIFIQUES AU CONDUCTEUR (NÉCESSITENT AUTHENTIFICATION ET RÔLE/CONTEXTE CONDUCTEUR)
  // ===========================================
  {
    path: '/my-vehicles',
    name: 'MyVehicles',
    component: () => import('../views/vehicles/MyVehiclesView.vue'), 
    meta: {
      requiresAuth: true,
      title: 'Mes Véhicules',
      // meta: { requiresDriver: true } // Exemple pour un guard de rôle futur
    }
  },
  {
    path: '/publish-trip',
    name: 'PublishTrip',
    component: () => import('../views/trips/PublishTripView.vue'), 
    meta: {
      requiresAuth: true,
      title: 'Publier un Trajet',
      // meta: { requiresDriver: true }
    }
  },
  {
    path: '/my-published-trips', 
    name: 'MyPublishedTrips',
    component: () => import('../views/trips/MyPublishedTripsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Mes Trajets Publiés',
      // meta: { requiresDriver: true }
    }
  },
  /*{
    path: '/manage-trip-reservations/:tripId', 
    name: 'ManageTripReservations',
    component: () => import('../views/reservations/ManageTripReservationsView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Gérer les Réservations',
      // meta: { requiresDriver: true }
    }
  },*/
  {
    path: '/post-review/:tripId/:userId',
    name: 'PostReview',
    component: () => import('../views/reviews/PostReviewView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Laisser un Avis',
    }
  },


  // ===========================================
  // 4. ROUTE 404 (Page Non Trouvée)
  // ===========================================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Page Non Trouvée'
    }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ===========================================
// NAVIGATION GUARD POUR L'AUTHENTIFICATION
// ===========================================
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Pour s'assurer que l'état d'authentification est à jour avant chaque navigation
  if (!authStore.isAuthenticated && !authStore.loading && to.meta.requiresAuth) {
    await authStore.checkAuth();
  }

  // Si la route nécessite une authentification et que l'utilisateur n'est pas authentifié
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth'); // Rediriger vers la page de connexion
  }
  // Si l'utilisateur est déjà authentifié et essaie d'accéder aux pages de connexion/inscription
  else if (to.name === 'auth' && authStore.isAuthenticated) {
    next('/'); // Rediriger vers la page d'accueil
  }
  // Pour une gestion plus fine des rôles (ex: requiresDriver)
  // else if (to.meta.requiresDriver && (!authStore.user || authStore.user.role !== 'driver')) {
  //   next('/dashboard'); // Ou une page d'erreur "Accès refusé"
  // }
  else {
    next();
  }

  // Mettre à jour le titre de la page
  if (to.meta.title) {
    document.title = to.meta.title;
  } else {
    document.title = 'TripShare'; 
  }
});

export default router;