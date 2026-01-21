const express = require('express');
const router = express.Router();
const voitureController = require('../controllers/voiture.controller');
const {authMiddleware} = require('../utils/auth.utils'); 

// Route pour créer une nouvelle voiture (nécessite d'être authentifié)
router.post('/', authMiddleware, voitureController.createVoiture);

// Route pour récupérer toutes les voitures 
router.get('/', authMiddleware, voitureController.getAllVoitures);

// Route pour récupérer toutes les voitures de l'utilisateur authentifié
router.get('/my-voitures/:id_user', authMiddleware, voitureController.getMyVoitures);

// Route pour récupérer toutes les voitures de l'utilisateur authentifié
router.get('/voiture/:id_voiture', authMiddleware, voitureController.getVoiture); 

// Route pour mettre à jour une voiture (seul le propriétaire ou un admin)
router.put('/:id', authMiddleware, voitureController.updateVoiture); 

// Route pour supprimer une voiture (seul le propriétaire ou un admin)
router.delete('/:id', authMiddleware, voitureController.deleteVoiture); 

module.exports = router;