const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
    registerHospital,
    loginHospital,
    getResources,
    updateResources,
    getAllHospitals
} = require("../controllers/hospitalController");


router.get("/", getAllHospitals);
router.post("/register", registerHospital);
router.post("/login", loginHospital);

router.get("/resources", auth, getResources);
router.put("/resources", auth, updateResources);

module.exports = router;