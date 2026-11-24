
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login first."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Support common JWT payload field names
        const userId =
            decoded.id ||
            decoded.userId ||
            decoded._id ||
            decoded.sub;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token: user ID missing"
            });
        }

        const user = await User.findById(userId).select("-password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "User not found or account is inactive"
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action"
            });
        }

        next();
    };
};

module.exports = { protect, authorize };
