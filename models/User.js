const mongoose = require("mongoose");

// Schema = the structure (shape) of every user saved in MongoDB
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["User", "Admin"],
        default: "User"
    }
});

// Model = the object we use to create, find and delete users
// "User" → MongoDB will create a collection called "users"
const User = mongoose.model("User", userSchema);

module.exports = User;
