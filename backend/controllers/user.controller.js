const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fonction d'inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe, telephone, role, photo_profil } = req.body;

        if (!email || !mot_de_passe || !nom) {
            return res.status(400).json({ message: 'Email, mot de passe et nom sont requis.' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        const newUser = {
            nom,
            prenom,
            email,
            mot_de_passe,
            telephone,
            role: role || 'passager',
            photo_profil
        };
        const createdUser = await User.create(newUser);

        const { mot_de_passe: _, ...userWithoutPassword } = createdUser;
        res.status(201).json({
            message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de l\'inscription.' });
    }
};

// Fonction de connexion d'un utilisateur
exports.login = async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        if (!email || !mot_de_passe) {
            return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides (email ou mot de passe incorrect).' });
        }

        const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants invalides (email ou mot de passe incorrect).' });
        }

        // Générer un token JWT
        const token = jwt.sign(
            { id_user: user.id_user, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Envoyer le token dans un cookie HTTP-only pour la persistance
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 3600000
        });
        // Ne pas retourner le mot de passe dans la réponse
        const { mot_de_passe: userPassword, ...userWithoutPassword } = user;
        res.status(200).json({
            message: 'Connexion réussie !',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Erreur lors de la connexion :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la connexion.' });
    }
};

// Fonction pour récupérer le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id_user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Profil utilisateur non trouvé.' });
        }

        const { mot_de_passe: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);

    } catch (error) {
        console.error('Erreur lors de la récupération du profil :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Fonction pour mettre à jour le profil de l'utilisateur connecté
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id_user;
        const userData = req.body;

        const updatedUser = await User.update(userId, userData);

        if (!updatedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune donnée à mettre à jour.' });
        }

        const { mot_de_passe: _, ...userWithoutPassword } = updatedUser;
        res.status(200).json({
            message: 'Profil mis à jour avec succès.',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la mise à jour du profil.' });
    }
};

// Fonction pour supprimer le profil de l'utilisateur connecté
exports.deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id_user;

        const deletedUser = await User.delete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ message: 'Profil supprimé avec succès.', id_user: deletedUser.id_user });

    } catch (error) {
        console.error('Erreur lors de la suppression du profil :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la suppression du profil.' });
    }
};

// =======================================================
// Fonctions de gestion des utilisateurs pour les ADMINISTRATEURS
// =======================================================

// Récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        // Retirer les mots de passe avant d'envoyer
        const usersWithoutPasswords = users.map(user => {
            const { mot_de_passe: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.status(200).json(usersWithoutPasswords);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les utilisateurs (Admin) :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération des utilisateurs.' });
    }
};

// Récupérer un utilisateur par ID 
exports.getUserById = async (req, res) => {
    try {
        const { id_user } = req.params;
        const user = await User.findById(id_user);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const { mot_de_passe: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur par ID (Admin) :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération de l\'utilisateur.' });
    }
};

// Mettre à jour un utilisateur par ID
exports.updateUserById = async (req, res) => {
    try {
        const { id_user } = req.params;
        const userData = req.body;

        const updatedUser = await User.update(id_user, userData);

        if (!updatedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune donnée à mettre à jour.' });
        }

        const { mot_de_passe: _, ...userWithoutPassword } = updatedUser;
        res.status(200).json({
            message: 'Utilisateur mis à jour avec succès.',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur par ID (Admin) :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la mise à jour de l\'utilisateur.' });
    }
};

// Supprimer un utilisateur par ID
exports.deleteUserById = async (req, res) => {
    try {
        const { id_user } = req.params;

        const deletedUser = await User.delete(id_user);

        if (!deletedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ message: 'Utilisateur supprimé avec succès.', id_user: deletedUser.id_user });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur par ID (Admin) :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la suppression de l\'utilisateur.' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    });
    res.status(200).json({ message: 'Déconnexion réussie.' });
};

// Récupérer les informations de l'utilisateur authentifié
exports.getMe = async (req, res) => {
    try {
        console.log("infos user: ", req.user);
        // Le middleware `authenticateToken` a déjà ajouté les informations de l'utilisateur
        // à `req.user` si le token est valide.
        if (!req.user || !req.user.id_user) {
            // Cela ne devrait normalement pas arriver si authenticateToken fonctionne,
            // mais c'est une sécurité.
            return res.status(401).json({ message: 'Non authentifié.' });
        }

        // Récupérer les informations complètes de l'utilisateur depuis la base de données
        // Vous pouvez choisir de ne renvoyer que certaines informations pour des raisons de sécurité.
        const user = await User.findById(req.user.id_user);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Ne renvoyez pas le mot de passe !
        const { password, ...userData } = user; // Déstructure pour exclure le mot de passe

        res.status(200).json({
            user: userData // Renvoyer les infos utilisateur (id, username, email, etc.)
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des informations de l'utilisateur :", error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération des informations utilisateur.' });
    }
};