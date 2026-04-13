const Doctor = require("../models/Doctor");

exports.addDoctor = async (req, res) => {
    try {
        const { 
            name, 
            specialization, 
            experience, 
            consultationFee, 
            slotDuration, 
            morningSlot, 
            eveningSlot 
        } = req.body;

        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;

        const newDoctor = new Doctor({
            hospital: hospitalId,
            name,
            specialization,
            experience,
            consultationFee,
            slotDuration: slotDuration || 10,
            morningSlot: morningSlot || { start: "10:00", end: "14:00" },
            eveningSlot: eveningSlot || { start: "16:00", end: "20:00" }
        });

        await newDoctor.save();
        
        res.status(201).json({ message: "Doctor added successfully", doctor: newDoctor });
    } catch (error) {
        res.status(500).json({ message: error.message, error: error.message });
    }
};

exports.getDoctors = async (req, res) => {
    try {
        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;

        const doctors = await Doctor.find({ hospital: hospitalId });
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