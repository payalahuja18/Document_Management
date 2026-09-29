const mongoose = require("mongoose");

// Schema = the structure of the information we save about each uploaded file
// NOTE: the actual file is saved in the uploads/ folder, NOT in MongoDB
const documentSchema = new mongoose.Schema({
    // The name the user types, e.g. "My Resume"
    name: {
        type: String,
        required: true,
        trim: true
    },
    // The category chosen from the dropdown
    category: {
        type: String,
        required: true,
        enum: ["Resume", "Certificate", "College Document", "Assignment", "Notes", "Other"]
    },
    // The name of the file saved in the uploads folder, e.g. "1759145123456-482913.pdf"
    fileName: {
        type: String,
        required: true
    },
    // The path used to open the file, e.g. "/uploads/1759145123456-482913.pdf"
    filePath: {
        type: String,
        required: true
    },
    // The _id of the user who uploaded this document
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

// "Document" → MongoDB will create a collection called "documents"
const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
