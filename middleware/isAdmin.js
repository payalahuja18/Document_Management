// This middleware checks if the logged-in user is an Admin.
// It must run AFTER the auth middleware, because it needs req.user
function isAdmin(req, res, next) {
    // req.user was created by the auth middleware from the JWT payload
    if (req.user.role !== "Admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admins only"
        });
    }

    // The user is an Admin, so move on to the controller
    next();
}

module.exports = isAdmin;
