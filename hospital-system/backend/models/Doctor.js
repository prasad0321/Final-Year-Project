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
    // --- NEW: TIME SLOT CONFIGURATION ---
    slotDuration: { 
        type: Number, 
        required: true, 
        default: 10 // Interval in minutes
    },
    morningSlot: {
        start: { type: String, default: "10:00" }, // 24-hour format
        end: { type: String, default: "14:00" }
    },
    eveningSlot: {
        start: { type: String, default: "16:00" }, // 4:00 PM
        end: { type: String, default: "20:00" }    // 8:00 PM
    },
    // ------------------------------------
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Doctor", doctorSchema);