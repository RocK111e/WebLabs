// WebLabs/js/login_page.js
import {login} from './api_connector.js';

// const login_regex = /^[a-zA-Z]$/; // As discussed, this regex is likely too restrictive

document.addEventListener("DOMContentLoaded", async function() {
    const loginButton = document.getElementById("login-btn");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    // Optional: Add an error display element for better UX
    // const loginErrorElement = document.getElementById("login-error-message");

    if (!loginButton || !usernameInput || !passwordInput) {
        console.error("Login page elements (button or inputs) not found!");
        // if (loginErrorElement) loginErrorElement.textContent = "Login form error.";
        return;
    }

    loginButton.addEventListener("click", async function() {
        const username = usernameInput.value; // Consider .trim() for username
        const password = passwordInput.value;

        // if (loginErrorElement) loginErrorElement.textContent = "";

        if (username && password) {
            // Optional: Disable button during login
            // loginButton.disabled = true;
            // loginButton.textContent = "Logging in...";

            const result = await login(username, password); // login from api_connector now handles ID storage

            if (result === true) { // login() returns true on success
                window.location.href = "index.html"; // Redirect to the main page
            } else {
                // result will be an error message string if login failed
                const errorMessage = typeof result === 'string' ? result : "Invalid username or password";
                alert(errorMessage); // Or display in loginErrorElement
                // if (loginErrorElement) loginErrorElement.textContent = errorMessage;
            }

            // Optional: Re-enable button
            // loginButton.disabled = false;
            // loginButton.textContent = "Login"; // Or original text
        } else {
            alert("Please enter both username and password");
            // if (loginErrorElement) loginErrorElement.textContent = "Please enter both username and password.";
        }
    });
});