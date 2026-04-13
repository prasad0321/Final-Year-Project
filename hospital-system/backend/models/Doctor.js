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
    slotDuration: {
        type: Number,
        required: true,
        default: 10
    },
    morningSlot: {
        start: { type: String, default: "10:00" },
        end: { type: String, default: "14:00" }
    },
    eveningSlot: {
        start: { type: String, default: "16:00" },
        end: { type: String, default: "20:00" }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Doctor", doctorSchema);