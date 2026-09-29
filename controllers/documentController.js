const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Document = require("../models/Document");

// The file types we accept
const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];

// The categories we accept (same list as in the Document model)
const allowedCategories = ["Resume", "Certificate", "College Document", "Assignment", "Notes", "Other"];

// Maximum file size: 5 MB (5 × 1024 × 1024 bytes)
const maxFileSize = 5 * 1024 * 1024;

// POST /api/documents/upload
async function uploadDocument(req, res) {
    try {
        // 1. Get the text fields (express-fileupload puts them in req.body)
        const name = req.body.name;
        const category = req.body.category;

        if (!name || !category) {
            return res.status(400).json({
                success: false,
                message: "Please enter document name and category"
            });
        }

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category"
            });
        }

        // 2. Check that a file was sent
        //    req.files comes from express-fileupload
        //    .file is the key name used in formData.append("file", ...)
        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a file"
            });
        }

        const uploadedFile = req.files.file;

        // 3. Check the file extension, e.g. "resume.PDF" → ".pdf"
        const extension = path.extname(uploadedFile.name).toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            return res.status(400).json({
                success: false,
                message: "Only pdf, jpg, jpeg, png, doc and docx files are allowed"
            });
        }

        // 4. Check the file size (uploadedFile.size is in bytes)
        if (uploadedFile.size > maxFileSize) {
            return res.status(400).json({
                success: false,
                message: "File size must be less than 5 MB"
            });
        }

        // 5. Create a unique file name, e.g. "1759145123456-482913.pdf"
        //    Date.now() = milliseconds since 1970
        //    + a random number, in case two files are uploaded in the same millisecond
        const randomNumber = Math.floor(Math.random() * 1000000);
        const fileName = Date.now() + "-" + randomNumber + extension;

        // 6. Full location on the computer where the file will be saved
        //    e.g. C:\...\document_management\uploads\1759145123456.pdf
        const savePath = path.join(__dirname, "..", "uploads", fileName);

        // 7. Move the file from memory into the uploads folder
        await uploadedFile.mv(savePath);

        // 8. The path the browser will use to open the file
        const filePath = "/uploads/" + fileName;

        // 9. Save the file information in MongoDB
        const document = await Document.create({
            name: name,
            category: category,
            fileName: fileName,
            filePath: filePath,
            uploadedBy: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Document uploaded successfully",
            document: document
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// GET /api/documents
// Optional: /api/documents?search=resume&category=Resume
async function getMyDocuments(req, res) {
    try {
        // 1. Read the optional search and category from the URL (query string)
        const search = req.query.search;
        const category = req.query.category;

        // 2. Always start with: only documents uploaded by the logged-in user
        const filter = {
            uploadedBy: req.user.id
        };

        // 3. If the user typed a search word, match names that contain it
        if (search) {
            // Put a "\" before special characters like ( ) . * so they are
            // treated as normal text and not as regex symbols
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.name = {
                $regex: safeSearch,
                $options: "i" // "i" = ignore uppercase/lowercase
            };
        }

        // 4. If the user selected a category, match it exactly
        if (category) {
            filter.category = category;
        }

        // 5. Find the documents, newest first
        const documents = await Document.find(filter).sort({ _id: -1 });

        return res.status(200).json({
            success: true,
            count: documents.length,
            documents: documents
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// Helper: delete a file from the uploads folder (used by user delete and admin delete)
function deleteFileFromUploads(fileName) {
    const fullPath = path.join(__dirname, "..", "uploads", fileName);

    // Only delete if the file is really there (it may have been removed by hand)
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
}

// DELETE /api/documents/:id
async function deleteMyDocument(req, res) {
    try {
        // 1. Get the document id from the URL, e.g. /api/documents/6abbe249...
        const documentId = req.params.id;

        // 2. Check that the id looks like a real MongoDB id
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document id"
            });
        }

        // 3. Find the document
        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        // 4. Check ownership: does this document belong to the logged-in user?
        //    document.uploadedBy is an ObjectId, req.user.id is a string,
        //    so we convert the ObjectId to a string before comparing
        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this document"
            });
        }

        // 5. Delete the record from MongoDB
        await Document.findByIdAndDelete(documentId);

        // 6. Delete the actual file from the uploads folder
        deleteFileFromUploads(document.fileName);

        return res.status(200).json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// GET /api/documents/all   (Admin only)
async function getAllDocuments(req, res) {
    try {
        // Find every document (no uploadedBy filter)
        // populate() replaces the uploadedBy id with the owner's name and email
        const documents = await Document.find()
            .populate("uploadedBy", "name email")
            .sort({ _id: -1 });

        return res.status(200).json({
            success: true,
            count: documents.length,
            documents: documents
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// DELETE /api/documents/admin/:id   (Admin only)
async function adminDeleteDocument(req, res) {
    try {
        const documentId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document id"
            });
        }

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        // No ownership check here: the isAdmin middleware already
        // made sure that only an Admin can reach this function

        await Document.findByIdAndDelete(documentId);

        deleteFileFromUploads(document.fileName);

        return res.status(200).json({
            success: true,
            message: "Document deleted by admin"
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

module.exports = {
    uploadDocument,
    getMyDocuments,
    deleteMyDocument,
    getAllDocuments,
    adminDeleteDocument
};
