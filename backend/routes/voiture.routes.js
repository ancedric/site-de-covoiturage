const express = require('express');
const router = express.Router();
const voitureController = require('../controllers/voiture.controller');
const {authMiddleware} = require('../utils/auth.utils'); 

// Route pour créer une nouvelle voiture (nécessite d'être authentifié)
router.post('/', authMiddleware, voitureController.createVoiture); // Function name changed

// Route pour récupérer une voiture spécifique par ID (nécessite d'être le propriétaire ou admin)
/*router.get('/:id', authMiddleware, voitureController.getVoitureById); // Function name changed*/

// Route pour récupérer toutes les voitures de l'utilisateur authentifié
router.get('/my-voitures', authMiddleware, voitureController.getMyVoitures); // Function name changed

// Route pour mettre à jour une voiture (seul le propriétaire ou un admin)
router.put('/:id', authMiddleware, voitureController.updateVoiture); // Function name changed

// Route pour supprimer une voiture (seul le propriétaire ou un admin)
router.delete('/:id', authMiddleware, voitureController.deleteVoiture); // Function name changed

module.exports = router;