const pool = require('../db/db.config');

class Review {
    constructor(review) {
        this.id_avis = review.id_avis;
        this.id_utilisateur_auteur = review.id_utilisateur_auteur;
        this.id_utilisateur_cible = review.id_utilisateur_cible;
        this.id_trajet = review.id_trajet;
        this.note = review.note;
        this.commentaire = review.commentaire;
        this.date_avis = review.date_avis;
        this.type_avis = review.type_avis;

        // Pour les détails joints (si récupérés via JOIN)
        this.auteur_details = review.auteur_details;
        this.cible_details = review.cible_details;
        this.trajet_details = review.trajet_details;
    }

    static async create(newReview) {
        try {
            const currentFormattedDate = new Date().toISOString();

            const result = await pool.query(
                `INSERT INTO "Avis" (id_utilisateur_auteur, id_utilisateur_cible, id_trajet, note, commentaire, date_avis, type_avis)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    newReview.id_utilisateur_auteur,
                    newReview.id_utilisateur_cible,
                    newReview.id_trajet,
                    newReview.note,
                    newReview.commentaire,
                    newReview.date_avis || currentFormattedDate,
                    newReview.type_avis
                ]
            );
            return new Review(result.rows[0]);
        } catch (error) {
            console.error("Erreur lors de la création de l'avis (MODEL) :", error);
            throw error;
        }
    }

    // Méthode pour récupérer un avis par son ID, avec les détails joints
    static async findById(id) {
        try {
            const query = `
                SELECT
                    a.*,
                    json_build_object(
                        'id_user', ua.id_user, 'nom', ua.nom, 'prenom', ua.prenom
                    ) AS auteur_details,
                    json_build_object(
                        'id_user', uc.id_user, 'nom', uc.nom, 'prenom', uc.prenom
                    ) AS cible_details,
                    json_build_object(
                        'id_trajet', t.id_trajet, 'date_depart', t.date_depart, 'heure_depart', t.heure_depart,
                        'lieu_depart', ld.nom_lieu, 'lieu_arrivee', la.nom_lieu
                    ) AS trajet_details
                FROM "Avis" AS a
                JOIN "utilisateur" AS ua ON a.id_utilisateur_auteur = ua.id_user
                JOIN "utilisateur" AS uc ON a.id_utilisateur_cible = uc.id_user
                JOIN "trajet" AS t ON a.id_trajet = t.id_trajet
                JOIN "lieu" AS ld ON t.id_lieu_depart = ld.id_lieu
                JOIN "lieu" AS la ON t.id_lieu_arrivee = la.id_lieu
                WHERE a.id_avis = $1`;
            const result = await pool.query(query, [parseInt(id)]);
            if (result.rows.length > 0) {
                return new Review(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la récupération de l'avis par ID (MODEL) :", error);
            throw error;
        }
    }

    // Méthode pour récupérer les avis laissés par un utilisateur
    static async findByAuteurId(auteurId) {
        try {
            const query = `
                SELECT
                    a.*,
                    json_build_object(
                        'id_user', uc.id_user, 'nom', uc.nom, 'prenom', uc.prenom
                    ) AS cible_details,
                    json_build_object(
                        'id_trajet', t.id_trajet, 'date_depart', t.date_depart, 'heure_depart', t.heure_depart,
                        'lieu_depart', ld.nom_lieu, 'lieu_arrivee', la.nom_lieu
                    ) AS trajet_details
                FROM "Avis" AS a
                JOIN "utilisateur" AS uc ON a.id_utilisateur_cible = uc.id_user
                JOIN "trajet" AS t ON a.id_trajet = t.id_trajet
                JOIN "lieu" AS ld ON t.id_lieu_depart = ld.id_lieu
                JOIN "lieu" AS la ON t.id_lieu_arrivee = la.id_lieu
                WHERE a.id_utilisateur_auteur = $1
                ORDER BY a.date_avis DESC`;
            const result = await pool.query(query, [parseInt(auteurId)]);
            return result.rows.map(row => new Review(row));
        } catch (error) {
            console.error("Erreur lors de la récupération des avis par auteur (MODEL) :", error);
            throw error;
        }
    }

    // Méthode pour récupérer les avis reçus par un utilisateur
    static async findByCibleId(cibleId) {
        try {
            const query = `
                SELECT
                    a.*,
                    json_build_object(
                        'id_user', ua.id_user, 'nom', ua.nom, 'prenom', ua.prenom
                    ) AS auteur_details,
                    json_build_object(
                        'id_trajet', t.id_trajet, 'date_depart', t.date_depart, 'heure_depart', t.heure_depart,
                        'lieu_depart', ld.nom_lieu, 'lieu_arrivee', la.nom_lieu
                    ) AS trajet_details
                FROM "Avis" AS a
                JOIN "utilisateur" AS ua ON a.id_utilisateur_auteur = ua.id_user
                JOIN "trajet" AS t ON a.id_trajet = t.id_trajet
                JOIN "lieu" AS ld ON t.id_lieu_depart = ld.id_lieu
                JOIN "lieu" AS la ON t.id_lieu_arrivee = la.id_lieu
                WHERE a.id_utilisateur_cible = $1
                ORDER BY a.date_avis DESC`;
            const result = await pool.query(query, [parseInt(cibleId)]);
            return result.rows.map(row => new Review(row));
        } catch (error) {
            console.error("Erreur lors de la récupération des avis par cible (MODEL) :", error);
            throw error;
        }
    }

    // Méthode pour récupérer les avis pour un trajet donné
    static async findByTrajetId(trajetId) {
        try {
            const query = `
                SELECT
                    a.*,
                    json_build_object(
                        'id_user', ua.id_user, 'nom', ua.nom, 'prenom', ua.prenom
                    ) AS auteur_details,
                    json_build_object(
                        'id_user', uc.id_user, 'nom', uc.nom, 'prenom', uc.prenom
                    ) AS cible_details
                FROM "Avis" AS a
                JOIN "utilisateur" AS ua ON a.id_utilisateur_auteur = ua.id_user
                JOIN "utilisateur" AS uc ON a.id_utilisateur_cible = uc.id_user
                WHERE a.id_trajet = $1
                ORDER BY a.date_avis DESC`;
            const result = await pool.query(query, [parseInt(trajetId)]);
            return result.rows.map(row => new Review(row));
        } catch (error) {
            console.error("Erreur lors de la récupération des avis par trajet (MODEL) :", error);
            throw error;
        }
    }

    // Méthode pour vérifier si un avis existe déjà pour un triplet (auteur, cible, trajet)
    static async findExistingReview(auteurId, cibleId, trajetId) {
        try {
            const result = await pool.query(
                `SELECT * FROM "Avis" WHERE id_utilisateur_auteur = $1 AND id_utilisateur_cible = $2 AND id_trajet = $3`,
                [parseInt(auteurId), parseInt(cibleId), parseInt(trajetId)]
            );
            if (result.rows.length > 0) {
                return new Review(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la vérification de l'avis existant (MODEL) :", error);
            throw error;
        }
    }


    static async update(id, reviewData) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            const updatableFields = ['note', 'commentaire'];

            for (const key of updatableFields) {
                if (reviewData.hasOwnProperty(key)) {
                    fields.push(`"${key}" = $${paramIndex}`);
                    values.push(reviewData[key]);
                    paramIndex++;
                }
            }

            if (fields.length === 0) {
                return null;
            }

            values.push(parseInt(id));
            const result = await pool.query(
                `UPDATE "Avis" SET ${fields.join(', ')} WHERE id_avis = $${paramIndex} RETURNING *`,
                values
            );
            if (result.rows.length > 0) {
                return new Review(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'avis (MODEL) :", error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const result = await pool.query(`DELETE FROM "Avis" WHERE id_avis = $1 RETURNING *`, [parseInt(id)]);
            if (result.rows.length > 0) {
                return new Review(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la suppression de l'avis (MODEL) :", error);
            throw error;
        }
    }

    // Méthode pour calculer la note moyenne d'un utilisateur
    static async getAverageRatingForUser(userId) {
        try {
            const result = await pool.query(
                `SELECT AVG(note) AS average_note
                 FROM "Avis"
                 WHERE id_utilisateur_cible = $1`,
                [parseInt(userId)]
            );
            if (result.rows.length > 0 && result.rows[0].average_note) {
                return parseFloat(result.rows[0].average_note).toFixed(2);
            }
            return 0;
        } catch (error) {
            console.error("Erreur lors du calcul de la note moyenne de l'utilisateur (MODEL) :", error);
            throw error;
        }
    }
}

module.exports = Review;