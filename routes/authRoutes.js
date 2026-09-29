const express = require("express");
const authController = require("../controllers/authController");

// A router is a small group of routes that we can plug into the app
const router = express.Router();

// Full URL: POST /api/auth/signup
router.post("/signup", authController.signup);

// Full URL: POST /api/auth/login
router.post("/login", authController.login);

// Full URL: POST /api/auth/logout
router.post("/logout", authController.logout);

module.exports = router;
