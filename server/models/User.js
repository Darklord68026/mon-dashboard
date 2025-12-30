const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    password: { type: String, required: true },
    tags: {
        type: [{ name: String, color: String }],
        default: [ // tags par défaut pour les nouveaux users
            { name: "Général", color: "#cccccc" },
            { name: "Urgent", color: "#ff6b6b" },
            { name: "Devoirs", color: "#4dabf7" }
        ]
    }
});

module.exports = mongoose.model('User', userSchema);