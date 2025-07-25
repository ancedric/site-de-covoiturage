const Trip = require('../models/trip.model');
const Lieu = require('../models/lieu.model');
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

// Créer un nouveau trajet
exports.createTrip = async (req, res) => {
    try {
        const {
            id_lieu_depart,
            id_lieu_arrivee,
            date_depart,
            heure_depart,
            places_disponibles,
            prix_par_place,
            statut
        } = req.body;

        // Validation des champs obligatoires
        if (!id_lieu_depart || !id_lieu_arrivee || !date_depart || !heure_depart || places_disponibles === undefined || prix_par_place === undefined) {
            return res.status(400).json({ message: 'Tous les champs obligatoires (id_lieu_depart, id_lieu_arrivee, date_depart, heure_depart, places_disponibles, prix_par_place) doivent être fournis.' });
        }

        // Récupérer les détails des lieux pour obtenir les coordonnées
        const lieuDepart = await Lieu.findById(id_lieu_depart);
        const lieuArrivee = await Lieu.findById(id_lieu_arrivee);

        if (!lieuDepart || !lieuArrivee) {
            return res.status(404).json({ message: 'Lieu de départ ou lieu d\'arrivée non trouvé.' });
        }

        let distance_estimee = null;
        let duree_estimee = null;

        // Calcul de la distance et de la durée via Google Maps
        if (process.env.Maps_API_KEY) {
            try {
                const response = await client.directions({
                    params: {
                        origin: { lat: lieuDepart.latitude, lng: lieuDepart.longitude },
                        destination: { lat: lieuArrivee.latitude, lng: lieuArrivee.longitude },
                        key: process.env.Maps_API_KEY,
                    },
                    timeout: 1000,
                });

                if (response.data.routes && response.data.routes.length > 0) {
                    const route = response.data.routes[0].legs[0];
                    distance_estimee = route.distance.value;
                    duree_estimee = route.duration.value;
                }
            } catch (googleError) {
                console.error("Erreur Google Maps API lors de la création du trajet :", googleError.response ? googleError.response.data : googleError.message);
            }
        } else {
            console.warn("Maps_API_KEY non défini. Le calcul de distance/durée sera omis.");
        }

        const newTripData = {
            utilisateur_id_user: req.user.id_user,
            id_lieu_depart,
            id_lieu_arrivee,
            date_depart,
            heure_depart,
            places_disponibles,
            prix_par_place,
            statut,
            distance_estimee,
            duree_estimee
        };

        const createdTrip = await Trip.create(newTripData);

        // Après la création, récupérer le trajet complet avec les détails des lieux
        const tripWithDetails = await Trip.findById(createdTrip.id_trajet);

        res.status(201).json({ message: 'Trajet créé avec succès.', trip: tripWithDetails });

    } catch (error) {
        console.error('Erreur lors de la création du trajet :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la création du trajet.' });
    }
};

// Obtenir tous les trajets (avec support de filtrage) - Pas de changement majeur nécessaire ici
exports.getAllTrips = async (req, res) => {
    try {
        const filters = req.query;
        console.log("DEBUG: Filtres reçus pour getAllTrips :", filters);

        const trips = await Trip.findFiltered(filters);
        res.status(200).json(trips);
    } catch (error) {
        console.error('Erreur lors de la récupération des trajets :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération des trajets.' });
    }
};

// Obtenir un trajet par ID - Pas de changement majeur nécessaire ici
exports.getTripById = async (req, res) => {
    try {
        const { id_trajet } = req.params;
        const trip = await Trip.findById(id_trajet);

        if (!trip) {
            return res.status(404).json({ message: 'Trajet non trouvé.' });
        }

        res.status(200).json(trip);
    } catch (error) {
        console.error('Erreur lors de la récupération du trajet par ID :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération du trajet.' });
    }
};

// Mettre à jour un trajet
exports.updateTrip = async (req, res) => {
    try {
        const { id_trajet } = req.params;
        const tripData = req.body;

        // Vérifier l'autorisation : seul le conducteur ou un admin peut modifier le trajet
        const existingTrip = await Trip.findById(id_trajet);
        if (!existingTrip) {
            return res.status(404).json({ message: 'Trajet non trouvé.' });
        }
        if (existingTrip.utilisateur_id_user != req.user.id_user && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas autorisé à modifier ce trajet.' });
        }

        let distance_estimee = existingTrip.distance_estimee;
        let duree_estimee = existingTrip.duree_estimee;

        // Recalculer distance/durée si les lieux de départ/arrivée changent
        const newIdLieuDepart = tripData.id_lieu_depart || existingTrip.id_lieu_depart;
        const newIdLieuArrivee = tripData.id_lieu_arrivee || existingTrip.id_lieu_arrivee;

        if ((newIdLieuDepart !== existingTrip.id_lieu_depart || newIdLieuArrivee !== existingTrip.id_lieu_arrivee) && process.env.Maps_API_KEY) {
            const lieuDepart = await Lieu.findById(newIdLieuDepart);
            const lieuArrivee = await Lieu.findById(newIdLieuArrivee);

            if (!lieuDepart || !lieuArrivee) {
                return res.status(404).json({ message: 'Le nouveau lieu de départ ou d\'arrivée n\'a pas été trouvé.' });
            }

            try {
                const response = await client.directions({
                    params: {
                        origin: { lat: lieuDepart.latitude, lng: lieuDepart.longitude },
                        destination: { lat: lieuArrivee.latitude, lng: lieuArrivee.longitude },
                        key: process.env.Maps_API_KEY,
                    },
                    timeout: 1000,
                });

                if (response.data.routes && response.data.routes.length > 0) {
                    const route = response.data.routes[0].legs[0];
                    distance_estimee = route.distance.value;
                    duree_estimee = route.duration.value;
                    // Mettre à jour les données du trajet avec les nouvelles valeurs
                    tripData.distance_estimee = distance_estimee;
                    tripData.duree_estimee = duree_estimee;
                }
            } catch (googleError) {
                console.error("Erreur Google Maps API lors de la mise à jour du trajet :", googleError.response ? googleError.response.data : googleError.message);
            }
        } else if (!process.env.Maps_API_KEY) {
            console.warn("Maps_API_KEY non défini. Le recalcul de distance/durée sera omis lors de la mise à jour.");
        }


        const updatedTrip = await Trip.update(id_trajet, tripData);

        if (!updatedTrip) {
            return res.status(404).json({ message: 'Trajet non trouvé ou aucune donnée valide fournie pour la mise à jour.' });
        }

        // Après la mise à jour, récupérer le trajet complet avec les détails des lieux
        const tripWithDetails = await Trip.findById(updatedTrip.id_trajet);

        res.status(200).json({ message: 'Trajet mis à jour avec succès.', trip: tripWithDetails });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du trajet :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la mise à jour du trajet.' });
    }
};

// Supprimer un trajet - Pas de changement majeur nécessaire ici
exports.deleteTrip = async (req, res) => {
    try {
        const { id_trajet } = req.params;

        // Vérifier l'autorisation : seul le conducteur ou un admin peut supprimer le trajet
        const existingTrip = await Trip.findById(id_trajet);
        if (!existingTrip) {
            return res.status(404).json({ message: 'Trajet non trouvé.' });
        }
        if (existingTrip.utilisateur_id_user != req.user.id_user && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas autorisé à supprimer ce trajet.' });
        }

        const deletedTrip = await Trip.delete(id_trajet);

        if (!deletedTrip) {
            return res.status(404).json({ message: 'Trajet non trouvé.' });
        }

        res.status(200).json({ message: 'Trajet supprimé avec succès.', trip: deletedTrip });

    } catch (error) {
        console.error('Erreur lors de la suppression du trajet :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la suppression du trajet.' });
    }
};