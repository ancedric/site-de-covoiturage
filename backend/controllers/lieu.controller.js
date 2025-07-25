const Lieu = require('../models/lieu.model');

// Créer un nouveau lieu
exports.createLieu = async (req, res) => {
    try {
        const { nom_lieu, adresse, ville, pays, latitude, longitude, description } = req.body;

        // Validation simple
        if (!nom_lieu || !adresse || !ville || !pays || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Tous les champs obligatoires (nom_lieu, adresse, ville, pays, latitude, longitude) doivent être fournis.' });
        }

        const newLieuData = {
            nom_lieu,
            adresse,
            ville,
            pays,
            latitude,
            longitude,
            description
        };

        const createdLieu = await Lieu.create(newLieuData);
        res.status(201).json({ message: 'Lieu créé avec succès.', lieu: createdLieu });

    } catch (error) {
        console.error('Erreur lors de la création du lieu :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la création du lieu.' });
    }
};

// Obtenir tous les lieux
exports.getAllLieux = async (req, res) => {
    try {
        const lieux = await Lieu.findAll();
        res.status(200).json(lieux);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les lieux :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération des lieux.' });
    }
};

// Obtenir un lieu par ID
exports.getLieuById = async (req, res) => {
    try {
        const { id_lieu } = req.params;
        const lieu = await Lieu.findById(id_lieu);

        if (!lieu) {
            return res.status(404).json({ message: 'Lieu non trouvé.' });
        }

        res.status(200).json(lieu);
    } catch (error) {
        console.error('Erreur lors de la récupération du lieu par ID :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération du lieu.' });
    }
};

// Mettre à jour un lieu
exports.updateLieu = async (req, res) => {
    try {
        const { id_lieu } = req.params;
        const lieuData = req.body;

        const updatedLieu = await Lieu.update(id_lieu, lieuData);

        if (!updatedLieu) {
            return res.status(404).json({ message: 'Lieu non trouvé ou aucune donnée valide fournie pour la mise à jour.' });
        }

        res.status(200).json({ message: 'Lieu mis à jour avec succès.', lieu: updatedLieu });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du lieu :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la mise à jour du lieu.' });
    }
};

// Supprimer un lieu
exports.deleteLieu = async (req, res) => {
    try {
        const { id_lieu } = req.params;
        const deletedLieu = await Lieu.delete(id_lieu);

        if (!deletedLieu) {
            return res.status(404).json({ message: 'Lieu non trouvé.' });
        }

        res.status(200).json({ message: 'Lieu supprimé avec succès.', lieu: deletedLieu });

    } catch (error) {
        console.error('Erreur lors de la suppression du lieu :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la suppression du lieu.' });
    }
};