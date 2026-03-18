const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true
    },
    name: {
    type: String,
    required: true
    },
    specialization: {
    type: String,
    required: true
    },
    experience: {
    type: Number,
    required: true
    },
    consultationFee: {
    type: Number,
    required: true
    },
    createdAt: {
    type: Date,
    default: Date.now
    }
});

module.exports = mongoose.model("Doctor", doctorSchema);