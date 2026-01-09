const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    text: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    // NOUVEAU CHAMP 👇
    isRead: { type: Boolean, default: false } 
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Message', messageSchema);