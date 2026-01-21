const Reservation = require('../models/reservation.model');
const Trip = require('../models/trip.model'); 
const User = require('../models/user.model');
const notificationUtil = require('../utils/notification.utils');

// Créer une nouvelle réservation
exports.createReservation = async (req, res) => {
    try {
        const { tripId } = req.body;
        const {id} = req.params; 
        console.log('entrée dans create de reservationController: ', tripId, id)
        // 2. Récupérer les détails du trajet pour vérifier la disponibilité et l'ID du conducteur
        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ message: 'Trajet non trouvé.' });
        }

        // Vérifier que l'utilisateur ne réserve pas son propre trajet (s'il est le conducteur)
        if (trip.utilisateur_id_user && parseInt(trip.utilisateur_id_user) === parseInt(id)) {
             return res.status(403).json({ message: 'Vous ne pouvez pas réserver votre propre trajet.' });
        }

        // 3. Vérifier les places disponibles
        if (trip.places_disponibles <=0) {
            return res.status(400).json({ message: `Pas assez de places disponibles sur ce trajet. Il reste ${trip.places_disponibles} place(s).` });
        }

        //4. On  vérifie que l'utilisateur n'a pas déjà réservé sur ce trajet
        const isParticipant = await Reservation.findByUserId(id)
        if(isParticipant){
            return res.status(400).json({ message: `Vous êtes déjà inscrit sur ce trajet.` });
        }

        // Préparer les données pour la nouvelle réservation
        const newReservationData = {
            utilisateur_id_user: id,
            trajet_id_trajet: tripId,
            nb_places_reservees: 1,
            statut: 'pending',
            // Le champ trajet_utilisateur_id est l'ID du conducteur du trajet
            trajet_utilisateur_id: trip.utilisateur_id_user // L'ID du créateur du trajet
        };

        // 4. Créer la réservation
        const createdReservation = await Reservation.create(newReservationData);

        if (!createdReservation) {
            throw new Error("La réservation n'a pas pu être créée dans la base de données.");
        }

        // 5. Mettre à jour les places disponibles du trajet
        const updatedPlaces = trip.places_disponibles - 1;
        await Trip.update(tripId, { places_disponibles: updatedPlaces });

        // 6. Récupérer la réservation complète avec les détails pour la réponse ET les notifications
        const reservationWithDetails = await Reservation.findById(createdReservation.id_reservation);

        // ---ENVOI DES NOTIFICATIONS ---
        // Récupérer les détails de l'utilisateur passager et conducteur pour leurs emails
        const passenger = await User.findById(id);
        const driver = await User.findById(trip.utilisateur_id_user);

        if (passenger && passenger.email) {
            await notificationUtil.sendNewReservationNotification(
                passenger.email,
                passenger.prenom || passenger.nom,
                reservationWithDetails.trip_details,
                reservationWithDetails
            );
        }
        if (driver && driver.email) {
            await notificationUtil.sendDriverNewReservationNotification(
                driver.email,
                driver.prenom || driver.nom,
                passenger ? (passenger.prenom || passenger.nom) : 'Un passager',
                reservationWithDetails.trip_details,
                reservationWithDetails
            );
        }
        // --- FIN ENVOI DES NOTIFICATIONS ---

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
        const userId = req.params.id;
        console.log("Entrée dans getUserReservations: ", userId)

        const reservations = await Reservation.findByUserId(userId);
        console.log("reservations: ", reservations)
        res.status(200).json(reservations);
    } catch (error) {
        console.error('Erreur lors de la récupération des réservations de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer toutes les réservations pour un trajet donné (pour le conducteur)
exports.getTripReservations = async (req, res) => {
    try {
        const { tripId } = req.params;
        const userId = req.user.id_user;

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

        // Vérification d'autorisation 
        const trip = await Trip.findById(existingReservation.trajet_id_trajet);
        if (!trip) { 
            console.warn(`Trajet associé à la réservation ${id} non trouvé lors de la mise à jour.`);
            return res.status(404).json({ message: 'Trajet associé à la réservation non trouvé.' });
        }

        const isTripOwner = parseInt(trip.utilisateur_id_user) === parseInt(userId);
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

        // Logique pour la mise à jour des places et des statuts
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
            placesToUpdateInTrip = -oldPlaces;
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

        // --- DÉBUT ENVOI DES NOTIFICATIONS POUR ANNULATION/MODIFICATION DE STATUT ---
        // Récupérer la réservation complète avec les détails pour la notification après update
        const reservationDetailsForNotification = await Reservation.findById(updatedReservation.id_reservation);
        const passenger = await User.findById(existingReservation.utilisateur_id_user);
        const driver = await User.findById(trip.utilisateur_id_user);

        // Si le statut est passé à 'cancelled' et n'était pas déjà 'cancelled'
        if (updateData.statut === 'cancelled' && oldStatut !== 'cancelled') {
            if (passenger && passenger.email) {
                await notificationUtil.sendReservationCancellationNotification(
                    passenger.email,
                    passenger.prenom || passenger.nom,
                    'Votre réservation a été annulée par vous ou le conducteur.',
                    reservationDetailsForNotification.trip_details,
                    reservationDetailsForNotification
                );
            }
            if (driver && driver.email) {
                 await notificationUtil.sendEmail(
                    driver.email,
                    'Une réservation pour votre trajet a été annulée',
                    `<p>Bonjour ${driver.prenom || driver.nom},</p><p>Une réservation (${reservationDetailsForNotification.nb_places_reservees} place(s)) de ${passenger ? (passenger.prenom || passenger.nom) : 'un passager'} pour votre trajet de ${reservationDetailsForNotification.trip_details.lieu_depart_details ? reservationDetailsForNotification.trip_details.lieu_depart_details.nom_lieu : 'N/A'} à ${reservationDetailsForNotification.trip_details.lieu_arrivee_details ? reservationDetailsForNotification.trip_details.lieu_arrivee_details.nom_lieu : 'N/A'} a été annulée.</p>`
                );
            }
        }
        // --- FIN ENVOI DES NOTIFICATIONS ---

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

        console.log('Appel de delete reservation: ', id, userId)
        const existingReservation = await Reservation.findById(id);

        if (!existingReservation) {
            return res.status(404).json({ message: 'Réservation non trouvée.' });
        }

        // Vérification d'autorisation : seul l'utilisateur ayant fait la réservation,
        // le conducteur du trajet, ou un admin peut supprimer la réservation.
        const trip = await Trip.findById(existingReservation.trajet_id_trajet);
        if (!trip) {
            console.warn(`Trajet associé à la réservation ${id} non trouvé lors de la suppression.`);
        }

        const isTripOwner = trip && parseInt(trip.utilisateur_id_user) === parseInt(userId);
        const isReservationOwner = parseInt(existingReservation.utilisateur_id_user) === parseInt(userId);

        if (req.user.role !== 'admin' && !isReservationOwner && !isTripOwner) {
            return res.status(403).json({ message: 'Accès non autorisé à supprimer cette réservation.' });
        }

        const deletedReservation = await Reservation.delete(id);

        if (!deletedReservation) {
            return res.status(500).json({ message: 'Échec de la suppression de la réservation.' });
        }

        // Si la réservation est supprimée et n'était pas déjà "cancelled", libérer les places si le trajet existe
        if (deletedReservation.statut !== 'cancelled' && trip) {
            const updatedPlaces = trip.places_disponibles + deletedReservation.nb_places_reservees;
            await Trip.update(trip.id_trajet, { places_disponibles: updatedPlaces });
        }

        // --- DÉBUT ENVOI DES NOTIFICATIONS APRÈS SUPPRESSION ---
        const passenger = await User.findById(existingReservation.utilisateur_id_user);
        const driver = (trip && trip.utilisateur_id_user) ? await User.findById(trip.utilisateur_id_user) : null;

        // Pour les détails du trajet dans la notification, on utilise l'objet 'trip' déjà récupéré
        const tripDetailsForNotification = trip ? {
            id_trajet: trip.id_trajet,
            date_depart: trip.date_depart,
            heure_depart: trip.heure_depart,
            places_disponibles: trip.places_disponibles,
            prix_par_place: trip.prix_par_place,
            utilisateur_id_user: trip.utilisateur_id_user,
            id_lieu_depart: trip.id_lieu_depart,
            id_lieu_arrivee: trip.id_lieu_arrivee,
            lieu_depart_details: trip.lieu_depart_details,
            lieu_arrivee_details: trip.lieu_arrivee_details
        } : null;

        if (passenger && passenger.email) {
            await notificationUtil.sendReservationCancellationNotification(
                passenger.email,
                passenger.prenom || passenger.nom,
                'Votre réservation a été supprimée par vous ou le conducteur.',
                tripDetailsForNotification,
                deletedReservation
            );
        }
        if (driver && driver.email) {
            await notificationUtil.sendEmail(
                driver.email,
                'Une réservation pour votre trajet a été supprimée',
                `<p>Bonjour ${driver.prenom || driver.nom},</p><p>Une réservation (${deletedReservation.nb_places_reservees} place(s)) de ${passenger ? (passenger.prenom || passenger.nom) : 'un passager'} pour votre trajet a été supprimée.</p>`
            );
        }
        // --- FIN ENVOI DES NOTIFICATIONS ---

        res.status(200).json({ message: 'Réservation supprimée avec succès.', reservation: deletedReservation });

    } catch (error) {
        console.error('Erreur lors de la suppression de la réservation :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};