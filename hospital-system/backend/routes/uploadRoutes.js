const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const Hospital = require("../models/Hospital");

// --- UPLOAD HOSPITAL PHOTO ---
router.post("/hospital-photo", auth, upload.single("image"), async (req, res) => {
    try {
        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;

        // If no file was sent, throw an error
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        // req.file.path is the magical URL that Cloudinary gives us back!
        const newPhotoUrl = req.file.path;

        // Add the URL to the hospital's photos array in MongoDB
        const hospital = await Hospital.findByIdAndUpdate(
            hospitalId,
            { $push: { photos: newPhotoUrl } },
            { new: true } // This tells Mongo to return the updated document
        );

        res.json({ message: "Photo uploaded successfully!", photos: hospital.photos });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- REMOVE HOSPITAL PHOTO ---
router.delete("/hospital-photo", auth, async (req, res) => {
    try {
        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;
        
        // We will send the specific photo URL from the React frontend
        const { photoUrl } = req.body; 

        if (!photoUrl) {
            return res.status(400).json({ message: "Photo URL is required to delete." });
        }

        // $pull magically finds the exact URL in the photos array and removes it!
        const hospital = await Hospital.findByIdAndUpdate(
            hospitalId,
            { $pull: { photos: photoUrl } },
            { new: true }
        );

        res.json({ message: "Photo removed successfully!", photos: hospital.photos });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- GET ALL HOSPITAL PHOTOS ---
router.get("/hospital-photo", auth, async (req, res) => {
    try {
        // Find out which hospital is asking for their photos
        const userObj = req.user || req.hospital;
        const hospitalId = userObj.id || userObj._id;

        // Look up the hospital in the database
        const hospital = await Hospital.findById(hospitalId);
        
        // Send back their photos array (or an empty array if they don't have any yet)
        res.json({ photos: hospital.photos || [] });
    } catch (error) {
        console.error("Fetch Photos Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;