const Hospital = require("../models/Hospital");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerHospital = async (req, res) => {
    try {
    const { name, email, password, location } = req.body;

    const existing = await Hospital.findOne({ email });
    if (existing) {
        return res.status(400).json({ message: "Hospital already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const hospital = await Hospital.create({
        name,
        email,
        password: hashedPassword,
        location
    });

    res.status(201).json({ message: "Hospital Registered Successfully" });

    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

exports.loginHospital = async (req, res) => {
    try {
    const { email, password } = req.body;

    const hospital = await Hospital.findOne({ email });
    if (!hospital) {
        return res.status(400).json({ message: "Hospital not found" });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
    { id: hospital._id, role: "hospital" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
    );

    res.json({ token, hospital });

    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

exports.getResources = async (req, res) => {
    try {
        const userObj = req.user || req.hospital;
        if (!userObj) return res.status(401).json({ error: "Unauthorized: No token data found" });

        const hospitalId = userObj.id || userObj._id;

        const hospital = await Hospital.findById(hospitalId).select("resources");
        if (!hospital) return res.status(404).json({ message: "Hospital not found" });
        
        res.json(hospital.resources);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateResources = async (req, res) => {
    try {
        const userObj = req.user || req.hospital;
        if (!userObj) return res.status(401).json({ error: "Unauthorized: No token data found" });

        const hospitalId = userObj.id || userObj._id;

        const updatedHospital = await Hospital.findByIdAndUpdate(
            hospitalId,
            { resources: req.body },
            { new: true }
        );

        if (!updatedHospital) return res.status(404).json({ error: "Hospital not found" });

        res.json(updatedHospital.resources);
    } catch (error) {
        console.log("Backend Error Updating Resources:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.getAllHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find({}, "-password"); 
        res.status(200).json(hospitals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
