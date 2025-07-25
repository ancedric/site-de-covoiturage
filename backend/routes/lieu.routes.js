const express = require('express');
const router = express.Router();
const lieuController = require('../controllers/lieu.controller');
const { authMiddleware } = require('../utils/auth.utils');


// Créer un nouveau lieu (nécessite d'être authentifié)
router.post('/', authMiddleware, lieuController.createLieu);

// Obtenir tous les lieux (nécessite d'être authentifié)
router.get('/', authMiddleware, lieuController.getAllLieux);

// Obtenir un lieu par ID (nécessite d'être authentifié)
router.get('/:id_lieu', authMiddleware, lieuController.getLieuById);

// Mettre à jour un lieu (nécessite d'être authentifié)
router.patch('/:id_lieu', authMiddleware, lieuController.updateLieu);

// Supprimer un lieu (nécessite d'être authentifié)
router.delete('/:id_lieu', authMiddleware, lieuController.deleteLieu);

module.exports = router;