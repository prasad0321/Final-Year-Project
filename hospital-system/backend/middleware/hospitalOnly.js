module.exports = (req, res, next) => {
    if (req.user.role !== "hospital") {
    return res.status(403).json({ message: "Access Denied. Hospital Only." });
    }
    next();
};