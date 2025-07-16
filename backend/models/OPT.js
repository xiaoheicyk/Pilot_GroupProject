const mongoose = require('mongoose');

const optSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    receipt: {
        url: String,
        status: { type: String, enum: ['pending', 'rejected', 'approval'], default: 'pending' },
    },
    ead: {
        url: String,
        status: { type: String, enum: ['pending', 'rejected', 'approval'], default: 'pending' },
    },
    i983: {
        url: String,
        status: { type: String, enum: ['pending', 'rejected', 'approval'], default: 'pending' },
    },
    i20: {
        url: String,
        status: { type: String, enum: ['pending', 'rejected', 'approval'], default: 'pending' },
    }
}, { timestamps: true });

module.exports = mongoose.model('OPT', optSchema);
