const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// POST /api/auth/signup
async function signup(req, res) {
    try {
        // 1. Get the data sent by the browser/Postman
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;

        // 2. Check that all fields are filled
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields"
            });
        }

        // 3. Check if a user with this email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
        }

        // 4. Hash the password (10 = salt rounds)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Save the new user in MongoDB
        const user = await User.create({
            name: name,
            email: email,
            password: hashedPassword
        });

        // 6. Send a response (never send the password back)
        return res.status(201).json({
            success: true,
            message: "Signup successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// POST /api/auth/login
async function login(req, res) {
    try {
        // 1. Get email and password from the request body
        const email = req.body.email;
        const password = req.body.password;

        // 2. Check that both fields are filled
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password"
            });
        }

        // 3. Find the user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 4. Compare the typed password with the hashed password in MongoDB
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 5. Create the JWT payload (the information stored inside the token)
        const payload = {
            id: user._id,
            role: user.role
        };

        // 6. Create (sign) the token using our secret key from .env
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1d"
        });

        // 7. Store the token in an HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
        });

        // 8. Send the response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// POST /api/auth/logout
function logout(req, res) {
    // Remove the token cookie from the browser
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict"
    });

    return res.status(200).json({
        success: true,
        message: "Logout successful"
    });
}

module.exports = {
    signup,
    login,
    logout
};
