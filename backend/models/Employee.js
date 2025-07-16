const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    firstName: String,
    lastName: String,
    middleName: String,
    picture: String,
    address: {
        street1: String,
        street2: String,
        city: String,
        state: String,
        zip: String,
    },
    cellPhone: String,
    workPhone: String,
    car: {
        make: String,
        model: String,
        color: String,
    },
    email: String,
    ssn: String,
    dob: Date,
    gender: { type: String, enum: ['male', 'female', null] },
    citizen: Boolean,
    workAuth: {
        visa: String,
        proof: String,
        startDate: Date,
        endDate: Date,
    },
    dl: {
        number: String,
        exp: Date,
        copy: String,
    },
    reference: {
        firstName: String,
        lastName: String,
        middleName: String,
        phone: String,
        email: String,
        relation: String,
    },
    emergencyContacts: [
        {
        firstName: String,
        lastName: String,
        middleName: String,
        phone: String,
        email: String,
        relation: String,
        },
    ],
    house: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'House',
    },
    onBoardingStatus: {
        type: String,
        enum: ['pending', 'rejected', 'approved'],
        default: 'pending',
    },
    }, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
