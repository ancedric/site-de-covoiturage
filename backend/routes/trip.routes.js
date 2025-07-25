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

// Obtenir un trajet par son ID (accessible à tous les utilisateurs authentifiés)
// GET /api/trips/:id_trajet
router.get('/:id_trajet', authMiddleware, tripController.getTripById);

// Mettre à jour un trajet (seul le conducteur ou un admin peut le faire)
// PATCH /api/trips/:id_trajet
router.patch('/:id_trajet', authMiddleware, tripController.updateTrip);

// Supprimer un trajet (seul le conducteur ou un admin peut le faire)
// DELETE /api/trips/:id_trajet
router.delete('/:id_trajet', authMiddleware, tripController.deleteTrip);

module.exports = router;