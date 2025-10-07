const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const { authMiddleware, isAdmin } = require('../utils/auth.utils');

// =======================================================
// Routes pour les Trajets
// =======================================================

// Créer un nouveau trajet (nécessite d'être authentifié)
// POST /api/trips
router.post('/', authMiddleware, tripController.createTrip);

// Obtenir tous les trajets (accessible à tous les utilisateurs authentifiés)
// GET /api/trips
router.get('/', authMiddleware, tripController.getAllTrips);

//Récupérer lles participants d'un trajet
// GET /api/trips/:id_trajet/participants
router.get('/:id_trajet/participants', authMiddleware, tripController.getTripParticipants);

//Ajouter un participant à un trajet
router.post('/:id_trajet/participants', authMiddleware, tripController.addParticipant);

// Obtenir un trajet par son ID (accessible à tous les utilisateurs authentifiés)
// GET /api/trips/:id_trajet
router.get('/:id_trajet', authMiddleware, tripController.getTripById);

// Obtenir tous les trajets postés par un utilisateur (accessible à tous l'utilisateur connecté)
// GET /api/trips/my-trips/:user_id
router.get('/my-trips/:user_id', authMiddleware, tripController.getTripByUserId);

// Mettre à jour un trajet (seul le conducteur ou un admin peut le faire)
// PATCH /api/trips/:id_trajet
router.patch('/:id_trajet', authMiddleware, tripController.updateTrip);

// Supprimer un trajet (seul le conducteur ou un admin peut le faire)
// DELETE /api/trips/:id_trajet
router.delete('/:id_trajet', authMiddleware, tripController.deleteTrip);

module.exports = router;