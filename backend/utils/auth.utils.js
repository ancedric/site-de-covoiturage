const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Tenter de récupérer le token de l'en-tête Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Accès non autorisé : Aucun token fourni ou format incorrect.' });
    }

    const token = authHeader.split(' ')[1]; // Extraire le token après 'Bearer '

    if (!token) {
        return res.status(401).json({ message: 'Accès non autorisé : Token manquant.' });
    }

    try {
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attacher les informations de l'utilisateur décodées à l'objet de requête
        req.user = decoded;
        next(); // Passer au middleware ou au contrôleur suivant
    } catch (error) {
        console.error('Erreur de vérification du token :', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expiré. Veuillez vous reconnecter.' });
        }
        return res.status(401).json({ message: 'Token invalide ou falsifié.' });
    }
};

// Middleware d'autorisation pour l'administrateur
const isAdmin = (req, res, next) => {
    // Vérifier si req.user est défini
    if (!req.user) {
        return res.status(401).json({ message: 'Non authentifié. Le token est manquant ou invalide.' });
    }

    // Vérifier le rôle de l'utilisateur. Le rôle "admin" est supposé être le rôle d'administrateur.
    if (req.user.role === 'admin') {
        next(); // L'utilisateur est admin, passer au gestionnaire de route
    } else {
        res.status(403).json({ message: 'Accès refusé. Nécessite des privilèges administrateur.' });
    }
};

// On exporte les deux middlewares
module.exports = {
    authMiddleware,
    isAdmin
};