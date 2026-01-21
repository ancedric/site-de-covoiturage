const pool = require('../db/db.config');

class Voiture { 
    constructor(voiture) {
        this.id_voiture = voiture.id_voiture;
        this.utilisateur_id_user = voiture.utilisateur_id_user;
        this.marque = voiture.marque;
        this.modele = voiture.modele;
        this.annee = voiture.annee;
        this.couleur = voiture.couleur;
        this.plaque_immatriculation = voiture.plaque_immatriculation;
        this.nb_places = voiture.nb_places;
        this.url_image_vehicule = voiture.url_image_vehicule;
    }

    static async create(newVoiture) {
        try {
            const result = await pool.query(
                `INSERT INTO "voiture" (utilisateur_id_user, marque, modele, annee, couleur, plaque_immatriculation, nb_places, url_image_vehicule)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [
                    newVoiture.utilisateur_id_user,
                    newVoiture.marque,
                    newVoiture.modele,
                    newVoiture.annee,
                    newVoiture.couleur,
                    newVoiture.plaque_immatriculation,
                    newVoiture.nb_places,
                    newVoiture.url_image_vehicule
                ]
            );
            return new Voiture(result.rows[0]);
        } catch (error) {
            console.error("Erreur lors de la création de la voiture (MODEL) :", error);
            throw error;
        }
    }

    static async findAll() {
        try {
            const result = await pool.query(`SELECT * FROM "voiture"`);
            if (result.rows.length > 0) {
                return new Voiture(result.rows);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la récupération de la voiture par ID (MODEL) :", error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const result = await pool.query(`SELECT * FROM "voiture" WHERE id_voiture = $1`, [parseInt(id)]);
            if (result.rows.length > 0) {
                return new Voiture(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la récupération de la voiture par ID (MODEL) :", error);
            throw error;
        }
    }

    static async findByUserId(userId) {
        if (!userId) {
            return [];
        }
        else{
            try {
                const result = await pool.query(`SELECT * FROM "voiture" WHERE utilisateur_id_user = $1`, [parseInt(userId)]);
                return result.rows.map(row => new Voiture(row));
            } catch (error) {
                console.error("Erreur lors de la récupération des voitures par utilisateur (MODEL) :", error);
                throw error;
            }
        }
    }

    static async findByCarId(carId) {
        if (!carId) {
            return [];
        }
        else{
            try {
                const result = await pool.query(`SELECT * FROM "voiture" WHERE id_voiture = $1`, [parseInt(carId)]);
                return result.rows.map(row => new Voiture(row));
            } catch (error) {
                console.error("Erreur lors de la récupération des voitures par utilisateur (MODEL) :", error);
                throw error;
            }
        }
    }

    // Méthode pour trouver une voiture par ses caractéristiques pour un utilisateur
    static async findByCharacteristicsForUser(userId, marque, modele, annee, plaqueImmatriculation) {
        try {
            const result = await pool.query(
                `SELECT * FROM "voiture"
                 WHERE utilisateur_id_user = $1
                 AND marque = $2
                 AND modele = $3
                 AND annee = $4
                 AND plaque_immatriculation = $5`,
                [parseInt(userId), marque, modele, annee, plaqueImmatriculation]
            );
            if (result.rows.length > 0) {
                return new Voiture(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la recherche de voiture par caractéristiques pour l'utilisateur (MODEL) :", error);
            throw error;
        }
    }

    static async update(id, voitureData) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            const updatableFields = ['marque', 'modele', 'annee', 'couleur', 'plaque_immatriculation', 'nb_places', 'url_image_vehicule']; // Ajout du champ

            for (const key of updatableFields) {
                if (voitureData.hasOwnProperty(key)) {
                    fields.push(`"${key}" = $${paramIndex}`);
                    values.push(voitureData[key]);
                    paramIndex++;
                }
            }

            if (fields.length === 0) {
                return null; 
            }

            values.push(parseInt(id));
            const result = await pool.query(
                `UPDATE "voiture" SET ${fields.join(', ')} WHERE id_voiture = $${paramIndex} RETURNING *`,
                values
            );
            if (result.rows.length > 0) {
                return new Voiture(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la voiture (MODEL) :", error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const result = await pool.query(`DELETE FROM "voiture" WHERE id_voiture = $1 RETURNING *`, [parseInt(id)]);
            if (result.rows.length > 0) {
                return new Voiture(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la suppression de la voiture (MODEL) :", error);
            throw error;
        }
    }
}

module.exports = Voiture;
