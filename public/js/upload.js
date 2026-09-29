// Get the elements from upload.html using their ids
const uploadForm = document.getElementById("uploadForm");
const documentNameInput = document.getElementById("documentName");
const categorySelect = document.getElementById("category");
const fileInput = document.getElementById("file");
const uploadButton = document.getElementById("uploadButton");
const messageBox = document.getElementById("message");

// Show a Bootstrap alert inside the message box
function showMessage(text, type) {
    messageBox.innerHTML = "";

    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = text;

    messageBox.appendChild(alertBox);
}

// Runs when the user clicks "Upload"
async function handleUpload(event) {
    event.preventDefault();

    // fileInput.files is a list of the selected files. We allow only one, so we take [0]
    const selectedFile = fileInput.files[0];

    if (!selectedFile) {
        showMessage("Please select a file", "danger");
        return;
    }

    // Quick size check in the browser, so the user does not wait for a big file
    // to upload just to be rejected. (The backend checks again - that is the real check.)
    const maxFileSize = 5 * 1024 * 1024;

    if (selectedFile.size > maxFileSize) {
        showMessage("File size must be less than 5 MB", "danger");
        return;
    }

    // 1. Put the text fields and the file into a FormData object
    //    The first value in append() is the KEY the backend will read:
    //    "name"     → req.body.name
    //    "category" → req.body.category
    //    "file"     → req.files.file
    const formData = new FormData();
    formData.append("name", documentNameInput.value);
    formData.append("category", categorySelect.value);
    formData.append("file", selectedFile);

    uploadButton.disabled = true;
    uploadButton.textContent = "Uploading...";

    try {
        // 2. Send the FormData
        //    Do NOT set "Content-Type" here. The browser sets
        //    "multipart/form-data; boundary=..." for us automatically.
        const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        // Not logged in (or token expired) → go to the login page
        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (response.ok) {
            showMessage("Document uploaded! Going back to your dashboard...", "success");

            setTimeout(function () {
                window.location.href = "/dashboard.html";
            }, 1500);
        } else {
            // e.g. "Only pdf, jpg, jpeg, png, doc and docx files are allowed"
            showMessage(data.message, "danger");
            uploadButton.disabled = false;
            uploadButton.textContent = "Upload";
        }
    } catch (error) {
        console.log(error);
        showMessage("Could not connect to the server", "danger");
        uploadButton.disabled = false;
        uploadButton.textContent = "Upload";
    }
}

uploadForm.addEventListener("submit", handleUpload);
