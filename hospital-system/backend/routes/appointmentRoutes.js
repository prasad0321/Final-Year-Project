const express = require("express");
const router = express.Router();
const hospitalOnly = require("../middleware/hospitalOnly");

const {
    bookAppointment,
    getHospitalQueue,
    completeAppointment,
    cancelAppointment,
    getCompletedAppointments,
    hospitalBookAppointment
} = require("../controllers/appointmentController");

const auth = require("../middleware/authMiddleware");

router.post("/book", auth, bookAppointment);

router.get("/queue", auth, hospitalOnly, getHospitalQueue);
router.put("/complete/:id", auth, hospitalOnly, completeAppointment);
router.get("/completed", auth, hospitalOnly, getCompletedAppointments);
router.put("/cancel/:id", auth, hospitalOnly, cancelAppointment);
router.post("/hospital-book", auth, hospitalOnly, hospitalBookAppointment);

module.exports = router;