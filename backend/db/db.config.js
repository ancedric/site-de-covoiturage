const { Pool } = require('pg');

// Récupérer l'URL de la base de données depuis les variables d'environnement
// Assurez-vous que DATABASE_URL est défini dans votre fichier .env
const connectionString = process.env.DATABASE_URL;

// Vérifier si la variable d'environnement est définie
if (!connectionString) {
    console.error('Erreur: La variable d\'environnement DATABASE_URL n\'est pas définie.');
    process.exit(1);//  Quitter l'application
}

// Créer une nouvelle instance de Pool
const pool = new Pool({
    connectionString: connectionString,
    // Vous pouvez ajouter d'autres options ici, par exemple :
    // ssl: {
    //     rejectUnauthorized: false // Utile si vous utilisez une DB hébergée avec un certificat auto-signé
    // }
});

// Tester la connexion (optionnel mais recommandé)
pool.connect()
    .then(client => {
        console.log('Connecté à PostgreSQL avec succès !');
        client.release(); // Relâche le client pour qu'il retourne au pool
    })
    .catch(err => {
        console.error('Erreur de connexion à PostgreSQL :', err.message);
        // Il est souvent judicieux de quitter l'application si la connexion DB échoue au démarrage
        process.exit(1);
    });

module.exports = pool; // Exporte le pool de connexions pour qu'il puisse être utilisé ailleurs