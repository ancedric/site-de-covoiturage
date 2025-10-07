const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Route pour l'inscription d'un nouvel utilisateur
// POST /api/register
router.post('/register', userController.register);

// Route pour la connexion d'un utilisateur
// POST /api/login
router.post('/login', userController.login);

// Route pour la déconnexion d'un utilisateur
// POST /api/logout
router.post('/logout', userController.logout);

module.exports = router;