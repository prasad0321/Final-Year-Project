const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");


exports.bookAppointment = async (req, res) => {
    try {
    const { hospitalId, doctorId, appointmentDate, emergency } = req.body;

    let queueNumber;

    if (emergency) {
        await Appointment.updateMany(
        { doctor: doctorId, appointmentDate },
        { $inc: { queueNumber: 1 } }
        );

        queueNumber = 1;

    } else {
        const count = await Appointment.countDocuments({
        doctor: doctorId,
        appointmentDate
        });

        queueNumber = count + 1;
    }

    const appointment = await Appointment.create({
        patient: req.user.id,
        hospital: hospitalId,
        doctor: doctorId,
        appointmentDate,
        queueNumber,
        status: "Pending",
        emergency: emergency || false
    });

    const io = req.app.get("io");
    io.emit("queueUpdated");

    res.status(201).json({
        message: "Appointment Booked",
        queueNumber,
        appointment
    });

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
        hospital: req.user.id,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: "Pending"
    })
        .populate("patient", "name")
        .populate("doctor", "name")
        .sort({ queueNumber: 1 });

    res.json(appointments);

    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

exports.completeAppointment = async (req, res) => {
    try {
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = "Completed";
    await appointment.save();

    await Appointment.updateMany(
        {
        doctor: appointment.doctor,
        appointmentDate: appointment.appointmentDate,
        queueNumber: { $gt: appointment.queueNumber }
        },
        { $inc: { queueNumber: -1 } }
    );
    const io = req.app.get("io");
    io.emit("queueUpdated");

    res.json({ message: "Appointment Completed & Queue Updated" });

    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

exports.getCompletedAppointments = async (req, res) => {
    try {
    const completed = await Appointment.find({
        hospital: req.user.id,
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

    if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "Completed") {
        return res.status(400).json({ message: "Cannot cancel completed appointment" });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    await Appointment.updateMany(
        {
        doctor: appointment.doctor,
        appointmentDate: appointment.appointmentDate,
        queueNumber: { $gt: appointment.queueNumber },
        status: { $ne: "Completed" }
        },
        { $inc: { queueNumber: -1 } }
    );

    const io = req.app.get("io");
    io.emit("queueUpdated");

    res.json({ message: "Appointment Cancelled & Queue Updated" });

    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};


exports.hospitalBookAppointment = async (req, res) => {
    try {
        const { patientName, doctorId, emergency, mobile } = req.body;
        
        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;

        const walkInPatient = new Patient({
            name: patientName,
            email: `walkin_${Date.now()}@hospital.com`,
            password: "walkin_password",
            mobile: mobile
        });
        await walkInPatient.save();

        const lastAppt = await Appointment.findOne({ hospital: hospitalId, status: "Pending" }).sort({ queueNumber: -1 });
        const queueNumber = lastAppt ? lastAppt.queueNumber + 1 : 1;

        const newAppointment = new Appointment({
            patient: walkInPatient._id,
            hospital: hospitalId,
            doctor: doctorId,
            queueNumber: queueNumber,
            emergency: emergency || false,
            status: "Pending",
            appointmentDate: new Date()
        });

        await newAppointment.save();

        const io = req.app.get("io");
        if (io) {
            io.emit("queueUpdated");
        }

        res.status(201).json({ message: "Walk-in Appointment Booked!", appointment: newAppointment });
    } catch (error) {
        console.log("Backend Error Booking Walk-in:", error);
        res.status(500).json({ error: error.message });
    }
};