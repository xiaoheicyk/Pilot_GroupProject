const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
    address: String,
    landLord: {
        fullName: String,
        phone: String,
        email: String
    },
    employeeId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    bed: Number,
    mattress: Number,
    chair: Number,
    table: Number,
    report: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }]
});

module.exports = mongoose.model('House', houseSchema);
