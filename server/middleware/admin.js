const User = require('../models/User');

module.exports = async function(req, res, next) {
    try {
        // 1. authMiddleware a déjà tourné, donc on a req.user._id
        // On va chercher les infos complètes de l'utilisateur dans la BDD
        const user = await User.findById(req.user._id);

        // 2. Vérification du grade
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: "Accès réservé à l'Admin ⛔" });
        }

        // 3. C'est l'admin, on laisse passer
        next();
    } catch (error) {
        res.status(500).json({ error: "Erreur vérification admin" });
    }
};