const pool = require('../db/db.config');

class Reservation {
    constructor(reservation) {
        this.id_reservation = reservation.id_reservation;
        this.nb_places_reservees = reservation.nb_places_reservees;
        this.statut = reservation.statut;
        this.date_reservation = reservation.date_reservation;
        this.utilisateur_id_user = reservation.utilisateur_id_user;
        this.trajet_id_trajet = reservation.trajet_id_trajet;
        this.trajet_utilisateur_id = reservation.trajet_utilisateur_id;

        // Pour les détails joints (si récupérés via JOIN)
        this.user_details = reservation.user_details;
        this.trip_details = reservation.trip_details;
    }

    // Créer une nouvelle réservation
    static async create(newReservation) {
        try {
            // Utiliser la date actuelle si date_reservation n'est pas fournie
            if (!newReservation.date_reservation) {
            const currentFormattedDate = new Date().toISOString();

            const result = await pool.query(
                `INSERT INTO "Reservation" (nb_places_reservees, statut, date_reservation, utilisateur_id_user, trajet_id_trajet, trajet_utilisateur_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    newReservation.nb_places_reservees,
                    newReservation.statut || 'pending', 
                    newReservation.date_reservation || currentFormattedDate,
                    newReservation.utilisateur_id_user,
                    newReservation.trajet_id_trajet,
                    newReservation.trajet_utilisateur_id
                ]
            );
                return new Reservation(result.rows[0]);
            }
        } catch (error) {
            console.error("Erreur lors de la création de la réservation (MODEL) :", error);
            throw error;
        }
    }

    // Récupérer une réservation par ID avec les détails de l'utilisateur et du trajet
    static async findById(id) {
        try {
            const query = `
                SELECT
                    r.*,
                    json_build_object(
                        'id_user', u.id_user,
                        'nom', u.nom,
                        'prenom', u.prenom,
                        'email', u.email
                    ) AS user_details,
                    json_build_object(
                        'id_trajet', t.id_trajet,
                        'date_depart', t.date_depart,
                        'heure_depart', t.heure_depart,
                        'places_disponibles', t.places_disponibles,
                        'prix_par_place', t.prix_par_place,
                        'utilisateur_id_user', t.utilisateur_id_user -- Assurez-vous d'inclure l'ID du conducteur du trajet
                    ) AS trip_details
                FROM "Reservation" AS r
                JOIN "utilisateur" AS u ON r.utilisateur_id_user = u.id_user
                JOIN "trajet" AS t ON r.trajet_id_trajet = t.id_trajet
                WHERE r.id_reservation = $1`;

            const result = await pool.query(query, [parseInt(id)]);
            if (result.rows.length > 0) {
                return new Reservation(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la récupération de la réservation par ID (MODEL) :", error);
            throw error;
        }
    }

    // Récupérer toutes les réservations d'un utilisateur
    static async findByUserId(userId) {
        try {
            const query = `
                SELECT
                    r.*,
                    json_build_object(
                        'id_trajet', t.id_trajet,
                        'date_depart', t.date_depart,
                        'heure_depart', t.heure_depart,
                        'places_disponibles', t.places_disponibles,
                        'prix_par_place', t.prix_par_place,
                        'utilisateur_id_user', t.utilisateur_id_user -- Inclure l'ID du conducteur
                    ) AS trip_details
                FROM "Reservation" AS r
                JOIN "trajet" AS t ON r.trajet_id_trajet = t.id_trajet
                WHERE r.utilisateur_id_user = $1
                ORDER BY r.date_reservation DESC`;

            const result = await pool.query(query, [parseInt(userId)]);
            return result.rows.map(row => new Reservation(row));
        } catch (error) {
            console.error("Erreur lors de la récupération des réservations par utilisateur (MODEL) :", error);
            throw error;
        }
    }

    // Récupérer toutes les réservations pour un trajet donné
    static async findByTripId(tripId) {
        try {
            const query = `
                SELECT
                    r.*,
                    json_build_object(
                        'id_user', u.id_user,
                        'nom', u.nom,
                        'prenom', u.prenom,
                        'email', u.email
                    ) AS user_details
                FROM "Reservation" AS r
                JOIN "utilisateur" AS u ON r.utilisateur_id_user = u.id_user
                WHERE r.trajet_id_trajet = $1
                ORDER BY r.date_reservation ASC`;

            const result = await pool.query(query, [parseInt(tripId)]);
            return result.rows.map(row => new Reservation(row));
        } catch (error) {
            console.error("Erreur lors de la récupération des réservations par trajet (MODEL) :", error);
            throw error;
        }
    }

    // Mettre à jour une réservation
    static async update(id, reservationData) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            const updatableFields = ['nb_places_reservees', 'statut'];

            for (const key of updatableFields) {
                if (reservationData.hasOwnProperty(key)) {
                    fields.push(`"${key}" = $${paramIndex}`);
                    values.push(reservationData[key]);
                    paramIndex++;
                }
            }

            if (fields.length === 0) {
                return null;
            }

            values.push(parseInt(id));
            const result = await pool.query(
                `UPDATE "Reservation" SET ${fields.join(', ')} WHERE id_reservation = $${paramIndex} RETURNING *`,
                values
            );
            if (result.rows.length > 0) {
                return new Reservation(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la réservation (MODEL) :", error);
            throw error;
        }
    }

    // Supprimer une réservation
    static async delete(id) {
        try {
            const result = await pool.query(`DELETE FROM "Reservation" WHERE id_reservation = $1 RETURNING *`, [parseInt(id)]);
            if (result.rows.length > 0) {
                return new Reservation(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la suppression de la réservation (MODEL) :", error);
            throw error;
        }
    }
}

module.exports = Reservation;