const Doctor = require("../models/Doctor");

// --- For Hospital Dashboard: Add a Doctor ---
exports.addDoctor = async (req, res) => {
    try {
        const { name, specialization, experience, consultationFee } = req.body;

        const doctor = await Doctor.create({
            hospital: req.user.id, // ID from Auth Token
            name,
            specialization,
            experience,
            consultationFee
        });

        res.status(201).json({ message: "Doctor Added", doctor });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- For Hospital Dashboard: Get own doctors ---
exports.getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ hospital: req.user.id });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- For Hospital Dashboard: Remove a Doctor ---
exports.deleteDoctor = async (req, res) => {
    try {
        const doctorId = req.params.id;
        await Doctor.findByIdAndDelete(doctorId);
        res.json({ message: "Doctor removed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- NEW: For Patients: Get Doctors of a specific hospital by ID ---
exports.getDoctorsByHospitalId = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const doctors = await Doctor.find({ hospital: hospitalId });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};