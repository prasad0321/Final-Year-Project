const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },
    patientName: {
        type: String
    },
    mobile: {
        type: String
    },
    age: {
        type: Number
    },
    gender: {
        type: String
    },
    symptoms: {
        type: String
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital",
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    queueNumber: {
        type: Number
    },
    status: {
        type: String,
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    emergency: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Appointment", appointmentSchema);