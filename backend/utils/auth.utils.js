const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Tenter de récupérer le token directement des cookies parsés par cookie-parser
    const token = req.cookies.token;

    if (!token) {
        console.log('Authentification échouée: Token manquant dans les cookies.');
        return res.status(401).json({ message: 'Accès non autorisé : Token manquant.' });
    }

    try {
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attacher les informations de l'utilisateur décodées à l'objet de requête
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Erreur de vérification du token (authMiddleware) :', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expiré. Veuillez vous reconnecter.' });
        }
        return res.status(401).json({ message: 'Token invalide ou falsifié.' });
    }
};

// Middleware d'autorisation pour l'administrateur
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') { 
        return res.status(403).json({ message: 'Accès refusé. Nécessite des privilèges administrateur.' });
    }
    next();
};

// On exporte les deux middlewares
module.exports = {
    authMiddleware,
    isAdmin
};