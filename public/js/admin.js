// Get the elements from admin.html using their ids
const logoutButton = document.getElementById("logoutButton");
const documentCount = document.getElementById("documentCount");
const adminTableBody = document.getElementById("adminTableBody");
const messageBox = document.getElementById("message");

// Show a Bootstrap alert inside the message box
function showMessage(text, type) {
    messageBox.innerHTML = "";

    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = text;

    messageBox.appendChild(alertBox);
}

// Show one message row inside the table
function showTableMessage(text) {
    adminTableBody.innerHTML = "";

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "text-center text-muted py-4";
    cell.textContent = text;

    row.appendChild(cell);
    adminTableBody.appendChild(row);
}

// Create one table row for one document (with owner details)
function createDocumentRow(userDocument) {
    const row = document.createElement("tr");

    // Column 1: document name
    const nameCell = document.createElement("td");
    nameCell.textContent = userDocument.name;

    // Column 2: category
    const categoryCell = document.createElement("td");
    const categoryBadge = document.createElement("span");
    categoryBadge.className = "badge bg-secondary";
    categoryBadge.textContent = userDocument.category;
    categoryCell.appendChild(categoryBadge);

    // Column 3: owner
    // uploadedBy is an object { _id, name, email } because the backend used populate()
    // It can be null if the user account was deleted from the database
    const ownerCell = document.createElement("td");

    if (userDocument.uploadedBy) {
        const ownerName = document.createElement("div");
        ownerName.textContent = userDocument.uploadedBy.name;

        const ownerEmail = document.createElement("small");
        ownerEmail.className = "text-muted";
        ownerEmail.textContent = userDocument.uploadedBy.email;

        ownerCell.appendChild(ownerName);
        ownerCell.appendChild(ownerEmail);
    } else {
        ownerCell.textContent = "Deleted user";
    }

    // Column 4: Open + Delete buttons
    const actionsCell = document.createElement("td");
    actionsCell.className = "text-end";

    const openLink = document.createElement("a");
    openLink.href = userDocument.filePath;
    openLink.target = "_blank";
    openLink.className = "btn btn-sm btn-outline-primary me-2";
    openLink.textContent = "Open";

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-sm btn-outline-danger";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
        deleteDocument(userDocument._id);
    });

    actionsCell.appendChild(openLink);
    actionsCell.appendChild(deleteButton);

    row.appendChild(nameCell);
    row.appendChild(categoryCell);
    row.appendChild(ownerCell);
    row.appendChild(actionsCell);

    return row;
}

// Fill the table
function showDocuments(documents) {
    documentCount.textContent = documents.length + " document(s) uploaded by all users";

    if (documents.length === 0) {
        showTableMessage("No documents uploaded yet");
        return;
    }

    adminTableBody.innerHTML = "";

    for (const userDocument of documents) {
        const row = createDocumentRow(userDocument);
        adminTableBody.appendChild(row);
    }
}

// Get ALL documents (admin API)
async function loadAllDocuments() {
    try {
        const response = await fetch("/api/documents/all");
        const data = await response.json();

        // Not logged in → login page
        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        // Logged in but not an Admin → the backend (isAdmin) said 403
        if (response.status === 403) {
            showTableMessage("You do not have permission to view this page");
            showMessage(data.message, "danger");
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

// Delete any document (admin API)
async function deleteDocument(documentId) {
    const userConfirmed = confirm("Delete this document for its owner? This cannot be undone.");

    if (!userConfirmed) {
        return;
    }

    try {
        const response = await fetch("/api/documents/admin/" + documentId, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (response.ok) {
            showMessage("Document deleted", "success");
            loadAllDocuments();
        } else {
            showMessage(data.message, "danger");
        }
    } catch (error) {
        console.log(error);
        showMessage("Could not connect to the server", "danger");
    }
}

// Log out
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

logoutButton.addEventListener("click", logout);

loadAllDocuments();
