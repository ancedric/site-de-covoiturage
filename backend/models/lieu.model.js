const pool = require('../db/db.config');

class Lieu {
    constructor(lieu) {
        this.id_lieu = lieu.id_lieu;
        this.nom_lieu = lieu.nom_lieu;
        this.adresse = lieu.adresse;
        this.ville = lieu.ville;
        this.pays = lieu.pays;
        this.latitude = lieu.latitude;
        this.longitude = lieu.longitude;
        this.description = lieu.description;
        this.created_at = lieu.created_at;
        this.updated_at = lieu.updated_at;
    }

    // Créer un nouveau lieu
    static async create(newLieu) {
        try {
            const result = await pool.query(
                `INSERT INTO "lieu" (nom_lieu, adresse, pays, latitude, longitude)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [
                    newLieu.nom_lieu,
                    newLieu.adresse,
                    newLieu.pays,
                    newLieu.latitude,
                    newLieu.longitude
                ]
            );
            return new Lieu(result.rows[0]);
        } catch (error) {
            console.error("Erreur lors de la création du lieu :", error);
            throw error;
        }
    }

    // Trouver tous les lieux
    static async findAll() {
        try {
            const result = await pool.query(`SELECT * FROM "lieu" ORDER BY nom_lieu ASC`);
            return result.rows.map(row => new Lieu(row));
        } catch (error) {
            console.error("Erreur lors de la récupération de tous les lieux :", error);
            throw error;
        }
    }

    // Trouver un lieu par ID
    static async findById(id) {
        try {
            const result = await pool.query(`SELECT * FROM "lieu" WHERE id_lieu = $1`, [id]);
            if (result.rows.length > 0) {
                return new Lieu(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la récupération du lieu par ID :", error);
            throw error;
        }
    }

    // Mettre à jour un lieu
    static async update(id, lieuData) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            for (const key in lieuData) {
                if (lieuData.hasOwnProperty(key)) {
                    fields.push(`"${key}" = $${paramIndex}`);
                    values.push(lieuData[key]);
                    paramIndex++;
                }
            }

            if (fields.length === 0) {
                return null;
            }

            values.push(id); 
            const result = await pool.query(
                `UPDATE "lieu" SET ${fields.join(', ')} WHERE id_lieu = $${paramIndex} RETURNING *`,
                values
            );
            if (result.rows.length > 0) {
                return new Lieu(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la mise à jour du lieu :", error);
            throw error;
        }
    }

    // Supprimer un lieu
    static async delete(id) {
        try {
            const result = await pool.query(`DELETE FROM "lieu" WHERE id_lieu = $1 RETURNING *`, [id]);
            if (result.rows.length > 0) {
                return new Lieu(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la suppression du lieu :", error);
            throw error;
        }
    }
}

module.exports = Lieu;