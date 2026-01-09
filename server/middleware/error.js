// middleware/error.js
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log l'erreur pour le développeur
    console.error("💥 ERREUR :", err);

    // 1. Mauvais ID Mongoose (CastError)
    if (err.name === 'CastError') {
        const message = `Ressource introuvable. ID invalide : ${err.value}`;
        error = { message, statusCode: 404 };
    }

    // 2. Doublon de champ unique (Code 11000)
    if (err.code === 11000) {
        const message = `Valeur en doublon entrée. Ce champ doit être unique.`;
        error = { message, statusCode: 400 };
    }

    // 3. Erreur de Validation Mongoose
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // 4. Erreur JWT (Token invalide)
    if (err.name === 'JsonWebTokenError') {
        error = { message: "Token invalide. Veuillez vous reconnecter.", statusCode: 401 };
    }

    // 5. Erreur JWT (Token expiré)
    if (err.name === 'TokenExpiredError') {
        error = { message: "Votre session a expiré.", statusCode: 401 };
    }

    // ENVOI DE LA RÉPONSE
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Erreur Serveur Interne"
    });
};

module.exports = errorHandler;