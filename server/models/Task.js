const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    text: String,
    isDone: Boolean,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);