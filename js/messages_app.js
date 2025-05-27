// WebLabs/js/messages_app.js

import {
    fetch_my_chats,
    fetch_chat_messages,
    create_new_chat,
    logout,
    fetch_all_students
} from "./api_connector.js";
import { burger_menu } from "./button.js";

let socket = null;
let currentOpenChatId = null;
let loggedInUserExternalId = sessionStorage.getItem('userExternalId');

// --- Socket.IO Initialization and Event Handlers ---
function initializeSocket() {
    const token = sessionStorage.getItem('token');
    loggedInUserExternalId = sessionStorage.getItem('userExternalId'); // Refresh ID

    if (!loggedInUserExternalId) {
        console.warn("Chat User ID not found. Socket connection aborted. Please login again.");
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Error: Your chat user profile is not loaded. Please log out and log in again.</p>';
        }
        const messageInput = document.getElementById('message-input');
        const sendMessageBtn = document.getElementById('send-message');
        if(messageInput) messageInput.disabled = true;
        if(sendMessageBtn) sendMessageBtn.disabled = true;
        return false;
    }
    if (!token) {
        console.error("Authentication token not found. Socket connection aborted.");
        return false;
    }

    console.log("Attempting to connect to Socket.IO with token and userExternalId:", loggedInUserExternalId);
    socket = io('http://localhost:3000', { auth: { token: token } });

    socket.on('connect', () => {
        console.log('Socket.IO connected!', socket.id);
        if (currentOpenChatId) {
            socket.emit('joinChat', currentOpenChatId);
            console.log(`Re-joined chat room on connect: ${currentOpenChatId}`);
        }
    });

    socket.on('newMessage', (data) => {
        console.log('New message received via socket:', data);
        if (data.chatId === currentOpenChatId) {
            appendMessageToChatArea(data);
        }
    });

    socket.on('messageError', (error) => {
        console.error('Socket Message Error:', error);
        alert(`Message error: ${error.error || 'Unknown'}`);
    });

    socket.on('userTyping', (data) => {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator && data.chatId === currentOpenChatId) {
            if (data.isTyping && data.externalUserId !== loggedInUserExternalId) {
                typingIndicator.textContent = `${data.username || 'Someone'} is typing...`;
                typingIndicator.style.display = 'block';
            } else {
                typingIndicator.textContent = '';
                typingIndicator.style.display = 'none';
            }
        }
    });

    socket.on('disconnect', (reason) => console.log(`Socket.IO disconnected: ${reason}`));
    socket.on('connect_error', (err) => console.error(`Socket.IO connection error: ${err.message}`));
    socket.on('error', (err) => console.error('General Socket Error from server:', err));
    return true;
}

// --- DOM Elements for Chat Page ---
const chatListContainer = document.querySelector('.chat-list');
const chatMessagesContainer = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message');
const chatTitle = document.getElementById('chat-title');
const noMessagesPlaceholder = document.querySelector('.no-messages-selected');
const typingIndicator = document.getElementById('typing-indicator');

// --- New Chat Modal Elements & Functions ---
const newChatModal = document.getElementById('new-chat-modal');
const selectChatParticipantsEl = document.getElementById('select-chat-participants');
const newChatNameInput = document.getElementById('new-chat-name');
const confirmNewChatBtn = document.getElementById('confirm-new-chat-btn');
const newChatErrorSpan = document.getElementById('new-chat-error');

function openNewChatModal() {
    if (!newChatModal || !selectChatParticipantsEl || !loggedInUserExternalId) {
        alert("Could not open new chat dialog. Please ensure you are logged in properly.");
        return;
    }
    if(newChatErrorSpan) {
        newChatErrorSpan.textContent = '';
        newChatErrorSpan.style.display = 'none';
    }
    if(newChatNameInput) newChatNameInput.value = '';
    selectChatParticipantsEl.innerHTML = '<option value="" disabled>-- Loading students... --</option>';
    newChatModal.style.display = 'block';

    fetch_all_students().then(students => {
        selectChatParticipantsEl.innerHTML = ''; // Clear loading/previous
        if (students && Array.isArray(students)) {
            students.forEach(student => {
                if (student.id && student.id.toString() !== loggedInUserExternalId) {
                    const option = document.createElement('option');
                    option.value = student.id.toString();
                    option.textContent = `${student.Name} ${student.Surname} (ID: ${student.id.toString().slice(0,5)}...)`;
                    selectChatParticipantsEl.appendChild(option);
                }
            });
            if (selectChatParticipantsEl.options.length === 0) {
                 selectChatParticipantsEl.insertAdjacentHTML('beforeend', '<option value="" disabled>No other students available to chat with.</option>');
            }
        } else {
            selectChatParticipantsEl.insertAdjacentHTML('beforeend', '<option value="" disabled>Could not load students</option>');
            if(newChatErrorSpan) {
                newChatErrorSpan.textContent = 'Failed to load student list.';
                newChatErrorSpan.style.display = 'block';
            }
        }
    }).catch(error => {
        console.error("Error fetching students for new chat modal:", error);
        selectChatParticipantsEl.insertAdjacentHTML('beforeend', '<option value="" disabled>Error loading students</option>');
        if(newChatErrorSpan) {
            newChatErrorSpan.textContent = 'Error loading student list.';
            newChatErrorSpan.style.display = 'block';
        }
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

async function handleNewChatViaModal() {
    if (!loggedInUserExternalId || !selectChatParticipantsEl || !newChatNameInput || !newChatErrorSpan || !confirmNewChatBtn) return;

    const selectedOptions = Array.from(selectChatParticipantsEl.selectedOptions);
    const selectedParticipantIds = selectedOptions.map(option => option.value);
    let chatName = newChatNameInput.value.trim();

    if (selectedParticipantIds.length === 0) {
        newChatErrorSpan.textContent = "Please select at least one student.";
        newChatErrorSpan.style.display = 'block';
        return;
    }
    newChatErrorSpan.textContent = '';
    newChatErrorSpan.style.display = 'none';

    const isGroupAttempt = chatName !== "" || selectedParticipantIds.length > 1;
    if (isGroupAttempt && chatName === "" && selectedParticipantIds.length > 1) {
        const selectedNames = selectedOptions.map(opt => opt.textContent.split(' (ID:')[0]).slice(0, 3);
        chatName = selectedNames.join(', ') + (selectedOptions.length > 3 ? ' & others' : '');
    }

    confirmNewChatBtn.disabled = true;
    confirmNewChatBtn.textContent = "Starting...";

    const allParticipantIds = [loggedInUserExternalId, ...selectedParticipantIds];
    const uniqueParticipantIds = [...new Set(allParticipantIds)];

    const newChatData = await create_new_chat(
        uniqueParticipantIds,
        (chatName || isGroupAttempt) ? chatName : null,
        loggedInUserExternalId
    );

    confirmNewChatBtn.disabled = false;
    confirmNewChatBtn.textContent = "Start Chat";

    if (newChatData && newChatData.chat) {
        closeModal('new-chat-modal');
        await loadUserChats();

        let finalChatName = newChatData.chat.chatName;
        const createdChatParticipants = newChatData.chat.participants || [];

        if (!finalChatName && createdChatParticipants.length > 0) {
            const others = createdChatParticipants.filter(p => p.externalId !== loggedInUserExternalId);
            if (others.length === 1) finalChatName = `Chat with ${others[0].name || `User ${others[0].externalId.slice(0,4)}`}`;
            else if (others.length > 1) finalChatName = others.map(p => p.name || `User ${p.externalId.slice(0,4)}`).slice(0,2).join(', ') + (others.length > 2 ? '...' : '');
            else finalChatName = "My Notes";
        } else if (!finalChatName) finalChatName = `Chat ${newChatData.chat._id.slice(-4)}`;

        openChat(newChatData.chat._id, finalChatName, createdChatParticipants, newChatData.chat.isGroupChat, newChatData.chat.adminExternalId);
    } else {
        newChatErrorSpan.textContent = "Failed to create chat. Please try again.";
        newChatErrorSpan.style.display = 'block';
    }
}

// --- Core Chat Page Functions ---
function enableChatInput(enable = true) {
    if(messageInput) messageInput.disabled = !enable;
    if(sendMessageBtn) sendMessageBtn.disabled = !enable;
    if(noMessagesPlaceholder) {
        const hasMessages = chatMessagesContainer && chatMessagesContainer.children.length > 0 &&
                            !(chatMessagesContainer.children.length === 1 && chatMessagesContainer.firstElementChild === noMessagesPlaceholder);
        noMessagesPlaceholder.style.display = (enable && hasMessages) ? 'none' : 'block';
        if(!enable) noMessagesPlaceholder.textContent = "Select a chat to view messages.";
    }
}

async function loadUserChats() {
    if (!chatListContainer) return;
    const chats = await fetch_my_chats();
    const headerHTML = `<div class="main-header"><h2 class="students-title">Chat room</h2><button class="add-button new-chat-btn" title="Start New Chat">+</button></div>`;
    chatListContainer.innerHTML = headerHTML;
    const newChatButtonInList = chatListContainer.querySelector('.new-chat-btn');
    if(newChatButtonInList) newChatButtonInList.addEventListener('click', openNewChatModal);

    if (chats && chats.length > 0) {
        chats.forEach(chat => {
            let displayName = "Chat";
            if (chat.isGroupChat && chat.chatName) {
                displayName = chat.chatName;
            } else if (chat.participants && chat.participants.length > 0) {
                const others = chat.participants.filter(p => p.externalId !== loggedInUserExternalId);
                if (others.length === 1) displayName = `Chat with ${others[0].name || `User ${others[0].externalId.slice(0,4)}`}`;
                else if (others.length > 1) displayName = chat.chatName || others.map(p => p.name || `User ${p.externalId.slice(0,4)}`).slice(0, 2).join(', ') + (others.length > 2 ? '...' : '');
                else if (chat.participants.length === 1 && chat.participants[0].externalId === loggedInUserExternalId) displayName = chat.chatName || "My Notes";
                else displayName = chat.chatName || `Group ${chat._id.slice(-4)}`;
            } else { displayName = `Chat ${chat._id.slice(-4)}`; }

            const item = document.createElement('div');
            item.className = 'chat-item';
            item.dataset.chatId = chat._id;
            item.innerHTML = `<span class="chat-name">${displayName}</span>`;
            item.addEventListener('click', () => openChat(chat._id, displayName, chat.participants || [], chat.isGroupChat, chat.adminExternalId));
            chatListContainer.appendChild(item);
        });
    } else {
        chatListContainer.insertAdjacentHTML('beforeend', '<p class="no-chats">No chats. Start one!</p>');
    }
}

async function openChat(chatId, name, participants, isGroup = false, adminId = null) {
    if (!chatMessagesContainer || !chatTitle) return;
    console.log(`Opening chat: ${chatId}, Name: ${name}, Group: ${isGroup}`);

    if (currentOpenChatId && socket && currentOpenChatId !== chatId) { socket.emit('leaveChat', currentOpenChatId); }
    currentOpenChatId = chatId;
    chatTitle.textContent = name;
    chatMessagesContainer.innerHTML = '';

    document.querySelectorAll('.chat-list .chat-item.active').forEach(el => el.classList.remove('active'));
    document.querySelector(`.chat-list .chat-item[data-chat-id="${chatId}"]`)?.classList.add('active');

    const membersListDiv = document.querySelector('.chat-area .members-list');
    if(membersListDiv) {
        membersListDiv.innerHTML = '';
        (participants || []).forEach(p => {
            const icon = document.createElement('div');
            icon.className = 'member-icon';
            icon.title = `${p.name || `User ${p.externalId?.slice(0,4)}`}${p.externalId === adminId ? ' (Admin)' : ''}`;
            icon.textContent = (p.name || p.externalId || 'U').substring(0,1).toUpperCase();
            if(p.externalId === adminId) icon.style.cssText = "border: 2px solid gold; font-weight: bold;";
            membersListDiv.appendChild(icon);
        });
        if(isGroup) {
            membersListDiv.insertAdjacentHTML('beforeend', '<button class="add-member-btn" title="Add Member (Not Implemented)">+</button>');
        }
    }

    if (socket && socket.connected) { socket.emit('joinChat', chatId); }
    enableChatInput(true);

    const messages = await fetch_chat_messages(chatId);
    if (chatMessagesContainer) {
        if (messages && messages.length > 0) {
            if(noMessagesPlaceholder) noMessagesPlaceholder.style.display = 'none';
            messages.forEach(appendMessageToChatArea);
        } else {
            if(noMessagesPlaceholder) {
                noMessagesPlaceholder.style.display = 'block';
                noMessagesPlaceholder.textContent = "No messages here yet. Send one!";
            }
        }
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
}

function appendMessageToChatArea(msg) {
    if (!chatMessagesContainer) return;
    if(noMessagesPlaceholder) noMessagesPlaceholder.style.display = 'none';

    const div = document.createElement('div');
    div.className = `message ${msg.senderExternalId === loggedInUserExternalId ? 'sent' : 'received'}`;
    const sender = msg.senderExternalId === loggedInUserExternalId ? 'Me' : (msg.username || `User ${msg.senderExternalId.slice(0,4)}`);
    div.innerHTML = `
        <span class="message-sender">${sender}</span>
        <span class="message-text">${msg.message.replace(/\n/g, '<br>')}</span>
        <span class="message-time">${new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
    chatMessagesContainer.appendChild(div);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// --- Event Listeners Setup ---
function setupMessagePageEventListeners() {
    if (sendMessageBtn && messageInput) {
        sendMessageBtn.addEventListener('click', () => {
            const text = messageInput.value.trim();
            if (text && currentOpenChatId && socket && socket.connected && loggedInUserExternalId) {
                socket.emit('sendMessage', {
                    chatId: currentOpenChatId,
                    senderExternalId: loggedInUserExternalId,
                    message: text
                });
                messageInput.value = '';
                if(typingIndicator) typingIndicator.style.display = 'none';
                socket.emit('typing', { chatId: currentOpenChatId, externalUserId: loggedInUserExternalId, isTyping: false });
            } else if (!socket || !socket.connected) {
                alert("Not connected to chat server. Please wait or refresh.");
            }
        });
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessageBtn.click(); }
        });
        let typingTimeout;
        messageInput.addEventListener('input', () => {
            if (socket && socket.connected && currentOpenChatId && loggedInUserExternalId) {
                socket.emit('typing', { chatId: currentOpenChatId, externalUserId: loggedInUserExternalId, isTyping: true });
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    socket.emit('typing', { chatId: currentOpenChatId, externalUserId: loggedInUserExternalId, isTyping: false });
                }, 1500);
            }
        });
    }

    if (confirmNewChatBtn) {
        confirmNewChatBtn.addEventListener('click', handleNewChatViaModal);
    }

    document.querySelectorAll('.close-modal[data-modal-id="new-chat-modal"], .cancel-but[data-modal-id="new-chat-modal"]').forEach(btn => {
        btn.addEventListener('click', () => closeModal('new-chat-modal'));
    });
}

// --- DOMContentLoaded for message.html ---
document.addEventListener("DOMContentLoaded", async function() {
    const currentPagePath = window.location.pathname.split("/").pop() || "index.html";

    if (currentPagePath === 'message.html') {
        console.log("Initializing message page (messages_app.js)");
        document.body.classList.add('messages-page');

        loggedInUserExternalId = sessionStorage.getItem('userExternalId');
        if (!loggedInUserExternalId) {
            console.error("FATAL: User External ID not found in session. Redirecting to login.");
            alert("Your session is invalid or has expired. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        const burgerBtn = document.getElementById("burger-btn");
        if (burgerBtn) burgerBtn.addEventListener("click", burger_menu);

        document.querySelectorAll('.account_but').forEach(btn => {
            btn.addEventListener('click', async () => { await logout(); });
        });
        const userDisplayName = sessionStorage.getItem('userDisplayName');
        document.querySelectorAll('.user_name a').forEach(el => {
            if(userDisplayName) el.textContent = userDisplayName;
            else el.textContent = "User";
        });
        const bellContainer = document.querySelector('.bell-container');
        const bellWrapper = document.querySelector('.bell-wrapper');
        if (bellContainer && bellWrapper) {
            bellContainer.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                if (bellWrapper.classList.contains('shake')) return;
                bellWrapper.classList.add('shake');
                setTimeout(() => { bellWrapper.classList.remove('shake'); }, 600);
            });
        }

        setupMessagePageEventListeners();
        await loadUserChats();
        enableChatInput(false);
    }
});