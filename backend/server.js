require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// on importe la configuration de la base de données
const db = require('./db/db.config');

// Importe les routeurs
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route.js');
const tripRoutes = require('./routes/trip.routes');
const lieuRoutes = require('./routes/lieu.routes');
const reservationRoutes = require('./routes/reservation.routes');

// Middlewares essentiels
app.use(cors());
app.use(express.json());

// Route de test simple
app.get('/', (req, res) => {
    res.send('API de Covoiturage en marche !');
});

// Utilisation des routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/lieux', lieuRoutes);
app.use('/api/reservations', reservationRoutes);

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Accédez à : http://localhost:${PORT}`);
});