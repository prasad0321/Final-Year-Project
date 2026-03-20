const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerPatient = async (req, res) => {
    try {

    console.log("Register API called");
    console.log(req.body);

    const { name, email, password, mobile } = req.body;
    const existing = await Patient.findOne({ email });
    if (existing) {
        return res.status(400).json({ message: "Patient already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Patient.create({
        name,
        email,
        password: hashedPassword,
        mobile
    });

    res.status(201).json({ message: "Patient Registered Successfully" });

    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};


exports.loginPatient = async (req, res) => {
    try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({ email });
    if (!patient) {
        return res.status(400).json({ message: "Patient not found" });
    }

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
        { id: patient._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({ token, patient });

    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

