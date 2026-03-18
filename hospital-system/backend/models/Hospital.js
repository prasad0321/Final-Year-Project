const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
    name: {
    type: String,
    required: true
    },
    email: {
    type: String,
    required: true,
    unique: true
    },
    password: {
    type: String,
    required: true
    },
    location: {
    type: String
    },
    createdAt: {
    type: Date,
    default: Date.now
    },
    resources: {
        AvailableBeds: { type: Number, default: 0 },
        AvailableEmergencyBeds: { type: Number, default: 0 },
        AvailableVentilators: { type: Number, default: 0 },
        AvailableICUBeds: { type: Number, default: 0 }
    },
    photos: [{ type: String }],
});

module.exports = mongoose.model("Hospital", hospitalSchema);