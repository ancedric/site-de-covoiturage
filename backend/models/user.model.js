// backend/models/user.model.js

const pool = require('../db/db.config');
const bcrypt = require('bcryptjs');

class User {
    constructor(user) {
        this.id_user = user.id_user;
        this.nom = user.nom;
        this.prenom = user.prenom;
        this.email = user.email;
        this.mot_de_passe = user.mot_de_passe;
        this.telephone = user.telephone;
        this.role = user.role || 'passager';
        this.date_inscription = user.date_inscription || new Date().toISOString();
        this.evaluation_moyenne = user.evaluation_moyenne || '0.0';
        this.photo_profil = user.photo_profil || null; 
    }

    // Méthode pour créer un nouvel utilisateur
    static async create(newUser) {
        try {
            const hashedPassword = await bcrypt.hash(newUser.mot_de_passe, 10);
            const now = new Date();
            const dateInscription = now.toISOString();

            const result = await pool.query(
                `INSERT INTO "utilisateur" (nom, prenom, email, mot_de_passe, telephone, role, date_inscription, evaluation_moyenne, photo_profil)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id_user, nom, prenom, email, telephone, role, date_inscription, evaluation_moyenne, photo_profil`,
                [
                    newUser.nom,
                    newUser.prenom,
                    newUser.email,
                    hashedPassword,
                    newUser.telephone,
                    newUser.role,
                    dateInscription,
                    '0.0',
                    newUser.photo_profil
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error("Erreur lors de la création de l'utilisateur :", error);
            throw error;
        }
    }

    // Méthode pour trouver un utilisateur par son email
    static async findByEmail(email) {
        try {
            const result = await pool.query(
                `SELECT id_user, nom, prenom, email, mot_de_passe, telephone, role, date_inscription, evaluation_moyenne, photo_profil
                 FROM "utilisateur"
                 WHERE email = $1`,
                [email]
            );
            return result.rows[0];
        } catch (error) {
            console.error("Erreur lors de la recherche de l'utilisateur par email :", error);
            throw error;
        }
    }

    // Méthode pour trouver un utilisateur par son ID
    static async findById(id) {
        try {
            const result = await pool.query(
                `SELECT id_user, nom, prenom, email, telephone, role, date_inscription, evaluation_moyenne, photo_profil
                 FROM "utilisateur"
                 WHERE id_user = $1`,
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error("Erreur lors de la recherche de l'utilisateur par ID :", error);
            throw error;
        }
    }

    // Méthode pour mettre à jour un utilisateur
    static async update(id, userData) {
        try {
            let query = `UPDATE "utilisateur" SET `;
            const updates = [];
            const values = [];
            let paramIndex = 1;

            for (const key in userData) {
                if (userData.hasOwnProperty(key) && key !== 'id_user' && key !== 'email') {
                    if (key === 'mot_de_passe') {
                        const hashedPassword = await bcrypt.hash(userData[key], 10);
                        updates.push(`${key} = $${paramIndex++}`);
                        values.push(hashedPassword);
                    } else {
                        updates.push(`${key} = $${paramIndex++}`);
                        values.push(userData[key]);
                    }
                }
            }

            if (updates.length === 0) {
                return null;
            }

            query += updates.join(', ') + ` WHERE id_user = $${paramIndex} RETURNING *`;
            values.push(id);

            const result = await pool.query(query, values);
            // Retourne les données de l'utilisateur après mise à jour (y compris photo_profil)
            return result.rows[0];
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
            throw error;
        }
    }

     // Méthode pour supprimer un utilisateur
    static async delete(id) {
        try {
            const result = await pool.query(
                `DELETE FROM "utilisateur" WHERE id_user = $1 RETURNING id_user`,
                [id]
            );
            return result.rows[0]; // Retourne l'ID de l'utilisateur supprimé si succès
        } catch (error) {
            console.error("Erreur lors de la suppression de l'utilisateur :", error);
            throw error;
        }
    }
    
    static async findAll() {
        try {
            const result = await pool.query(
                `SELECT id_user, nom, prenom, email, telephone, role, date_inscription, evaluation_moyenne, photo_profil
                 FROM "utilisateur"` // <--- MISE À JOUR DE LA REQUÊTE SELECT
            );
            return result.rows;
        } catch (error) {
            console.error("Erreur lors de la récupération de tous les utilisateurs :", error);
            throw error;
        }
    }
}

module.exports = User;