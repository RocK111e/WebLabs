// WebLabs/js/api_connector.js

const php_api_prefix = 'http://webphp.local/api/app.php'; // PHP API base
const node_api_prefix = 'http://localhost:3000';          // Node.js chat API base

// --- Student API functions (Keep these as they are from your original) ---
export async function fetch_all_students() {
    const response = await fetch(`${php_api_prefix}/students`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
    });
    if (response.status === 401) { window.location.href = "login.html"; }
    if (!response.ok) { return false; }
    const data = await response.json();
    if (data.error) { return false; }
    return data;
}

export async function delete_student(id) {
    const response = await fetch(`${php_api_prefix}/students/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
    });
    if (response.status === 401) { window.location.href = "login.html"; }
    if (!response.ok) { return false; }
    return true;
}

export async function post_student(group, first_name, last_name, gender, birthday) {
    const response = await fetch(`${php_api_prefix}/students`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({ Group: group, Name: first_name, Surname: last_name, Gender: gender, Birthday: birthday })
    });
    if (response.status === 401) { window.location.href = "login.html"; }
    if (response.ok) { return true; }
    if (response.status === 409) { alert("This student already exists"); return "This student already exists"; }
    return false;
}

export async function put_student(id, group, first_name, last_name, gender, birthday) {
    const response = await fetch(`${php_api_prefix}/students/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({ Group: group, Name: first_name, Surname: last_name, Gender: gender, Birthday: birthday })
    });
    if (response.status === 401) { window.location.href = "login.html"; }
    if (response.ok) { return true; }
    if (response.status === 409) { alert("This student already exists"); return "This student already exists"; }
    return false;
}

export async function fetch_students_count() {
    const response = await fetch(`${php_api_prefix}/students/count`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
    });
    if (response.status === 401) { window.location.href = "login.html"; }
    if (!response.ok) { return false; }
    const response_text = await response.text();
    const data = parseInt(response_text, 10);
    if (!isNaN(data)) { return data; }
    else { console.error('Response from students/count is not a valid integer'); return false; }
}

// --- Login and Logout (PHP API - Login now also gets user's external ID) ---
export async function login(login, password) {
    const response = await fetch(`${php_api_prefix}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Login: login, Password: password })
    });

    if (response.status === 401) {
        return "Invalid login or password"; // Specific error message for 401
    }
    if (!response.ok) {
        try { // Try to parse a JSON error message from the server
            const errorData = await response.json();
            return errorData.message || `Login request failed: ${response.statusText || response.status}`;
        } catch (e) { // Fallback if error response is not JSON
            return `Login request failed with status ${response.status}`;
        }
    }

    const data = await response.json();
    const token = data['token'];
    const name = data['Name'];
    const surname = data['Surname'];
    const userId = data['id']; // <-- EXPECTING THIS FROM YOUR PHP LOGIN API NOW

    if (token === undefined || name === undefined || surname === undefined || userId === undefined) {
        console.error("PHP Login response missing required fields (token, Name, Surname, or id):", data);
        return "Login failed: Incomplete user data received from server.";
    }

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('userDisplayName', `${name} ${surname}`);
    sessionStorage.setItem('userExternalId', userId.toString()); // Store the external ID for chat
    console.log("PHP Login successful. Stored token, userDisplayName, and userExternalId:", userId.toString());
    return true; // Indicate success
}

export async function logout() {
    const token = sessionStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${php_api_prefix}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (response.ok) {
                console.log("PHP Logout successful.");
            } else {
                console.warn("PHP Logout API call failed or was not successful. Status:", response.status);
            }
        } catch (error) {
            console.error("Error during PHP logout API call:", error);
        }
    }
    // Always clear session storage on client-side logout attempt
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userDisplayName');
    sessionStorage.removeItem('userExternalId');
    window.location.href = "login.html";
}

// fetch_current_user_details_php() is no longer needed for the login flow if PHP login returns ID.
// It can be removed or kept if used for other purposes (e.g., refreshing user details on other pages).

// --- Chat API functions ---
export async function fetch_my_chats() {
    const userExternalId = sessionStorage.getItem('userExternalId');
    const token = sessionStorage.getItem('token');
    if (!userExternalId || !token) { return []; }
    const response = await fetch(`${node_api_prefix}/chats/user/${userExternalId}`, {
        method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) { return []; }
    return await response.json() || [];
}

// UPDATED for group chats
export async function create_new_chat(participantExternalIds, chatName = null, creatorExternalId = null) {
    const token = sessionStorage.getItem('token');
    if (!token) { console.warn("Token missing for create_new_chat."); return null; }
    if (!creatorExternalId && (!!chatName || participantExternalIds.length > 1 && participantExternalIds.length !==2)) {
        console.warn("CreatorExternalId missing for group chat creation."); return null;
    }

    const body = {
        participantExternalIds,
        creatorExternalId // Crucial for group ownership/identification
    };
    if (chatName && chatName.trim() !== "") {
        body.chatName = chatName.trim();
    }

    const response = await fetch(`${node_api_prefix}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Server error, non-JSON response" }));
        console.error(`Error creating chat: ${response.status}`, errorData);
        alert(`Failed to create chat: ${errorData.error || 'Server error'}`);
        return null;
    }
    return await response.json();
}

export async function fetch_chat_messages(chatId, limit = 50, skip = 0) {
    const token = sessionStorage.getItem('token');
    if (!token) { return []; }
    const response = await fetch(`${node_api_prefix}/chats/${chatId}/messages?limit=${limit}&skip=${skip}`, {
        method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) { return []; }
    return await response.json() || [];
}