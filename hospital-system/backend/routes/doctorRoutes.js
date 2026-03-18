const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// 1. IMPORT MUST MATCH EXACTLY
const { 
    addDoctor, 
    getDoctors, 
    deleteDoctor  // <-- Match this to your controller!
} = require("../controllers/doctorController");

router.post("/add", auth, addDoctor);
router.get("/", auth, getDoctors);

// 2. ROUTE MUST MATCH EXACTLY
router.delete("/remove/:id", auth, deleteDoctor); // <-- Match this too!

module.exports = router;


// routes/doctorRoutes.js
router.get("/hospital-email/:email", async (req, res) => {
    try {
        const Hospital = require("../models/Hospital");
        const Doctor = require("../models/Doctor");

        // 1. Find the hospital by email
        const hospital = await Hospital.findOne({ email: req.params.email });
        
        if (!hospital) {
            console.log("No hospital found with email:", req.params.email);
            return res.status(404).json({ message: "Hospital not found" });
        }

        // 2. Find doctors using the found hospital's _id
        const doctors = await Doctor.find({ hospital: hospital._id });
        // console.log(`Found ${doctors.length} doctors for hospital: ${hospital.name}`);
        
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});