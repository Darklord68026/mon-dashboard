const mongoose = require('mongoose');

const suggestionSchema = mongoose.Schema({
    text: { type: String, required: true },
    author: { type: String, required: true }, // Qui a eu l'idée (pseudo)
    createdAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false } // Pour savoir si tu l'as vue
});

module.exports = mongoose.model('Suggestion', suggestionSchema);