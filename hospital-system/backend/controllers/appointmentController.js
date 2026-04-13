const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

// --- NEW FUNCTION: GENERATE 10-MIN INTERVALS ---
exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date, slotType } = req.query; // slotType = "Morning" or "Evening"

        if (!doctorId || !date || !slotType) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ error: "Doctor not found" });

        // Get shift times based on selection
        const shift = slotType === "Morning" ? doctor.morningSlot : doctor.eveningSlot;
        const duration = doctor.slotDuration; // e.g., 10 minutes

        // Helper to convert "HH:MM" to minutes for easy math
        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            return (hours * 60) + minutes;
        };

        // Helper to convert minutes back to "HH:MM"
        const minutesToTime = (totalMinutes) => {
            const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
            const mins = (totalMinutes % 60).toString().padStart(2, "0");
            return `${hours}:${mins}`;
        };

        const startMins = timeToMinutes(shift.start);
        const endMins = timeToMinutes(shift.end);
        let allPossibleSlots = [];

        // Generate every 10 min interval
        for (let time = startMins; time < endMins; time += duration) {
            allPossibleSlots.push(minutesToTime(time));
        }

        // Check database for already booked times on this specific day
        const today = new Date(date);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const bookedAppointments = await Appointment.find({
            doctor: doctorId,
            appointmentDate: { $gte: today, $lt: tomorrow },
            slot: slotType,
            status: { $ne: "Cancelled" }
        }).select("appointmentTime");

        // Extract just the time strings (e.g., ["10:10", "10:30"])
        const bookedTimes = bookedAppointments.map(app => app.appointmentTime);

        // Filter out the booked ones
        const availableSlots = allPossibleSlots.filter(time => !bookedTimes.includes(time));

        res.json({ availableSlots });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.bookAppointment = async (req, res) => {
    try {
        const { hospitalId, doctorId, appointmentDate, emergency, patientName, mobile, age, gender, symptoms, slot, appointmentTime, isFollowUp } = req.body;

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(mobile)) return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });

        let finalSlot = slot;
        let finalTime = appointmentTime;

        if (emergency) {
            finalSlot = "Emergency";
            finalTime = "Immediate";
        } else {
            if (!slot || !["Morning", "Evening"].includes(slot)) return res.status(400).json({ error: "Please select a valid slot (Morning/Evening)." });
            if (!appointmentTime) return res.status(400).json({ error: "Please select an exact appointment time." });
        }

        const today = new Date(appointmentDate);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (!emergency) {
            const existingAppt = await Appointment.findOne({
                doctor: doctorId,
                appointmentDate: { $gte: today, $lt: tomorrow },
                slot: finalSlot,
                appointmentTime: finalTime,
                status: { $ne: "Cancelled" },
            });

            if (existingAppt) {
                return res.status(400).json({ error: `The time ${finalTime} is already booked. Please choose another.` });
            }
        }

        let queueNumber;
        if (emergency) {
            await Appointment.updateMany(
                { doctor: doctorId, appointmentDate: { $gte: today, $lt: tomorrow }, slot: finalSlot },
                { $inc: { queueNumber: 1 } }
            );
            queueNumber = 1;
        } else {
            const currentSlotCount = await Appointment.countDocuments({
                doctor: doctorId,
                appointmentDate: { $gte: today, $lt: tomorrow },
                slot: finalSlot,
                status: { $ne: "Cancelled" } 
            });
            queueNumber = currentSlotCount + 1;
        }

        const appointment = await Appointment.create({
            patient: req.user.id, 
            hospital: hospitalId, 
            doctor: doctorId, 
            appointmentDate,
            queueNumber, 
            slot: finalSlot, 
            appointmentTime: finalTime, 
            status: "Pending", 
            emergency: emergency || false,
            isFollowUp: isFollowUp || false,
            patientName,
            mobile,
            age,
            gender,
            symptoms
        });

        const io = req.app.get("io");
        if (io) io.emit("queueUpdated");

        res.status(201).json({ message: "Appointment Booked", queueNumber, appointmentTime: finalTime, appointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getHospitalQueue = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await Appointment.find({
            hospital: req.user.id || req.hospital.id,
            appointmentDate: { $gte: today, $lt: tomorrow },
            status: "Pending"
        })
        .populate("patient", "name email")
        .populate("doctor", "name")
        .sort({ appointmentTime: 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.completeAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) return res.status(404).json({ message: "Appointment not found" });

        appointment.status = "Completed";
        await appointment.save();

        const today = new Date(appointment.appointmentDate);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        await Appointment.updateMany(
            {
                doctor: appointment.doctor,
                appointmentDate: { $gte: today, $lt: tomorrow },
                slot: appointment.slot,
                queueNumber: { $gt: appointment.queueNumber },
                status: "Pending"
            },
            { $inc: { queueNumber: -1 } }
        );

        const io = req.app.get("io");
        if (io) io.emit("queueUpdated");

        res.json({ message: "Appointment Completed & Queue Updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCompletedAppointments = async (req, res) => {
    try {
        const completed = await Appointment.find({
            hospital: req.user.id || req.hospital.id,
            status: "Completed"
        })
        .populate("patient", "name")
        .populate("doctor", "name")
        .sort({ appointmentDate: -1 });

        res.json(completed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) return res.status(404).json({ message: "Appointment not found" });
        if (appointment.status === "Completed") return res.status(400).json({ message: "Cannot cancel completed appointment" });

        appointment.status = "Cancelled";
        await appointment.save();

        const today = new Date(appointment.appointmentDate);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        await Appointment.updateMany(
            {
                doctor: appointment.doctor,
                appointmentDate: { $gte: today, $lt: tomorrow },
                slot: appointment.slot,
                queueNumber: { $gt: appointment.queueNumber },
                status: "Pending"
            },
            { $inc: { queueNumber: -1 } }
        );

        const io = req.app.get("io");
        if (io) io.emit("queueUpdated");

        res.json({ message: "Appointment Cancelled & Queue Updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.hospitalBookAppointment = async (req, res) => {
    try {
        // 1. ADDED: Extract the 'email' from the frontend
        const { patientName, email, doctorId, emergency, mobile, age, gender, symptoms, slot, appointmentTime, isFollowUp } = req.body;
        
        // 2. ADDED: Backend Strict @gmail.com Validation
        if (!email || !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.toLowerCase())) {
            return res.status(400).json({ error: "Only @gmail.com email addresses are allowed." });
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(mobile)) return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });

        let finalSlot = slot;
        let finalTime = appointmentTime;

        if (emergency) {
            finalSlot = "Emergency";
            finalTime = "Immediate";
        } else {
            if (!slot || !["Morning", "Evening"].includes(slot)) return res.status(400).json({ error: "Please select a valid slot (Morning/Evening)." });
            if (!appointmentTime) return res.status(400).json({ error: "Please select an exact appointment time." });
        }

        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (!emergency) {
            const existingAppt = await Appointment.findOne({
                doctor: doctorId,
                appointmentDate: { $gte: today, $lt: tomorrow },
                slot: finalSlot,
                appointmentTime: finalTime,
                status: { $ne: "Cancelled" }
            });

            if (existingAppt) {
                return res.status(400).json({ error: `The time ${finalTime} is already booked.` });
            }
        }
        
        // 3. SMART PATIENT CREATION (Prevents DB crash on Follow-ups!)
        let walkInPatient = await Patient.findOne({ email: email.toLowerCase() });
        
        if (!walkInPatient) {
            // Only create a new profile if the email doesn't exist yet
            walkInPatient = new Patient({
                name: patientName, 
                email: email.toLowerCase(), // Replaced the fake walk-in email
                password: "walkin_password", 
                mobile: mobile
            });
            await walkInPatient.save();
        }

        let queueNumber;
        
        if (emergency) {
            // Put emergency at the very front of the line
            await Appointment.updateMany(
                { doctor: doctorId, appointmentDate: { $gte: today, $lt: tomorrow }, slot: finalSlot },
                { $inc: { queueNumber: 1 } }
            );
            queueNumber = 1;
        } else {
            const currentSlotCount = await Appointment.countDocuments({
                doctor: doctorId,
                appointmentDate: { $gte: today, $lt: tomorrow },
                slot: finalSlot,
                status: { $ne: "Cancelled" }
            });
            queueNumber = currentSlotCount + 1;
        }

        const newAppointment = new Appointment({
            patient: walkInPatient._id, patientName, mobile, age, gender, symptoms,
            hospital: hospitalId, doctor: doctorId, queueNumber, 
            slot: finalSlot, 
            appointmentTime: finalTime, 
            emergency: emergency || false, 
            isFollowUp: isFollowUp || false, 
            status: "Pending", 
            appointmentDate: new Date()
        });

        await newAppointment.save();

        const io = req.app.get("io");
        if (io) io.emit("queueUpdated");

        res.status(201).json({ message: "Walk-in Appointment Booked!", appointment: newAppointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user.id })
            .populate("doctor", "name")
            .populate("hospital", "name")
            .sort({ appointmentDate: -1, appointmentTime: -1 }); // Sorted by date & time

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};