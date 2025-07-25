const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware, isAdmin } = require('../utils/auth.utils');

// Route pour récupérer le profil de l'utilisateur connecté
// GET /api/profile
router.get('/profile', authMiddleware, userController.getProfile);

// Route pour mettre à jour le profil de l'utilisateur connecté
// PUT /api/profile
router.patch('/profile', authMiddleware, userController.updateProfile);

// Route pour supprimer le profil de l'utilisateur connecté
// DELETE /api/profile
router.delete('/profile', authMiddleware, userController.deleteProfile);

// =======================================================
// Routes de gestion des utilisateurs pour les ADMINISTRATEURS
// Toutes ces routes nécessitent une authentification ET le rôle 'admin'
// =======================================================

// Récupérer tous les utilisateurs
// GET /api/users
router.get('/users', authMiddleware, isAdmin, userController.getAllUsers);

// Récupérer un utilisateur spécifique par son ID
// GET /api/users/:id_user
router.get('/users/:id_user', authMiddleware, isAdmin, userController.getUserById);

// Mettre à jour un utilisateur spécifique par son ID
// PATCH /api/users/:id_user
router.patch('/users/:id_user', authMiddleware, isAdmin, userController.updateUserById);

// Supprimer un utilisateur spécifique par son ID
// DELETE /api/users/:id_user
router.delete('/users/:id_user', authMiddleware, isAdmin, userController.deleteUserById);

module.exports = router;