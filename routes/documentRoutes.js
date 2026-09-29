const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const documentController = require("../controllers/documentController");

const router = express.Router();

// ---------- User routes (must be logged in) ----------

// Full URL: POST /api/documents/upload
// auth runs first → only logged-in users can upload
router.post("/upload", auth, documentController.uploadDocument);

// Full URL: GET /api/documents
// Optional query: ?search=...&category=...
router.get("/", auth, documentController.getMyDocuments);

// Full URL: DELETE /api/documents/:id   (e.g. /api/documents/6abbe249...)
router.delete("/:id", auth, documentController.deleteMyDocument);

// ---------- Admin routes (must be logged in AND be an Admin) ----------

// Full URL: GET /api/documents/all
router.get("/all", auth, isAdmin, documentController.getAllDocuments);

// Full URL: DELETE /api/documents/admin/:id
router.delete("/admin/:id", auth, isAdmin, documentController.adminDeleteDocument);

module.exports = router;
