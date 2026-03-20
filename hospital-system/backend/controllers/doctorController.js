const Doctor = require("../models/Doctor");

exports.addDoctor = async (req, res) => {
    try {
        const { name, specialization, experience, consultationFee } = req.body;

        const doctor = await Doctor.create({
            hospital: req.user.id,
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

exports.getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ hospital: req.user.id });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDoctor = async (req, res) => {
    try {
        const doctorId = req.params.id;
        await Doctor.findByIdAndDelete(doctorId);
        res.json({ message: "Doctor removed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDoctorsByHospitalId = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const doctors = await Doctor.find({ hospital: hospitalId });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};