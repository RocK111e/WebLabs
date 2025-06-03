// WebLabs/js/api_connector.js

const php_api_prefix = 'http://webphp.local/api/app.php'; // PHP API base
const node_api_prefix = 'http://localhost:3000';          // Node.js chat API base

// --- Student API functions (Used for fetching user details for chat) ---
export async function fetch_all_students() { // Used to populate user list for new chats
    console.log("[API] fetch_all_students called");
    const token = sessionStorage.getItem('token');
    if (!token) {
        console.warn("[API] No token found, cannot fetch students. Redirecting to login.");
        window.location.href = "login.html";
        return false;
    }
    try {
        const response = await fetch(`${php_api_prefix}/students`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        console.log("[API] fetch_all_students response status:", response.status);
        if (response.status === 401) {
            console.warn("[API] Unauthorized fetching students. Redirecting to login.");
            window.location.href = "login.html";
            return false;
        }
        if (!response.ok) {
            console.error(`[API] Error fetching students: ${response.status} ${response.statusText}`);
            return false;
        }
        const data = await response.json();
        if (data.error) {
            console.error(`[API] API error fetching students: ${data.error}`);
            return false;
        }
        console.log("[API] fetch_all_students success, data:", data);
        return data;
    } catch (error) {
        console.error("[API] Network error fetching students:", error);
        return false;
    }
}

export async function fetch_student_details(externalUserId) {
    console.log(`[API] fetch_student_details called for ID: ${externalUserId}`);
    const token = sessionStorage.getItem('token');
    if (!token) {
        console.warn("[API] No token for fetch_student_details");
        return null;
    }
    try {
        const response = await fetch(`${php_api_prefix}/students/${externalUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        console.log(`[API] fetch_student_details for ${externalUserId} response status:`, response.status);
        if (response.status === 401) { window.location.href = "login.html"; return null; }
        if (!response.ok) {
            console.error(`[API] Error fetching student details for ${externalUserId}: ${response.status}`);
            return null;
        }
        const data = await response.json();
        if (data.error) {
            console.error(`[API] API error fetching student details for ${externalUserId}: ${data.error}`);
            return null;
        }
        const result = { id: data.id, name: `${data.Name} ${data.Surname}`, firstName: data.Name, surname: data.Surname, avatarUrl: data.avatarUrl };
        console.log(`[API] fetch_student_details for ${externalUserId} success, data:`, result);
        return result;
    } catch (error) {
        console.error("[API] Network error fetching student details:", error);
        return null;
    }
}


// --- Other existing Student API functions ---
export async function delete_student(id) {
    const token = sessionStorage.getItem('token');
    if (!token) { window.location.href = "login.html"; return false; }
    try {
        const response = await fetch(`${php_api_prefix}/students/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.status === 401) { window.location.href = "login.html"; return false;}
        return response.ok;
    } catch (error) {
        console.error("Error deleting student:", error);
        return false;
    }
}

export async function post_student(group, first_name, last_name, gender, birthday) {
    const token = sessionStorage.getItem('token');
    if (!token) { window.location.href = "login.html"; return false; }
    try {
        const response = await fetch(`${php_api_prefix}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ Group: group, Name: first_name, Surname: last_name, Gender: gender, Birthday: birthday })
        });
        if (response.status === 401) { window.location.href = "login.html"; return false;}
        if (response.ok) { return true; }
        if (response.status === 409) { alert("This student already exists"); return "This student already exists"; }
        return false;
    } catch (error) {
        console.error("Error posting student:", error);
        return false;
    }
}

export async function put_student(id, group, first_name, last_name, gender, birthday) {
    const token = sessionStorage.getItem('token');
    if (!token) { window.location.href = "login.html"; return false; }
    try {
        const response = await fetch(`${php_api_prefix}/students/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ Group: group, Name: first_name, Surname: last_name, Gender: gender, Birthday: birthday })
        });
        if (response.status === 401) { window.location.href = "login.html"; return false; }
        if (response.ok) { return true; }
        if (response.status === 409) { alert("This student already exists"); return "This student already exists"; }
        return false;
    } catch (error) {
        console.error("Error putting student:", error);
        return false;
    }
}

export async function fetch_students_count() { // THIS IS CORRECTLY EXPORTED
    console.log("[API] fetch_students_count called");
    const token = sessionStorage.getItem('token');
    if (!token) { window.location.href = "login.html"; return false; }
    try {
        const response = await fetch(`${php_api_prefix}/students/count`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        if (response.status === 401) { window.location.href = "login.html"; return false; }
        if (!response.ok) { return false; }
        const response_text = await response.text();
        const data = parseInt(response_text, 10);
        if (!isNaN(data)) { return data; }
        else { console.error('Response from students/count is not a valid integer'); return false; }
    } catch (error) {
        console.error("Error fetching students count:", error);
        return false;
    }
}


// --- Login and Logout (PHP API) ---
export async function login(login, password) {
    console.log("[API] login attempt for:", login);
    try {
        const response = await fetch(`${php_api_prefix}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Login: login, Password: password })
        });
        console.log("[API] login response status:", response.status);

        if (response.status === 401) {
            return "Invalid login or password";
        }
        if (!response.ok) {
            try {
                const errorData = await response.json();
                return errorData.message || `Login request failed: ${response.statusText || response.status}`;
            } catch (e) {
                return `Login request failed with status ${response.status}`;
            }
        }

        const data = await response.json();
        const token = data['token'];
        const name = data['Name'];
        const surname = data['Surname'];
        const userId = data['id'];

        if (token === undefined || name === undefined || surname === undefined || userId === undefined) {
            console.error("[API] PHP Login response missing required fields (token, Name, Surname, or id):", data);
            return "Login failed: Incomplete user data received from server.";
        }

        sessionStorage.setItem('token', token);
        sessionStorage.setItem('userDisplayName', `${name} ${surname}`);
        sessionStorage.setItem('userExternalId', userId.toString());
        console.log("[API] PHP Login successful. Stored token, userDisplayName, and userExternalId:", userId.toString());
        return true;
    } catch (error) {
        console.error("[API] Network error during login:", error);
        return "Login failed due to a network error.";
    }
}

export async function logout() {
    console.log("[API] logout called");
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
                console.log("[API] PHP Logout successful.");
            } else {
                console.warn("[API] PHP Logout API call failed or was not successful. Status:", response.status);
            }
        } catch (error) {
            console.error("[API] Error during PHP logout API call:", error);
        }
    }
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userDisplayName');
    sessionStorage.removeItem('userExternalId');
    window.location.href = "login.html";
}


// --- Chat API functions (Node.js API) ---

export async function fetch_my_chats() {
    console.log("[API CHAT] fetch_my_chats called");
    const userExternalId = sessionStorage.getItem('userExternalId');
    const userDisplayName = sessionStorage.getItem('userDisplayName');
    const token = sessionStorage.getItem('token');

    if (!userExternalId || !userDisplayName) {
        console.error("[API CHAT] User data not found in session storage. Cannot fetch chats.");
        return [];
    }
    if (!token) {
        console.warn("[API CHAT] Token not found for fetch_my_chats. Redirecting to login.");
        window.location.href = "login.html";
        return [];
    }

    try {
        const response = await fetch(`${node_api_prefix}/chats?UserId=${userExternalId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        console.log("[API CHAT] fetch_my_chats response status:", response.status);

        if (response.status === 401) {
            console.warn("[API CHAT] Unauthorized fetching chats. Redirecting to login.");
            window.location.href = "login.html";
            return [];
        }
        if (!response.ok) {
            console.error(`[API CHAT] Error fetching user chats: ${response.status} ${response.statusText}`);
            return [];
        }
        const chats = await response.json();
        console.log("[API CHAT] fetch_my_chats success, data:", chats);
        return Array.isArray(chats) ? chats : [];
    } catch (error) {
        console.error("[API CHAT] Network or other error fetching user chats:", error);
        return [];
    }
}

export async function create_new_chat(participantExternalIds, chatName = null, creatorExternalId = null) {
    console.log("[API CHAT] create_new_chat called with participants:", participantExternalIds, "name:", chatName, "creator:", creatorExternalId);
    const token = sessionStorage.getItem('token');
    if (!token) {
        console.warn("[API CHAT] Token missing for create_new_chat. Redirecting to login.");
        window.location.href = "login.html";
        return null;
    }

    const isGroupAttempt = !!chatName || participantExternalIds.length > 2 || (participantExternalIds.length === 1 && participantExternalIds[0] === creatorExternalId);

    if (isGroupAttempt && !creatorExternalId) {
        console.error("[API CHAT] CreatorExternalId is required for creating a group chat.");
        alert("Error: Creator ID missing for group chat.");
        return null;
    }
    if (!participantExternalIds || participantExternalIds.length === 0) {
        console.error("[API CHAT] Participant IDs are required to create a chat.");
        alert("Error: No participants selected for the chat.");
        return null;
    }

    const body = { participantExternalIds };
    if (isGroupAttempt) {
        body.chatName = chatName || "Unnamed Group";
        body.creatorExternalId = creatorExternalId;
    }
    console.log("[API CHAT] create_new_chat request body:", body);

    try {
        const response = await fetch(`${node_api_prefix}/chats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        console.log("[API CHAT] create_new_chat response status:", response.status);

        if (response.status === 401) {
            console.warn("[API CHAT] Unauthorized creating chat. Redirecting to login.");
            window.location.href = "login.html";
            return null;
        }

        const responseData = await response.json();
        console.log("[API CHAT] create_new_chat response data:", responseData);

        if (!response.ok) {
            console.error(`[API CHAT] Error creating chat: ${response.status}`, responseData);
            alert(`Failed to create chat: ${responseData.error || 'Server error. Please try again.'}`);
            return null;
        }
        return responseData;
    } catch (error) {
        console.error("[API CHAT] Network or other error creating chat:", error);
        alert("Failed to create chat due to a network error. Please check your connection and try again.");
        return null;
    }
}

export async function fetch_chat_messages(chatId, limit = 50, skip = 0) {
    console.log(`[API CHAT] fetch_chat_messages called for chatId: ${chatId}, limit: ${limit}, skip: ${skip}`);
    const token = sessionStorage.getItem('token');
    if (!token) {
        console.warn("[API CHAT] Token not found for fetch_chat_messages. Redirecting to login.");
        window.location.href = "login.html";
        return [];
    }
    if (!chatId) {
        console.error("[API CHAT] chatId is required to fetch messages.");
        return [];
    }

    try {
        const response = await fetch(`${node_api_prefix}/chats/${chatId}/messages?limit=${limit}&skip=${skip}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`[API CHAT] fetch_chat_messages for ${chatId} response status:`, response.status);

        if (response.status === 401) {
            console.warn("[API CHAT] Unauthorized fetching messages. Redirecting to login.");
            window.location.href = "login.html";
            return [];
        }
        if (!response.ok) {
            console.error(`[API CHAT] Error fetching chat messages for ${chatId}: ${response.status} ${response.statusText}`);
            return [];
        }
        const messages = await response.json();
        console.log(`[API CHAT] fetch_chat_messages for ${chatId} success, data:`, messages);
        return Array.isArray(messages) ? messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : [];
    } catch (error) {
        console.error(`[API CHAT] Network or other error fetching messages for ${chatId}:`, error);
        return [];
    }
}

export async function post_message_http(chatId, senderExternalId, message) {
    console.log(`[API CHAT] post_message_http called for chatId: ${chatId}, sender: ${senderExternalId}`);
    const token = sessionStorage.getItem('token');
    if (!token) {
        console.warn("[API CHAT] Token not found for posting message. Redirecting to login.");
        window.location.href = "login.html";
        return null;
    }

    try {
        const response = await fetch(`${node_api_prefix}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ chatId, senderExternalId, message })
        });
        console.log("[API CHAT] post_message_http response status:", response.status);

        if (response.status === 401) {
            console.warn("[API CHAT] Unauthorized posting message. Redirecting to login.");
            window.location.href = "login.html";
            return null;
        }

        const responseData = await response.json();
        console.log("[API CHAT] post_message_http response data:", responseData);

        if (!response.ok) {
            console.error(`[API CHAT] Error posting message via HTTP: ${response.status}`, responseData);
            alert(`Failed to send message: ${responseData.error || 'Server error'}`);
            return null;
        }
        return responseData.data;
    } catch (error) {
        console.error("[API CHAT] Network or other error posting message via HTTP:", error);
        alert("Failed to send message due to a network error.");
        return null;
    }
}