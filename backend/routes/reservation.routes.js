// backend/routes/reservation.routes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const { authMiddleware } = require('../utils/auth.utils'); 

// Créer une nouvelle réservation
router.post('/:id', authMiddleware, reservationController.createReservation);

// Récupérer une réservation par son ID
router.get('/:id', authMiddleware, reservationController.getReservationById);

// Récupérer toutes les réservations de l'utilisateur authentifié
router.get('/user/:id', authMiddleware, reservationController.getUserReservations);

// Récupérer toutes les réservations pour un trajet spécifique (accessible par le conducteur du trajet ou admin)
router.get('/trip/:tripId', authMiddleware, reservationController.getTripReservations);

// Mettre à jour une réservation (seul l'utilisateur ou le conducteur ou admin)
router.put('/:id', authMiddleware, reservationController.updateReservation);

// Supprimer une réservation (seul l'utilisateur ou le conducteur ou admin)
router.delete('/:id', authMiddleware, reservationController.deleteReservation);

module.exports = router;