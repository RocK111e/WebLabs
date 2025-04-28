import {login} from './api_connector.js';

const login_regex = /^[a-zA-Z]$/;

document.addEventListener("DOMContentLoaded", async function() {
    const loginButton = document.getElementById("login-btn");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    loginButton.addEventListener("click", async function() {
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (username && password) {
            
            const result = await login(username, password);
            if (result) {
                window.location.href = "index.html"; // Redirect to the main page
            } else {
                alert("Invalid username or password");
            }
        } else {
            alert("Please enter both username and password");
        }
    });
});