const Hospital = require("../models/Hospital");

exports.uploadHospitalPhoto = async (req, res) => {
    try {
        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;

        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const newPhotoUrl = req.file.path;

        const hospital = await Hospital.findByIdAndUpdate(
            hospitalId,
            { $push: { photos: newPhotoUrl } },
            { new: true }
        );

        res.json({ message: "Photo uploaded successfully!", photos: hospital.photos });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getHospitalPhotos = async (req, res) => {
    try {
        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;

        const hospital = await Hospital.findById(hospitalId);
        res.json({ photos: hospital.photos || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteHospitalPhoto = async (req, res) => {
    try {
        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;
        const { photoUrl } = req.body;

        if (!photoUrl) {
            return res.status(400).json({ message: "Photo URL is required" });
        }

        const hospital = await Hospital.findByIdAndUpdate(
            hospitalId,
            { $pull: { photos: photoUrl } },
            { new: true }
        );

        res.json({ message: "Photo removed successfully!", photos: hospital.photos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};