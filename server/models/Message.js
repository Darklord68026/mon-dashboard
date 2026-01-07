const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    text: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String }, // On garde le pseudo pour afficher vite
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } // null = Message Général
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Message', messageSchema);