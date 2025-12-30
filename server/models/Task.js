const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    text: String,
    isDone: Boolean,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    dueDate: { type: Date },
    category: { type: String, default: "Général" }
});

module.exports = mongoose.model('Task', taskSchema);