const Admin = require("../models/Admin");
const Hospital = require("../models/Hospital");
const jwt = require("jsonwebtoken");

exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin || admin.password !== password) {
            return res.status(401).json({ message: "Invalid Admin Credentials" });
        }

        const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
        
        res.json({ message: "Admin Login Successful", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find().select("-password");
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteHospital = async (req, res) => {
    try {
        await Hospital.findByIdAndDelete(req.params.id);
        res.json({ message: "Hospital deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.registerAdmin = async (req, res) => {
    try {
        const newAdmin = new Admin(req.body);
        await newAdmin.save();
        res.status(201).json({ message: "Admin Created!", newAdmin });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.impersonateHospital = async (req, res) => {
    try {
        const hospitalId = req.params.id;
        const hospital = await Hospital.findById(hospitalId);
        
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

        const token = jwt.sign(
            { id: hospital._id, role: "hospital" }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
        );
        
        res.json({ message: "Impersonation successful", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};