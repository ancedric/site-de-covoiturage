const Review = require('../models/review.model');
const Trip = require('../models/trip.model');
const Reservation = require('../models/reservation.model'); 

// Créer un nouvel avis
exports.createReview = async (req, res) => {
    try {
        const { id_utilisateur_cible, id_trajet, note, commentaire, type_avis } = req.body;
        const id_utilisateur_auteur = req.user.id_user; 

        // Validation des champs obligatoires
        if (!id_utilisateur_cible || !id_trajet || !note || !type_avis) {
            return res.status(400).json({ message: 'Les champs cible, trajet, note et type d\'avis sont obligatoires.' });
        }
        if (note < 1 || note > 5) {
            return res.status(400).json({ message: 'La note doit être entre 1 et 5.' });
        }
        if (id_utilisateur_auteur === parseInt(id_utilisateur_cible)) {
            return res.status(400).json({ message: 'Vous ne pouvez pas laisser un avis sur vous-même.' });
        }
        if (!['passager_vers_conducteur', 'conducteur_vers_passager'].includes(type_avis)) {
            return res.status(400).json({ message: 'Le type d\'avis n\'est pas valide.' });
        }

        // Vérifier si un avis existe déjà pour ce triplet (auteur, cible, trajet)
        const existingReview = await Review.findExistingReview(id_utilisateur_auteur, id_utilisateur_cible, id_trajet);
        if (existingReview) {
            return res.status(409).json({ message: 'Vous avez déjà laissé un avis pour cet utilisateur sur ce trajet.' });
        }

        // 1. Vérifier que le trajet existe
        const trip = await Trip.findById(id_trajet);
        if (!trip) {
            return res.status(404).json({ message: 'Trajet non trouvé.' });
        }

        // 2. Vérifier la légitimité de l'avis
        if (type_avis === 'passager_vers_conducteur') {
            // L'auteur doit être un passager du trajet (via une réservation confirmée/terminée)
            const reservation = await Reservation.findByUserId(id_utilisateur_auteur); // Récupérer les réservations de l'auteur
            const hasReservedAndCompleted = reservation.some(r =>
                parseInt(r.trajet_id_trajet) === parseInt(id_trajet) &&
                (r.statut === 'confirmed' || r.statut === 'completed')
            );

            if (!hasReservedAndCompleted) {
                return res.status(403).json({ message: 'Vous devez avoir réservé et complété ce trajet pour laisser un avis sur le conducteur.' });
            }
            // La cible de l'avis doit être le conducteur du trajet
            if (parseInt(id_utilisateur_cible) !== parseInt(trip.utilisateur_id_user)) {
                return res.status(403).json({ message: 'La cible de l\'avis n\'est pas le conducteur de ce trajet.' });
            }

        } else if (type_avis === 'conducteur_vers_passager') {
            // L'auteur doit être le conducteur du trajet
            if (parseInt(id_utilisateur_auteur) !== parseInt(trip.utilisateur_id_user)) {
                return res.status(403).json({ message: 'Vous devez être le conducteur de ce trajet pour laisser un avis sur un passager.' });
            }
            // La cible doit être un passager ayant réservé ce trajet (statut confirmé/terminé)
            const reservations = await Reservation.findByTripId(id_trajet);
            const isTargetPassenger = reservations.some(r =>
                parseInt(r.utilisateur_id_user) === parseInt(id_utilisateur_cible) &&
                (r.statut === 'confirmed' || r.statut === 'completed')
            );
            if (!isTargetPassenger) {
                return res.status(403).json({ message: 'La cible de l\'avis n\'est pas un passager confirmé de ce trajet.' });
            }
        }

        const newReviewData = {
            id_utilisateur_auteur,
            id_utilisateur_cible,
            id_trajet,
            note,
            commentaire: commentaire || null,
            type_avis
        };

        const createdReview = await Review.create(newReviewData);

        res.status(201).json({
            message: 'Avis créé avec succès.',
            review: createdReview
        });

    } catch (error) {
        console.error('Erreur lors de la création de l\'avis :', error);
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
             return res.status(409).json({ message: 'Un avis similaire existe déjà pour cet utilisateur et ce trajet.' });
        }
        res.status(500).json({ message: 'Erreur interne du serveur lors de la création de l\'avis.' });
    }
};

// Récupérer un avis par son ID
exports.getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ message: 'Avis non trouvé.' });
        }

        res.status(200).json(review);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'avis par ID :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer les avis laissés par l'utilisateur authentifié
exports.getReviewsByAuthUser = async (req, res) => {
    try {
        const auteurId = req.user.id_user; 
        const reviews = await Review.findByAuteurId(auteurId);
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Erreur lors de la récupération des avis laissés par l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer les avis reçus par un utilisateur (cible)
exports.getReviewsForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await Review.findByCibleId(userId);
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Erreur lors de la récupération des avis pour l\'utilisateur cible :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer les avis pour un trajet donné
exports.getReviewsForTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const reviews = await Review.findByTrajetId(tripId);
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Erreur lors de la récupération des avis pour le trajet :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Mettre à jour un avis existant
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, commentaire } = req.body;
        const userId = req.user.id_user; 

        const existingReview = await Review.findById(id);
        if (!existingReview) {
            return res.status(404).json({ message: 'Avis non trouvé.' });
        }

        // Seul l'auteur de l'avis ou un admin peut le modifier
        if (parseInt(existingReview.id_utilisateur_auteur) !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé à modifier cet avis.' });
        }

        const updateData = {};
        if (note !== undefined) {
            if (note < 1 || note > 5) {
                return res.status(400).json({ message: 'La note doit être entre 1 et 5.' });
            }
            updateData.note = note;
        }
        if (commentaire !== undefined) {
            updateData.commentaire = commentaire;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({ message: 'Aucune modification détectée pour l\'avis.' });
        }

        const updatedReview = await Review.update(id, updateData);
        if (!updatedReview) {
            return res.status(500).json({ message: 'Échec de la mise à jour de l\'avis.' });
        }

        res.status(200).json({ message: 'Avis mis à jour avec succès.', review: updatedReview });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'avis :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Supprimer un avis
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id_user;

        const existingReview = await Review.findById(id);
        if (!existingReview) {
            return res.status(404).json({ message: 'Avis non trouvé.' });
        }

        // Seul l'auteur de l'avis ou un admin peut le supprimer
        if (parseInt(existingReview.id_utilisateur_auteur) !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé à supprimer cet avis.' });
        }

        const deletedReview = await Review.delete(id);
        if (!deletedReview) {
            return res.status(500).json({ message: 'Échec de la suppression de l\'avis.' });
        }

        res.status(200).json({ message: 'Avis supprimé avec succès.', review: deletedReview });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'avis :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};

// Récupérer la note moyenne d'un utilisateur
exports.getAverageRating = async (req, res) => {
    try {
        const { userId } = req.params;
        const averageNote = await Review.getAverageRatingForUser(userId);
        res.status(200).json({ userId: parseInt(userId), averageRating: averageNote });
    } catch (error) {
        console.error('Erreur lors de la récupération de la note moyenne :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
};