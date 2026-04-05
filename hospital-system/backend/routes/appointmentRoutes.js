const express = require("express");
const router = express.Router();

// Middleware Imports
const hospitalOnly = require("../middleware/hospitalOnly");
const auth = require("../middleware/authMiddleware");

// Controller Imports
const {
    bookAppointment,
    getHospitalQueue,
    completeAppointment,
    cancelAppointment,
    getCompletedAppointments,
    hospitalBookAppointment,
    getMyAppointments,
    getAvailableSlots // <-- Added the new function here!
} = require("../controllers/appointmentController");

// --- ROUTES ---

// Fixed: Changed 'verifyToken' to 'auth', and just used 'getAvailableSlots'
router.get("/available-slots", auth, getAvailableSlots); 

router.post("/book", auth, bookAppointment);
router.get("/my-appointments", auth, getMyAppointments);
router.get("/queue", auth, hospitalOnly, getHospitalQueue);
router.put("/complete/:id", auth, hospitalOnly, completeAppointment);
router.get("/completed", auth, hospitalOnly, getCompletedAppointments);
router.put("/cancel/:id", auth, hospitalOnly, cancelAppointment);
router.post("/hospital-book", auth, hospitalOnly, hospitalBookAppointment);

module.exports = router;