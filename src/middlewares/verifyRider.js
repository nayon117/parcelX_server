import User from "../models/User.js";

export const verifyRider = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user || user.role !== "rider") {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    } catch (error) {
        console.error("Error in verifyRider middleware:", error);
        res.status(500).json({ message: "Server error" });
    }
};
