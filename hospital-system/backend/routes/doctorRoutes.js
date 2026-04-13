const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const { 
    addDoctor,
    getDoctors,
    deleteDoctor
} = require("../controllers/doctorController");

router.post("/add", auth, addDoctor);
router.get("/", auth, getDoctors);

router.delete("/remove/:id", auth, deleteDoctor);

module.exports = router;


router.get("/hospital-email/:email", async (req, res) => {
    try {
        const Hospital = require("../models/Hospital");
        const Doctor = require("../models/Doctor");

        const hospital = await Hospital.findOne({ email: req.params.email });
        
        if (!hospital) {
            console.log("No hospital found with email:", req.params.email);
            return res.status(404).json({ message: "Hospital not found" });
        }

        const doctors = await Doctor.find({ hospital: hospital._id });
        
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});