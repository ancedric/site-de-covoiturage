require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db/db.config');

const app = express();

// --- DÉBUT DES MIDDLEWARES GLOBALES ---
app.use(express.json());

const corsOptions = {
    origin: [process.env.FRONTEND_URL, 'http://localhost:5174' ] || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204 
};
app.use(cors(corsOptions));
app.use(cookieParser());

// 4. (Optionnel) Middleware de logging, utile pour débugger les requêtes entrantes
app.use((req, res, next) => {
    console.log(`Requête reçue: ${req.method} ${req.url}`);
    console.log('Corps de la requête (req.body):', req.body);
    next();
});

// --- FIN DES MIDDLEWARES GLOBALES ---


// Import des routeurs
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const tripRoutes = require('./routes/trip.routes');
const lieuRoutes = require('./routes/lieu.routes');
const reservationRoutes = require('./routes/reservation.routes');
const reviewRoutes = require('./routes/review.routes');
const voitureRoutes = require('./routes/voiture.routes');


// --- UTILISATION DES ROUTES ---
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/lieux', lieuRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/voitures', voitureRoutes);

// Route de test simple (accessible à la racine de l'API)
app.get('/', (req, res) => {
    res.send('API de Covoiturage en marche !');
});

// --- GESTIONNAIRES D'ERREURS ---
// Gestion des erreurs 404 (Route non trouvée)
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route non trouvée.' });
});

// Gestionnaire d'erreurs global (pour les erreurs non capturées par les routes)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Quelque chose a mal tourné !');
});


// DÉMARRAGE DU SERVEUR
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Accédez à : http://localhost:${PORT}`);
});
