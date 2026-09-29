// Load the values from the .env file into process.env
// This must run first, before any code that uses process.env
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const connectDatabase = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const auth = require("./middleware/auth");

// Create the Express application
const app = express();

// Create the uploads folder if it does not exist
const uploadsFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder);
}

// Middleware: convert JSON in the request body into a JavaScript object (req.body)
app.use(express.json());

// Middleware: read cookies from the request and put them in req.cookies
app.use(cookieParser());

// Middleware: read uploaded files (multipart/form-data)
// Files go into req.files, text fields go into req.body
app.use(fileUpload());

// Serve the frontend (HTML, CSS, JS) from the public folder
// e.g. /login.html → public/login.html,  / → public/index.html
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files, e.g. /uploads/1759145123456-482913.pdf
// auth runs first → only logged-in users can open files
app.use("/uploads", auth, express.static(uploadsFolder));

// A simple test route to check that the server is working
app.get("/api/test", function (req, res) {
    res.status(200).json({
        success: true,
        message: "Server is working"
    });
});

// Routes: every URL starting with /api/auth goes to authRoutes
app.use("/api/auth", authRoutes);

// Routes: every URL starting with /api/documents goes to documentRoutes
app.use("/api/documents", documentRoutes);

// Read the port number from .env (use 5000 if it is missing)
const PORT = process.env.PORT || 5000;

// First connect to the database, then start the server
async function startServer() {
    await connectDatabase();

    app.listen(PORT, function () {
        console.log("Server is running on http://localhost:" + PORT);
    });
}

startServer();
