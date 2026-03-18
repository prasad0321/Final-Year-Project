const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// Notice how impersonateHospital is included in this list now!
const {
    loginAdmin,
    getAllHospitals,
    deleteHospital,
    registerAdmin,
    impersonateHospital 
} = require("../controllers/adminController");

// Public Routes
router.post("/login", loginAdmin);
router.post("/register-secret", registerAdmin); 

// Protected Admin Routes
router.get("/hospitals", auth, getAllHospitals);
router.delete("/hospital/:id", auth, deleteHospital);
router.get("/impersonate/:id", auth, impersonateHospital); // <-- Now it knows what this is!

module.exports = router;