const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
    loginAdmin,
    getAllHospitals,
    deleteHospital,
    registerAdmin,
    impersonateHospital 
} = require("../controllers/adminController");

router.post("/login", loginAdmin);
router.post("/register-secret", registerAdmin); 

router.get("/hospitals", auth, getAllHospitals);
router.delete("/hospital/:id", auth, deleteHospital);
router.get("/impersonate/:id", auth, impersonateHospital);

module.exports = router;