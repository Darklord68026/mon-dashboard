const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    text: { type: String, required: true },
    isDone: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    category: { type: String, default: "Général" }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);