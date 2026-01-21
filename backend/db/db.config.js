const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Erreur: La variable d\'environnement DATABASE_URL n\'est pas définie.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
});

// Test de connexion
pool.connect()
    .then(client => {
        console.log('Connecté à PostgreSQL avec succès !');
        client.release();
    })
    .catch(err => {
        console.error('Erreur de connexion à PostgreSQL :', err.message);
        process.exit(1);
    });

module.exports = pool; 