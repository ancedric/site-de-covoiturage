const Trip = require('../models/trip.model');
const Lieu = require('../models/lieu.model');
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

// Créer un nouveau trajet
exports.createTrip = async (req, res) => {
    try {
        const {
            id_lieu_depart, id_lieu_arrivee, date_depart, heure_depart,
            places_disponibles, prix_par_place, statut, id_vehicule
        } = req.body;
        const utilisateur_id_user = req.user.id_user;

        // Validation simple
        if (!id_lieu_depart || !id_lieu_arrivee || !date_depart || !heure_depart || !places_disponibles || !prix_par_place || !id_vehicule) { // <-- id_vehicule ajouté à la validation
            return res.status(400).json({ message: 'Tous les champs obligatoires du trajet (y compris le véhicule) doivent être fournis.' });
        }

        let distance_estimee = null;
        let duree_estimee = null;

        const lieuDepart = await Lieu.findById(id_lieu_depart);
        const lieuArrivee = await Lieu.findById(id_lieu_arrivee);

        if (!lieuDepart || !lieuArrivee) {
            return res.status(404).json({ message: 'Lieu de départ ou d\'arrivée non trouvé.' });
        }

        if (process.env.Maps_API_KEY && lieuDepart.latitude && lieuDepart.longitude && lieuArrivee.latitude && lieuArrivee.longitude) {
            try {
                const origins = [{ lat: lieuDepart.latitude, lng: lieuDepart.longitude }];
                const destinations = [{ lat: lieuArrivee.latitude, lng: lieuArrivee.longitude }];

                const response = await googleMapsClient.distancematrix({
                    params: {
                        origins: origins,
                        destinations: destinations,
                        key: process.env.Maps_API_KEY,
                    },
                    timeout: 1000,
                });

                if (response.data.rows.length > 0 && response.data.rows[0].elements.length > 0) {
                    const element = response.data.rows[0].elements[0];
                    if (element.status === 'OK') {
                        distance_estimee = element.distance.value;
                        duree_estimee = element.duration.value;
                    } else {
                        console.warn('Google Maps API Element Status:', element.status, element.fare ? element.fare.text : '');
                    }
                }
            } catch (googleMapsError) {
                console.error('Erreur Google Maps API lors de la création du trajet :', googleMapsError);
            }
        } else {
             console.warn('Clé API Google Maps manquante ou coordonnées de lieu non disponibles pour le calcul de distance/durée.');
        }


        const newTripData = {
            utilisateur_id_user,
            id_lieu_depart,
            id_lieu_arrivee,
            date_depart,
            heure_depart,
            places_disponibles,
            prix_par_place,
            statut,
            distance_estimee,
            duree_estimee,
            id_vehicule
        };

        const createdTrip = await Trip.create(newTripData);

        const tripWithDetails = await Trip.findById(createdTrip.id_trajet);

        res.status(201).json({
            message: 'Trajet créé avec succès.',
            trip: tripWithDetails
        });

    } catch (error) {
        console.error('Erreur lors de la création du trajet :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la création du trajet.' });
    }
};

//Ajouter un participant à un trajet
exports.addParticipant = async (req, res) => {
    try {
        const { id_trajet } = req.params;
        const {userId} = req.body;
        console.log('Appel de addParticipant', id_trajet, userId)
        const trip = await Trip.findById(id_trajet);
        if (!trip) {
            return res.status(404).json({ message: 'Trajet non trouvé.' });
        }
        if (trip.utilisateur_id_user === userId) {
            return res.status(400).json({ message: 'Le conducteur ne peut pas rejoindre son propre trajet.' });
        }
        if (trip.places_disponibles <= 0) {
            return res.status(400).json({ message: 'Aucune place disponible pour rejoindre ce trajet.' });
        }

        return res.status(200).json({message: 'inscription possible!', statut: true})
        // Vérifier si l'utilisateur est déjà inscrit
        const isParticipant = await Trip.isUserParticipant(id_trajet, userId);
        if (isParticipant) {
            return res.status(400).json({ message: 'Vous êtes déjà inscrit à ce trajet.' });
        }
        console.log("praticipating: ", isParticipant)
        // Ajouter l'utilisateur comme participant
        const updatedTrip = await Trip.addParticipant(id_trajet, userId);
        console.log('update: ', updatedTrip)
        if (!updatedTrip) {
            return res.status(404).json({ message: 'Trajet non trouvé ou aucune place disponible.' });
        }
        res.status(200).json({
            message: 'Vous avez rejoint le trajet avec succès.',
            trip: updatedTrip
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du participant au trajet :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de l\'ajout du participant au trajet.' });
    }
};

//Récupérer les participants d'un trajet
exports.getTripParticipants = async (req, res) => {
    try {
        console.log("DEBUG: Entreée das getTripPArticipants")
        const { id_trajet } = req.params;
        const participants = await Trip.getParticipants(id_trajet);
        console.log("DEBUG: Données: ", participants, " pour le trajet: ", id_trajet)
        if (!participants || participants.length === 0) {
            return res.status(200).json({ participants: [] });
        }
        res.status(200).json({ participants });
    } catch (error) {
        console.error('Erreur lors de la récupération des participants du trajet :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération des participants.' });
    }
};

// Obtenir tous les trajets (avec support de filtrage) - Pas de changement majeur nécessaire ici
exports.getAllTrips = async (req, res) => {
    try {
        const filters = req.query;
        console.log("DEBUG: Filtres reçus pour getAllTrips :", filters);

        const trips = await Trip.findFiltered(filters);
        console.log('trips:', trips)
        res.status(200).json(trips);
    } catch (error) {
        console.error('Erreur lors de la récupération des trajets :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération des trajets.' });
    }
};

// Obtenir un trajet par ID
exports.getTripById = async (req, res) => {
    try {
        const { id_trajet } = req.params;
        console.log('id trajet: ', id_trajet)
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

//Obtenir tous les trajet d'un utilisateur
exports.getTripByUserId = async (req, res) => {
    try {
        const { user_id } = req.params;
        const trips = await Trip.findByUserId(user_id);
        if (!trips || trips.length === 0) {
            return res.status(404).json({ message: 'Aucun trajet trouvé pour cet utilisateur.' });
        }
        console.log("trips: ", trips)
        res.status(200).json({ trips });
    } catch (error) {
        console.error('Erreur lors de la récupération des trajets par utilisateur :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération des trajets.' });
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