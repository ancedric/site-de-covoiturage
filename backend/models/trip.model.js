const pool = require('../db/db.config');

class Trip {
    constructor(trip) {
        this.id_trajet = trip.id_trajet;
        this.utilisateur_id_user = trip.utilisateur_id_user;
        this.id_lieu_depart = trip.id_lieu_depart;
        this.id_lieu_arrivee = trip.id_lieu_arrivee;
        if (trip.date_depart) {
            const dateObj = new Date(trip.date_depart);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            this.date_depart = `${year}-${month}-${day}`;
        } else {
            this.date_depart = null;
        }
        this.heure_depart = trip.heure_depart;
        this.places_disponibles = trip.places_disponibles;
        this.prix_par_place = trip.prix_par_place; 
        this.statut = trip.statut || 'actif';
        this.distance_estimee = trip.distance_estimee || null;
        this.duree_estimee = trip.duree_estimee || null;
        this.lieu_depart_details = trip.lieu_depart_details || { id_lieu: trip.id_lieu_depart };
        this.lieu_arrivee_details = trip.lieu_arrivee_details || { id_lieu: trip.id_lieu_arrivee };
    }

    // Créer un nouveau trajet
    static async create(newTrip) {
        try {
            const result = await pool.query(
                `INSERT INTO "trajet" (utilisateur_id_user, id_lieu_depart, id_lieu_arrivee, date_depart, heure_depart, places_disponibles, prix_par_place, statut, distance_estimee, duree_estimee)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [
                    newTrip.utilisateur_id_user,
                    newTrip.id_lieu_depart,
                    newTrip.id_lieu_arrivee,
                    newTrip.date_depart,
                    newTrip.heure_depart,
                    newTrip.places_disponibles,
                    newTrip.prix_par_place,
                    newTrip.statut || 'actif',
                    newTrip.distance_estimee,
                    newTrip.duree_estimee
                ]
            );
            return new Trip(result.rows[0]);
        } catch (error) {
            console.error("Erreur lors de la création du trajet :", error);
            throw error;
        }
    }

    // Récupérer un trajet par ID avec les détails des lieux
    static async findById(id) {
        try {
            const query = `
                SELECT
                    t.*,
                    json_build_object(
                        'id_lieu', ld.id_lieu,
                        'nom_lieu', ld.nom_lieu,
                        'adresse', ld.adresse,
                        'ville', ld.ville,
                        'pays', ld.pays,
                        'latitude', ld.latitude,
                        'longitude', ld.longitude
                    ) AS lieu_depart_details,
                    json_build_object(
                        'id_lieu', la.id_lieu,
                        'nom_lieu', la.nom_lieu,
                        'adresse', la.adresse,
                        'ville', la.ville,
                        'pays', la.pays,
                        'latitude', la.latitude,
                        'longitude', la.longitude
                    ) AS lieu_arrivee_details
                FROM "trajet" AS t
                JOIN "lieu" AS ld ON t.id_lieu_depart = ld.id_lieu
                JOIN "lieu" AS la ON t.id_lieu_arrivee = la.id_lieu
                WHERE t.id_trajet = $1`;

            const result = await pool.query(query, [id]);
            if (result.rows.length > 0) {
                return new Trip(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la récupération du trajet par ID :", error);
            throw error;
        }
    }

    // Récupérer tous les trajets avec filtres et détails des lieux
    static async findFiltered(filters) {
        let query = `
            SELECT
                t.*,
                json_build_object(
                    'id_lieu', ld.id_lieu,
                    'nom_lieu', ld.nom_lieu,
                    'adresse', ld.adresse,
                    'ville', ld.ville,
                    'pays', ld.pays,
                    'latitude', ld.latitude,
                    'longitude', ld.longitude
                ) AS lieu_depart_details,
                json_build_object(
                    'id_lieu', la.id_lieu,
                    'nom_lieu', la.nom_lieu,
                    'adresse', la.adresse,
                    'ville', la.ville,
                    'pays', la.pays,
                    'latitude', la.latitude,
                    'longitude', la.longitude
                ) AS lieu_arrivee_details
            FROM "trajet" AS t
            JOIN "lieu" AS ld ON t.id_lieu_depart = ld.id_lieu
            JOIN "lieu" AS la ON t.id_lieu_arrivee = la.id_lieu
            WHERE 1=1`;

        const values = [];
        let paramIndex = 1;

        // Ajouter des conditions de filtre si elles sont présentes
        if (filters.id_lieu_depart) {
            query += ` AND t.id_lieu_depart = $${paramIndex}`;
            values.push(parseInt(filters.id_lieu_depart));
            paramIndex++;
        } else if (filters.point_depart) {
            query += ` AND ld.nom_lieu ILIKE $${paramIndex}`;
            values.push(`%${filters.point_depart}%`);
            paramIndex++;
        }

        if (filters.id_lieu_arrivee) { // Filtrer par ID de lieu d'arrivée
            query += ` AND t.id_lieu_arrivee = $${paramIndex}`;
            values.push(parseInt(filters.id_lieu_arrivee));
            paramIndex++;
        } else if (filters.destination) { 
            query += ` AND la.nom_lieu ILIKE $${paramIndex}`;
            values.push(`%${filters.destination}%`);
            paramIndex++;
        }

        if (filters.date_depart) {
            query += ` AND t.date_depart = $${paramIndex}`;
            values.push(filters.date_depart);
            paramIndex++;
        }
        if (filters.places_disponibles) {
            query += ` AND t.places_disponibles >= $${paramIndex}`;
            values.push(parseInt(filters.places_disponibles));
            paramIndex++;
        }
        // Vous pouvez ajouter d'autres filtres ici

        query += ` ORDER BY t.date_depart ASC, t.heure_depart ASC`;

        console.log("DEBUG: Requête SQL de filtrage des trajets avec JOIN :", query);
        console.log("DEBUG: Valeurs de filtrage :", values);

        try {
            const result = await pool.query(query, values);
            return result.rows.map(row => new Trip(row));
        } catch (error) {
            console.error("Erreur lors de la récupération des trajets filtrés :", error);
            throw error;
        }
    }

    // Mettre à jour un trajet
    static async update(id, tripData) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            // Champs qui peuvent être mis à jour
            const updatableFields = [
                'id_lieu_depart', 'id_lieu_arrivee', 'date_depart', 'heure_depart',
                'places_disponibles', 'prix_par_place', 'statut', 'distance_estimee', 'duree_estimee'
            ];

            for (const key of updatableFields) {
                if (tripData.hasOwnProperty(key)) {
                    fields.push(`"${key}" = $${paramIndex}`);
                    values.push(tripData[key]);
                    paramIndex++;
                }
            }

            if (fields.length === 0) {
                return null;
            }

            values.push(id); 
            const result = await pool.query(
                `UPDATE "trajet" SET ${fields.join(', ')} WHERE id_trajet = $${paramIndex} RETURNING *`,
                values
            );
            if (result.rows.length > 0) {
                return new Trip(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la mise à jour du trajet :", error);
            throw error;
        }
    }

    // Supprimer un trajet (aucune modification nécessaire ici)
    static async delete(id) {
        try {
            const result = await pool.query(`DELETE FROM "trajet" WHERE id_trajet = $1 RETURNING *`, [id]);
            if (result.rows.length > 0) {
                return new Trip(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la suppression du trajet :", error);
            throw error;
        }
    }
}

module.exports = Trip;