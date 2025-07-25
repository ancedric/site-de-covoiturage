// backend/controllers/reservation.controller.js
const Reservation = require('../models/reservation.model');
const Trip = require('../models/trip.model'); // Nous aurons besoin du modèle Trip pour vérifier les places

// Créer une nouvelle réservation
exports.createReservation = async (req, res) => {
    try {
        const { trajet_id_trajet, nb_places_reservees, statut } = req.body;
        const utilisateur_id_user = req.user.id_user; // Récupéré de l'authentification JWT

        // 1. Validation des champs obligatoires
        if (!trajet_id_trajet || !nb_places_reservees || !utilisateur_id_user) {
            return res.status(400).json({ message: 'Tous les champs obligatoires (trajet_id_trajet, nb_places_reservees) doivent être fournis.' });
        }

        // 2. Récupérer les détails du trajet pour vérifier la disponibilité et l'ID du conducteur
        const trip = await Trip.findById(trajet_id_trajet);

        if (!trip) {
            return res.status(404).json({ message: 'Trajet non trouvé.' });
        }

        // Vérifier que l'utilisateur ne réserve pas son propre trajet (s'il est le conducteur)
        if (trip.utilisateur_id_user && parseInt(trip.utilisateur_id_user) === parseInt(utilisateur_id_user)) {
             return res.status(403).json({ message: 'Vous ne pouvez pas réserver votre propre trajet.' });
        }

        // 3. Vérifier les places disponibles
        if (nb_places_reservees > trip.places_disponibles) {
            return res.status(400).json({ message: `Pas assez de places disponibles sur ce trajet. Il reste ${trip.places_disponibles} place(s).` });
        }

        // Préparer les données pour la nouvelle réservation
        const newReservationData = {
            utilisateur_id_user: utilisateur_id_user,
            trajet_id_trajet: trajet_id_trajet,
            nb_places_reservees: nb_places_reservees,
            statut: statut || 'pending', // Statut par défaut
            // Le champ trajet_utilisateur_id est l'ID du conducteur du trajet
            trajet_utilisateur_id: trip.utilisateur_id_user // L'ID du créateur du trajet
        };

        // 4. Créer la réservation
        const createdReservation = await Reservation.create(newReservationData);

        if (!createdReservation) {
            throw new Error("La réservation n'a pas pu être créée dans la base de données.");
        }

        // 5. Mettre à jour les places disponibles du trajet
        const updatedPlaces = trip.places_disponibles - nb_places_reservees;
        await Trip.update(trajet_id_trajet, { places_disponibles: updatedPlaces });

        // 6. Récupérer la réservation complète avec les détails pour la réponse
        const reservationWithDetails = await Reservation.findById(createdReservation.id_reservation);

        res.status(201).json({
            message: 'Réservation créée avec succès et places mises à jour.',
            reservation: reservationWithDetails
        });

    } catch (error) {
        console.error('Erreur lors de la création de la réservation (CONTROLLER) :', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la création de la réservation.' });
    }
};

// Récupérer une réservation par son ID
exports.getReservationById = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).json({ message: 'Réservation non trouvée.' });
        }

        // Vérification d'autorisation (seul l'utilisateur concerné ou un admin peut voir sa réservation)
        if (req.user.role !== 'admin' && parseInt(req.user.id_user) !== parseInt(reservation.utilisateur_id_user)) {
            return res.status(403).json({ message: 'Accès non autorisé à cette réservation.' });
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error('Erreur lors de la récupération de la réservation par ID :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer toutes les réservations d'un utilisateur (l'utilisateur authentifié)
exports.getUserReservations = async (req, res) => {
    try {
        const userId = req.user.id_user; // Récupérer l'ID de l'utilisateur authentifié

        const reservations = await Reservation.findByUserId(userId);
        res.status(200).json(reservations);
    } catch (error) {
        console.error('Erreur lors de la récupération des réservations de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer toutes les réservations pour un trajet donné (pour le conducteur)
exports.getTripReservations = async (req, res) => {
    try {
        const { tripId } = req.params; // ID du trajet
        const userId = req.user.id_user; // ID de l'utilisateur authentifié

        // Vérifier que l'utilisateur authentifié est bien le conducteur de ce trajet
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: 'Trajet non trouvé.' });
        }
        if (parseInt(trip.utilisateur_id_user) !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé. Vous n\'êtes pas le conducteur de ce trajet.' });
        }

        const reservations = await Reservation.findByTripId(tripId);
        res.status(200).json(reservations);
    } catch (error) {
        console.error('Erreur lors de la récupération des réservations pour le trajet :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};


// Mettre à jour le statut ou le nombre de places d'une réservation
exports.updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { nb_places_reservees, statut } = req.body;
        const userId = req.user.id_user;

        const existingReservation = await Reservation.findById(id);

        if (!existingReservation) {
            return res.status(404).json({ message: 'Réservation non trouvée.' });
        }

        // Vérification d'autorisation : seul l'utilisateur ayant fait la réservation,
        // le conducteur du trajet, ou un admin peut modifier la réservation.
        const trip = await Trip.findById(existingReservation.trajet_id_trajet);
        const isTripOwner = trip && parseInt(trip.utilisateur_id_user) === parseInt(userId);
        const isReservationOwner = parseInt(existingReservation.utilisateur_id_user) === parseInt(userId);

        if (req.user.role !== 'admin' && !isReservationOwner && !isTripOwner) {
            return res.status(403).json({ message: 'Accès non autorisé à modifier cette réservation.' });
        }

        const oldPlaces = existingReservation.nb_places_reservees;
        const oldStatut = existingReservation.statut;

        // Préparer les données à mettre à jour
        const updateData = {};
        if (nb_places_reservees !== undefined && nb_places_reservees !== oldPlaces) {
            updateData.nb_places_reservees = nb_places_reservees;
        }
        if (statut !== undefined && statut !== oldStatut) {
            updateData.statut = statut;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({ message: 'Aucune modification détectée pour la réservation.' });
        }

        // Logique complexe pour la mise à jour des places et des statuts
        let placesToUpdateInTrip = 0;
        if (updateData.nb_places_reservees !== undefined) {
            // Si le statut est "cancelled", les places sont libérées, quelle que soit la nouvelle valeur de places_reservees
            if (updateData.statut === 'cancelled' || oldStatut === 'cancelled') {
                // Si elle était déjà annulée, ou si elle devient annulée, on libère les anciennes places
                placesToUpdateInTrip = oldPlaces;
            } else {
                // Sinon, la différence de places affecte directement les places disponibles
                placesToUpdateInTrip = oldPlaces - updateData.nb_places_reservees;
            }
        } else if (updateData.statut === 'cancelled' && oldStatut !== 'cancelled') {
            // Si le statut passe à "cancelled" et n'était pas déjà annulé, on libère les places actuelles
            placesToUpdateInTrip = oldPlaces;
        } else if (oldStatut === 'cancelled' && updateData.statut && updateData.statut !== 'cancelled') {
            // Si le statut passe de "cancelled" à autre chose (ex: "confirmed"), les places doivent être ré-occupées
            // On doit vérifier la disponibilité AVANT de mettre à jour le statut
            if (trip.places_disponibles < oldPlaces) {
                return res.status(400).json({ message: 'Pas assez de places disponibles pour réactiver cette réservation.' });
            }
            placesToUpdateInTrip = -oldPlaces; // Décrémenter les places disponibles
        }

        // Mettre à jour la réservation
        const updatedReservation = await Reservation.update(id, updateData);

        if (!updatedReservation) {
            return res.status(500).json({ message: 'Échec de la mise à jour de la réservation.' });
        }

        // Mettre à jour les places disponibles du trajet si nécessaire
        if (placesToUpdateInTrip !== 0) {
            await Trip.update(trip.id_trajet, { places_disponibles: trip.places_disponibles + placesToUpdateInTrip });
        }

        res.status(200).json({ message: 'Réservation mise à jour avec succès.', reservation: updatedReservation });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de la réservation :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Supprimer une réservation
exports.deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id_user;

        const existingReservation = await Reservation.findById(id);

        if (!existingReservation) {
            return res.status(404).json({ message: 'Réservation non trouvée.' });
        }

        // Vérification d'autorisation : seul l'utilisateur ayant fait la réservation,
        // le conducteur du trajet, ou un admin peut supprimer la réservation.
        const trip = await Trip.findById(existingReservation.trajet_id_trajet);
        const isTripOwner = trip && parseInt(trip.utilisateur_id_user) === parseInt(userId);
        const isReservationOwner = parseInt(existingReservation.utilisateur_id_user) === parseInt(userId);

        if (req.user.role !== 'admin' && !isReservationOwner && !isTripOwner) {
            return res.status(403).json({ message: 'Accès non autorisé à supprimer cette réservation.' });
        }

        const deletedReservation = await Reservation.delete(id);

        if (!deletedReservation) {
            return res.status(500).json({ message: 'Échec de la suppression de la réservation.' });
        }

        // Si la réservation est supprimée et n'était pas déjà "cancelled", libérer les places
        if (deletedReservation.statut !== 'cancelled') {
            const updatedPlaces = trip.places_disponibles + deletedReservation.nb_places_reservees;
            await Trip.update(trip.id_trajet, { places_disponibles: updatedPlaces });
        }

        res.status(200).json({ message: 'Réservation supprimée avec succès.', reservation: deletedReservation });

    } catch (error) {
        console.error('Erreur lors de la suppression de la réservation :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};