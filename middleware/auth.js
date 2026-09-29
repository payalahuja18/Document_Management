const jwt = require("jsonwebtoken");

// This middleware checks if the user is logged in.
// If yes → it adds req.user and calls next()
// If no  → it sends a 401 response and stops the request
function auth(req, res, next) {
    try {
        // 1. Read the token from the cookie (req.cookies comes from cookie-parser)
        const token = req.cookies.token;

        // 2. No token means the user is not logged in
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please login first"
            });
        }

        // 3. Verify the token using our secret key
        //    If the token is fake, changed or expired, jwt.verify() throws an error
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Save the payload ({ id, role, iat, exp }) in req.user
        //    so that the next functions (controllers) can use it
        req.user = decoded;

        // 5. Move on to the next function (the controller)
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token, please login again"
        });
    }
}

module.exports = auth;
