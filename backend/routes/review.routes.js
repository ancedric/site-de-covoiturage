const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const {authMiddleware} = require('../utils/auth.utils');

// Route pour créer un nouvel avis (nécessite d'être authentifié)
router.post('/', authMiddleware, reviewController.createReview);

// Route pour récupérer un avis spécifique par ID
router.get('/:id', reviewController.getReviewById);

// Route pour récupérer les avis laissés par l'utilisateur authentifié
router.get('/my-reviews', authMiddleware, reviewController.getReviewsByAuthUser);

// Route pour récupérer les avis reçus par un utilisateur spécifique
router.get('/for-user/:userId', reviewController.getReviewsForUser);

// Route pour récupérer tous les avis pour un trajet spécifique
router.get('/for-trip/:tripId', reviewController.getReviewsForTrip);

// Route pour mettre à jour un avis (seul l'auteur ou un admin)
router.put('/:id', authMiddleware, reviewController.updateReview);

// Route pour supprimer un avis (seul l'auteur ou un admin)
router.delete('/:id', authMiddleware, reviewController.deleteReview);

// Route pour récupérer la note moyenne d'un utilisateur
router.get('/average-rating/:userId', reviewController.getAverageRating);

module.exports = router;