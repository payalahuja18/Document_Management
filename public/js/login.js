// Get the elements from login.html using their ids
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const messageBox = document.getElementById("message");

// Show a Bootstrap alert inside the message box
function showMessage(text, type) {
    messageBox.innerHTML = "";

    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = text;

    messageBox.appendChild(alertBox);
}

// Runs when the user clicks "Login"
async function handleLogin(event) {
    event.preventDefault();

    const loginData = {
        email: emailInput.value,
        password: passwordInput.value
    };

    loginButton.disabled = true;

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            // The JWT cookie is saved by the browser automatically (we cannot see it, it is httpOnly).
            // We save the name and role only to SHOW them on the page (not for security).
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userRole", data.user.role);

            // Admins go to the admin page, normal users go to the dashboard
            if (data.user.role === "Admin") {
                window.location.href = "/admin.html";
            } else {
                window.location.href = "/dashboard.html";
            }
        } else {
            // e.g. "Invalid email or password"
            showMessage(data.message, "danger");
            loginButton.disabled = false;
        }
    } catch (error) {
        console.log(error);
        showMessage("Could not connect to the server", "danger");
        loginButton.disabled = false;
    }
}

loginForm.addEventListener("submit", handleLogin);
