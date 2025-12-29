const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Le token est envoyé dans le header : "Authorization: Bearer <TOKEN>"
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // On enlève le mot Bearer

    if (!token) return res.status(401).json({ error: "Accès refusé" });

    try {
        // On vérifie la signature du badge
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // on attache les infos du user à la requête
        next(); // On laisse passer
    } catch (error) {
        res.status(400).json({ error: "Token invalide" });
    }
};