const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    house: { type: mongoose.Schema.Types.ObjectId, ref: 'House' },
    title: String,
    description: String,
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['open', 'in progress', 'close'], default: 'open' },
    comments: [
        {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        timestamp: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('Report', reportSchema);
