const User = require('../models/user.model'); // Importe le modèle User
const bcrypt = require('bcryptjs'); // Pour la comparaison des mots de passe
const jwt = require('jsonwebtoken'); // Pour générer et vérifier les tokens JWT

// Fonction d'inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe, telephone, role, photo_profil } = req.body;

        // 1. Validation de base des entrées (vous pouvez ajouter des validations plus complexes ici)
        if (!email || !mot_de_passe || !nom) {
            return res.status(400).json({ message: 'Email, mot de passe et nom sont requis.' });
        }

        // 2. Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        // 3. Créer le nouvel utilisateur via le modèle
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

        // 4. Générer un token JWT pour l'authentification (connexion automatique après inscription)
        const token = jwt.sign(
            { id_user: createdUser.id_user, email: createdUser.email, role: createdUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Le token expire après 1 heure
        );

        // 5. Répondre avec l'utilisateur créé et le token
        // Ne pas renvoyer le mot de passe haché !
        const { mot_de_passe: _, ...userWithoutPassword } = createdUser; // Destructuring pour exclure le mot de passe

        res.status(201).json({
            message: 'Inscription réussie !',
            user: userWithoutPassword,
            token
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

        // 1. Validation de base
        if (!email || !mot_de_passe) {
            return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
        }

        // 2. Trouver l'utilisateur par email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides (email ou mot de passe incorrect).' });
        }

        // 3. Comparer le mot de passe fourni avec le mot de passe haché de la DB
        const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants invalides (email ou mot de passe incorrect).' });
        }

        // 4. Générer un token JWT
        const token = jwt.sign(
            { id_user: user.id_user, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 5. Répondre avec l'utilisateur (sans mot de passe) et le token
        const { mot_de_passe: _, ...userWithoutPassword } = user;
        res.status(200).json({
            message: 'Connexion réussie !',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Erreur lors de la connexion :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la connexion.' });
    }
};

// Fonction pour récupérer le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
    try {
        // L'ID de l'utilisateur est extrait du token JWT par le middleware d'authentification
        // et placé dans req.user (req.user.id_user)
        const userId = req.user.id_user; // Assurez-vous d'avoir un middleware d'authentification qui peuple req.user

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
        const userId = req.user.id_user; // ID de l'utilisateur du token
        const userData = req.body; // Données à mettre à jour

        // Optionnel: Validation des données de userData ici

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
        const userId = req.user.id_user; // ID de l'utilisateur du token

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