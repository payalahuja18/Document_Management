// Get the elements from signup.html using their ids
const signupForm = document.getElementById("signupForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupButton = document.getElementById("signupButton");
const messageBox = document.getElementById("message");

// Show a Bootstrap alert inside the message box
// type = "success" (green) or "danger" (red)
function showMessage(text, type) {
    messageBox.innerHTML = "";

    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = text;

    messageBox.appendChild(alertBox);
}

// Runs when the user clicks "Sign up"
async function handleSignup(event) {
    // Stop the browser from reloading the page (the default form behaviour)
    event.preventDefault();

    // 1. Read the values the user typed
    const userData = {
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value
    };

    signupButton.disabled = true;

    try {
        // 2. Send the data to the backend as JSON
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        // 3. Convert the JSON response into a JavaScript object
        const data = await response.json();

        // 4. response.ok is true for status 200-299
        if (response.ok) {
            showMessage("Account created! Taking you to the login page...", "success");

            // Wait 1.5 seconds so the user can read the message, then go to login
            setTimeout(function () {
                window.location.href = "/login.html";
            }, 1500);
        } else {
            // e.g. "User already exists with this email"
            showMessage(data.message, "danger");
            signupButton.disabled = false;
        }
    } catch (error) {
        console.log(error);
        showMessage("Could not connect to the server", "danger");
        signupButton.disabled = false;
    }
}

signupForm.addEventListener("submit", handleSignup);
