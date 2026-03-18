    const mongoose = require("mongoose");

    const appointmentSchema = new mongoose.Schema({
        patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
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
        default: "Waiting"
        },
        createdAt: {
        type: Date,
        default: Date.now
        },
        emergency: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: "Waiting"
    },
    });

    module.exports = mongoose.model("Appointment", appointmentSchema);