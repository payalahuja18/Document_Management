// Get the elements from dashboard.html using their ids
const welcomeMessage = document.getElementById("welcomeMessage");
const documentCount = document.getElementById("documentCount");
const adminLink = document.getElementById("adminLink");
const logoutButton = document.getElementById("logoutButton");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const documentTableBody = document.getElementById("documentTableBody");
const messageBox = document.getElementById("message");

// Show a Bootstrap alert inside the message box
function showMessage(text, type) {
    messageBox.innerHTML = "";

    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = text;

    messageBox.appendChild(alertBox);
}

// Show one message row inside the table (e.g. "No documents found")
function showTableMessage(text) {
    documentTableBody.innerHTML = "";

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.className = "text-center text-muted py-4";
    cell.textContent = text;

    row.appendChild(cell);
    documentTableBody.appendChild(row);
}

// Create one table row for one document
// NOTE: we call it "userDocument" and not "document", because
// "document" is already the browser's object for the whole web page
function createDocumentRow(userDocument) {
    const row = document.createElement("tr");

    // Column 1: document name + file type underneath (e.g. "PDF")
    const nameCell = document.createElement("td");

    const nameText = document.createElement("div");
    nameText.className = "fw-semibold";
    nameText.textContent = userDocument.name;

    // "1759145123456-482913.pdf" → split at "." → take the last part → "pdf" → "PDF"
    const fileNameParts = userDocument.fileName.split(".");
    const fileType = fileNameParts[fileNameParts.length - 1].toUpperCase();

    const fileTypeText = document.createElement("small");
    fileTypeText.className = "text-muted";
    fileTypeText.textContent = fileType + " file";

    nameCell.appendChild(nameText);
    nameCell.appendChild(fileTypeText);

    // Column 2: category (as a Bootstrap badge)
    const categoryCell = document.createElement("td");
    const categoryBadge = document.createElement("span");
    categoryBadge.className = "badge bg-secondary";
    categoryBadge.textContent = userDocument.category;
    categoryCell.appendChild(categoryBadge);

    // Column 3: Open + Delete buttons
    const actionsCell = document.createElement("td");
    actionsCell.className = "text-end";

    // "Open" is a link to the file, e.g. /uploads/1759145123456.pdf
    // target="_blank" opens it in a new tab
    const openLink = document.createElement("a");
    openLink.href = userDocument.filePath;
    openLink.target = "_blank";
    openLink.className = "btn btn-sm btn-outline-primary me-2";
    openLink.textContent = "Open";

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-sm btn-outline-danger";
    deleteButton.textContent = "Delete";

    // When this button is clicked, delete THIS document (using its _id)
    deleteButton.addEventListener("click", function () {
        deleteDocument(userDocument._id);
    });

    actionsCell.appendChild(openLink);
    actionsCell.appendChild(deleteButton);

    row.appendChild(nameCell);
    row.appendChild(categoryCell);
    row.appendChild(actionsCell);

    return row;
}

// Fill the table with the documents we got from the backend
function showDocuments(documents) {
    // Is the user searching or filtering right now?
    const isFiltering = searchInput.value !== "" || categoryFilter.value !== "";

    // Update the small text under the welcome message
    if (isFiltering) {
        documentCount.textContent = documents.length + " document(s) found";
    } else {
        documentCount.textContent = "You have " + documents.length + " document(s)";
    }

    if (documents.length === 0) {
        if (isFiltering) {
            showTableMessage("No documents found. Try a different search or category.");
        } else {
            showTableMessage("You have not uploaded any documents yet. Click \"+ Upload document\" to add your first one.");
        }
        return;
    }

    // Remove the old rows
    documentTableBody.innerHTML = "";

    // Add one row per document
    for (const userDocument of documents) {
        const row = createDocumentRow(userDocument);
        documentTableBody.appendChild(row);
    }
}

// Get the logged-in user's documents from the backend
async function loadDocuments() {
    // Read the current search text and category
    const search = searchInput.value;
    const category = categoryFilter.value;

    // e.g. /api/documents?search=resume&category=Resume
    // encodeURIComponent makes spaces and special characters safe inside a URL
    const url = "/api/documents?search=" + encodeURIComponent(search) +
        "&category=" + encodeURIComponent(category);

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Not logged in → go to the login page
        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (!response.ok) {
            showMessage(data.message, "danger");
            return;
        }

        showDocuments(data.documents);
    } catch (error) {
        console.log(error);
        showMessage("Could not connect to the server", "danger");
    }
}

// Delete one document
async function deleteDocument(documentId) {
    // Ask the user first. confirm() returns true (OK) or false (Cancel)
    const userConfirmed = confirm("Are you sure you want to delete this document?");

    if (!userConfirmed) {
        return;
    }

    try {
        const response = await fetch("/api/documents/" + documentId, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (response.ok) {
            showMessage("Document deleted", "success");
            // Reload the list so the deleted document disappears
            loadDocuments();
        } else {
            showMessage(data.message, "danger");
        }
    } catch (error) {
        console.log(error);
        showMessage("Could not connect to the server", "danger");
    }
}

// Log out: ask the backend to clear the cookie, then go to the login page
async function logout() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST"
        });
    } catch (error) {
        console.log(error);
    }

    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");

    window.location.href = "/login.html";
}

// ---------- Code that runs when the page opens ----------

// Show the user's name (saved in localStorage at login)
const userName = localStorage.getItem("userName");

if (userName) {
    welcomeMessage.textContent = "Welcome, " + userName;
}

// Show the "Admin panel" button only for Admins (only for looks, the backend still checks)
const userRole = localStorage.getItem("userRole");

if (userRole === "Admin") {
    adminLink.classList.remove("d-none");
}

// Search while typing, and filter when the category changes
searchInput.addEventListener("input", loadDocuments);
categoryFilter.addEventListener("change", loadDocuments);
logoutButton.addEventListener("click", logout);

// Load the documents for the first time
loadDocuments();
