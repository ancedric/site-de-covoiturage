const Lieu = require('../models/lieu.model');

// ATTENTION: Remplacez par une lecture de variable d'environnement pour des raisons de sécurité
const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY; 

// Nouvelle fonction pour la suggestion de lieux via OpenCage
exports.suggestLieux = async (req, res) => {
    try {
        // La chaîne de recherche est attendue dans req.query.q
        const query = req.query.q;

        if (!query || query.length < 3) {
            return res.status(400).json({ message: 'Veuillez fournir une chaîne de recherche d\'au moins 3 caractères (paramètre "q").' });
        }

        // Construction de l'URL pour l'API OpenCage
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&language=fr&limit=5`;

        // Utilisation de fetch pour l'appel HTTP
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`OpenCage API a retourné le statut : ${response.status}`);
            return res.status(500).json({ message: 'Erreur lors de la récupération des suggestions de lieux externes.' });
        }

        const data = await response.json();

        // Transformation des résultats bruts en un format utilisable par le frontend
        const suggestions = data.results.map(result => ({
            // L'adresse formatée complète, idéale pour l'affichage dans le champ
            formatted_address: result.formatted,
            // Coordonnées pour l'enregistrement ou l'affichage de la carte
            latitude: result.geometry.lat,
            longitude: result.geometry.lng,
            // Tentative d'extraction des champs pour la création de l'objet Lieu
            // Ces valeurs devront être validées et potentiellement affinées par l'utilisateur
            nom_lieu: result.components.city || result.components.town || result.components.village || result.formatted.split(',')[0],
            adresse: result.components.road && result.components.house_number ? `${result.components.house_number} ${result.components.road}` : result.formatted.split(',')[0],
            ville: result.components.city || result.components.town || result.components.village || '',
            pays: result.components.country,
            // Permet de stocker la structure complète du composant pour plus de détails si nécessaire
            components: result.components 
        }));
        console.log("suggestions: ", suggestions)
        res.status(200).json(suggestions);

    } catch (error) {
        console.error('Erreur lors de la suggestion de lieux :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la suggestion de lieux.' });
    }
};


// Créer un nouveau lieu
exports.createLieu = async (req, res) => {
    console.log("Appel de create lieu")
    try {
        const { nom_lieu, adresse, pays, latitude, longitude} = req.body;

        // Validation simple
        if (!nom_lieu || !adresse || !pays || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Tous les champs obligatoires (nom_lieu, adresse, ville, pays, latitude, longitude) doivent être fournis.' });
        }

        const newLieuData = {
            nom_lieu,
            adresse,
            pays,
            latitude,
            longitude
        };

        const createdLieu = await Lieu.create(newLieuData);
        console.log("lieu créé: ", createdLieu)
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