const mongoose = require('mongoose');

const registrationTokenSchema = new mongoose.Schema({
    email: { type: String, required: true },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('RegistrationToken', registrationTokenSchema);
