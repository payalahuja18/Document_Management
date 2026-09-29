const mongoose = require("mongoose");

// Connect to MongoDB using the URL from the .env file
async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection failed");
        console.log(error);

        // Stop the app, because it cannot work without a database
        process.exit(1);
    }
}

module.exports = connectDatabase;
