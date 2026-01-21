const Voiture = require('../models/voiture.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Configuration de Multer pour le stockage local ---
const uploadDirectory = path.join(__dirname, '..', 'uploads', 'voitures');
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configuration du stockage local
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Le fichier téléchargé n\'est pas une image !'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// Créer une nouvelle voiture
exports.createVoiture = async (req, res) => {
    upload.single('imageVoiture')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'Erreur lors du téléchargement de l\'image.', error: err.message });
        }

        try {
            const { marque, modele, annee, couleur, plaque_immatriculation, nb_places } = req.body;
            const utilisateur_id_user = req.user.id_user;

            // Validation des champs obligatoires
            if (!marque || !modele || !annee || !plaque_immatriculation || !nb_places) {
                // Si la validation échoue, il faut supprimer le fichier
                if (req.file) {
                    fs.unlink(req.file.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Erreur lors de la suppression du fichier après échec de validation :', unlinkErr);
                    });
                }
                return res.status(400).json({ message: 'Les champs marque, modèle, année, plaque d\'immatriculation et nombre de places sont obligatoires.' });
            }
            
            // Validation des types
            if (typeof Number(annee) !== 'number' || isNaN(Number(annee)) || typeof Number(nb_places) !== 'number' || isNaN(Number(nb_places))) {
                if (req.file) {
                    fs.unlink(req.file.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Erreur lors de la suppression du fichier après échec de validation :', unlinkErr);
                    });
                }
                return res.status(400).json({ message: 'L\'année et le nombre de places doivent être des nombres.' });
            }

            if (annee < 1900 || annee > new Date().getFullYear() + 1) { 
                if (req.file) {
                    fs.unlink(req.file.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Erreur lors de la suppression du fichier après échec de validation :', unlinkErr);
                    });
                }
                return res.status(400).json({ message: 'Année de fabrication invalide.' });
            }
            if (nb_places < 1 || nb_places > 8) {
                if (req.file) {
                    fs.unlink(req.file.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Erreur lors de la suppression du fichier après échec de validation :', unlinkErr);
                    });
                }
                return res.status(400).json({ message: 'Le nombre de places doit être entre 1 et 8.' });
            }

            // Déterminer le chemin de l'image si elle a été uploadée
            let url_image_vehicule = null;
            if (req.file) {
                url_image_vehicule = `/uploads/voitures/${req.file.filename}`;
            }

            const newVoitureData = {
                utilisateur_id_user,
                marque,
                modele,
                annee,
                couleur: couleur || null, 
                plaque_immatriculation, 
                nb_places,
                url_image_vehicule
            };

            const createdVoiture = await Voiture.create(newVoitureData);

            res.status(201).json({
                message: 'Voiture ajoutée avec succès.',
                voiture: createdVoiture
            });

        } catch (error) {
            console.error('Erreur lors de la création de la voiture :', error);
            // Si une erreur survient, assurez-vous de supprimer le fichier uploadé
            if (req.file) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Erreur lors de la suppression du fichier après une erreur serveur :', unlinkErr);
                });
            }
            if (error.code === '23505') {
                return res.status(409).json({ message: 'Une voiture avec cette plaque d\'immatriculation existe déjà.' });
            }
            res.status(500).json({ message: 'Erreur interne du serveur lors de l\'ajout de la voiture.' });
        }
    });
};

exports.getAllVoitures = async (req, res) => {
    console.log("DEBUG: Récupération de toutes les voitres")
    try {
        const voiture = await Voiture.findAll(); 

        if (!voiture) { 
            return res.status(200).json({ message: 'Aucune voiture trouvée.' });
        }

        res.status(200).json(voiture);
    } catch (error) {
        console.error('Erreur lors de la récupération de la voiture par ID :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer une voiture par son ID
exports.getVoitureById = async (req, res) => {
    try {
        const { id } = req.params;
        const voiture = await Voiture.findById(id); 

        if (!voiture) { 
            return res.status(404).json({ message: 'Voiture non trouvée.' });
        }

        if (parseInt(voiture.utilisateur_id_user) !== parseInt(req.user.id_user) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé à cette voiture.' });
        }

        res.status(200).json(voiture);
    } catch (error) {
        console.error('Erreur lors de la récupération de la voiture par ID :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer toutes les voitures de l'utilisateur authentifié
exports.getMyVoitures = async (req, res) => { 
    try {
        const userId = req.params.id_user; 
        console.log('Id utilisateur: ', userId)
        const voitures = await Voiture.findByUserId(userId);

        if (!voitures || voitures.length === 0) { 
            return res.status(201).json({ message: 'Voitures non trouvées.', voiture: [] });
        }
        console.log("Voitures: ", voitures);
        res.status(200).json(voitures); 
    } catch (error) {
        console.error('Erreur lors de la récupération des voitures de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer une voiture par son id
exports.getVoiture = async (req, res) => { 
    console.log('Appel de la fonction getVoiture')
    try {
        const carId = req.params.id_voiture; 
        console.log('id voiture: ', carId)
        const voitures = await Voiture.findByCarId(carId);

        if (!voitures || voitures.length === 0) { 
            return res.status(404).json({ message: 'Voiture non trouvée.' });
        }
        console.log("Voitures: ", voitures);
        res.status(200).json(voitures); 
    } catch (error) {
        console.error('Erreur lors de la récupération des voitures de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Mettre à jour une voiture existante
exports.updateVoiture = async (req, res) => {
    try {
        const { id } = req.params;
        const { marque, modele, annee, couleur, plaque_immatriculation, nb_places } = req.body;
        const userId = req.user.id_user;

        const existingVoiture = await Voiture.findById(id);
        if (!existingVoiture) {
            return res.status(404).json({ message: 'Voiture non trouvée.' });
        }

        if (parseInt(existingVoiture.utilisateur_id_user) !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé à modifier cette voiture.' });
        }

        const updateData = {};
        if (marque !== undefined) updateData.marque = marque;
        if (modele !== undefined) updateData.modele = modele;
        if (annee !== undefined) {
            if (typeof annee !== 'number') {
                return res.status(400).json({ message: 'L\'année doit être un nombre.' });
            }
            if (annee < 1900 || annee > new Date().getFullYear() + 1) {
                return res.status(400).json({ message: 'Année de fabrication invalide.' });
            }
            updateData.annee = annee;
        }
        if (couleur !== undefined) updateData.couleur = couleur;
        if (plaque_immatriculation !== undefined) updateData.plaque_immatriculation = plaque_immatriculation; 
        if (nb_places !== undefined) {
            if (typeof nb_places !== 'number') {
                return res.status(400).json({ message: 'Le nombre de places doit être un nombre.' });
            }
            if (nb_places < 1 || nb_places > 8) {
                return res.status(400).json({ message: 'Le nombre de places doit être entre 1 et 8.' });
            }
            updateData.nb_places = nb_places; 
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({ message: 'Aucune modification détectée pour la voiture.' });
        }

        const updatedVoiture = await Voiture.update(id, updateData); 
        if (!updatedVoiture) { 
            return res.status(500).json({ message: 'Échec de la mise à jour de la voiture.' });
        }

        res.status(200).json({ message: 'Voiture mise à jour avec succès.', voiture: updatedVoiture }); 

    } catch (error) {
        console.error('Erreur lors de la mise à jour de la voiture :', error);
        if (error.code === '23505') { 
            return res.status(409).json({ message: 'Une autre voiture avec cette plaque d\'immatriculation existe déjà.' });
        }
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Supprimer une voiture
exports.deleteVoiture = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id_user; 

        const existingVoiture = await Voiture.findById(id); 
        if (!existingVoiture) {
            return res.status(404).json({ message: 'Voiture non trouvée.' });
        }

        if (parseInt(existingVoiture.utilisateur_id_user) !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé à supprimer cette voiture.' });
        }
        
        // Si une image est associée, la supprimer du système de fichiers
        if (existingVoiture.url_image_vehicule) {
            fs.unlink(path.join(__dirname, '..', existingVoiture.url_image_vehicule), (err) => {
                if (err) console.error('Erreur lors de la suppression de l\'image associée au véhicule:', err);
            });
        }

        const deletedVoiture = await Voiture.delete(id); 
        if (!deletedVoiture) { 
            return res.status(500).json({ message: 'Échec de la suppression de la voiture.' });
        }

        res.status(200).json({ message: 'Voiture supprimée avec succès.', voiture: deletedVoiture });

    } catch (error) {
        console.error('Erreur lors de la suppression de la voiture :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};
