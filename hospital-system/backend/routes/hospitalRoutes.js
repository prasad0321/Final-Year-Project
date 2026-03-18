const express = require("express");
const router = express.Router();

// 1. Import the middleware we just updated
const auth = require("../middleware/authMiddleware");

// 2. Import the controller functions
const {
    registerHospital,
    loginHospital,
    getResources,
    updateResources,
    getAllHospitals
} = require("../controllers/hospitalController");

// const auth = require("../middleware/authMiddleware");//new line idk what this do

router.get("/", getAllHospitals); 
// Public Routes (No token needed)
router.post("/register", registerHospital);
router.post("/login", loginHospital);

// Protected Routes (Token REQUIRED - Notice the 'auth' in the middle!)
router.get("/resources", auth, getResources);
router.put("/resources", auth, updateResources);

module.exports = router;