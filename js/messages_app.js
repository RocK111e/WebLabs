// WebLabs/js/messages_app.js

import {
    fetch_my_chats,
    fetch_chat_messages,
    create_new_chat,
    logout,
    fetch_all_students
    // post_message_http // Not currently used for sending, but available
} from "./api_connector.js";
import { burger_menu } from "./button.js";

const NODE_API_BASE_URL = 'http://localhost:3000';

// DOM Elements
let chatListItemsContainer, chatMessagesArea, messageInput, sendMessageBtn,
    chatListEmptyPlaceholder, currentChatNameEl, currentChatParticipantsEl,
    chatListToggleBtn, chatListEl,
    addChatModalOverlay, openAddChatModalBtn, closeAddChatModalBtn, cancelNewChatBtn, confirmNewChatBtn,
    newGroupNameInput, searchUsersForNewChatInput, newUserSearchResultsContainer, newChatSelectedUsersIconsEl;

// App State
let socket;
let currentUserExternalId = null;
let currentUserName = "User";
let activeChatId = null;
let allUsersCache = [];
let selectedUsersForNewChat = [];
let typingTimers = {};
let currentActiveChatObject = null;

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async function() {
    console.log("[APP] DOMContentLoaded");
    currentUserExternalId = sessionStorage.getItem('userExternalId');
    const token = sessionStorage.getItem('token');
    currentUserName = sessionStorage.getItem('userDisplayName') || "User";
    console.log("[APP] Current User External ID:", currentUserExternalId);
    console.log("[APP] Current User Name:", currentUserName);

    if (!currentUserExternalId || !token) {
        console.log("[APP] User not authenticated, redirecting to login.");
        window.location.href = "login.html";
        return;
    }

    cacheDOMElements();
    setupCommonUI();
    initializeSocketIO(token); // This is where 'socket' should be initialized
    await loadInitialData();
    setupEventListeners();
    console.log("[APP] Initialization complete.");
});

function cacheDOMElements() {
    console.log("[APP] Caching DOM elements");
    chatListItemsContainer = document.querySelector(".chat-list-items");
    chatMessagesArea = document.querySelector(".chat-messages-area");
    messageInput = document.querySelector(".message-input");
    sendMessageBtn = document.querySelector(".send-message-btn");
    chatListEmptyPlaceholder = document.querySelector(".chat-list-empty-placeholder");
    currentChatNameEl = document.getElementById("currentChatName");
    currentChatParticipantsEl = document.getElementById("currentChatParticipants");

    chatListToggleBtn = document.querySelector(".chat-list-toggle-btn");
    chatListEl = document.querySelector(".chat-list");

    addChatModalOverlay = document.getElementById("addChatModalOverlay");
    openAddChatModalBtn = document.getElementById("openAddChatModalBtn");
    closeAddChatModalBtn = document.getElementById("closeAddChatModalBtn");
    cancelNewChatBtn = document.getElementById("cancelNewChatBtn");
    confirmNewChatBtn = document.getElementById("confirmNewChatBtn");
    newGroupNameInput = document.getElementById("newGroupNameInput");
    searchUsersForNewChatInput = document.getElementById("searchUsersForNewChatInput");
    newUserSearchResultsContainer = document.getElementById("newUserSearchResults");
    newChatSelectedUsersIconsEl = document.getElementById("newChatSelectedUsersIcons");
}

function setupCommonUI() {
    console.log("[APP] Setting up common UI");
    const burgerBtn = document.getElementById("burger-btn");
    if (burgerBtn) burgerBtn.addEventListener("click", burger_menu);

    document.querySelectorAll('.account_but').forEach(btn => {
        btn.addEventListener('click', async () => { await logout(); });
    });
    document.querySelectorAll('.user_name a').forEach(el => {
        if (currentUserName) el.textContent = currentUserName;
    });

    const bellContainer = document.querySelector('.bell-container');
    const bellWrapper = document.querySelector('.bell-wrapper');
    if (bellContainer && bellWrapper) {
        bellContainer.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (bellWrapper.classList.contains('shake')) return;
            bellWrapper.classList.add('shake');
            setTimeout(() => { bellWrapper.classList.remove('shake'); }, 600);
        });
    }
}

function initializeSocketIO(token) {
    console.log("[APP] Initializing Socket.IO");
    if (typeof io === 'undefined') { // This check is crucial
        console.error("[APP] Socket.IO client (the 'io' function) is not defined. Chat functionality will be disabled. Make sure socket.io.js is loaded BEFORE this script in your HTML.");
        alert("Chat service is currently unavailable. Please try refreshing the page or contact support if the issue persists.");
        return; // Exit if io is not available
    }
    try {
        socket = io(NODE_API_BASE_URL, { // Assign to the global 'socket'
            auth: { token: token }
        });
        console.log("[APP] Socket object created (or attempting to connect). Socket exists now:", !!socket);


        socket.on('connect', () => {
            console.log('[APP SOCKET] Socket.IO connected:', socket.id);
            if (activeChatId) {
                console.log('[APP SOCKET] Re-joining chat on connect:', activeChatId);
                socket.emit('joinChat', activeChatId);
            }
        });

        socket.on('disconnect', (reason) => console.log('[APP SOCKET] Socket.IO disconnected:', reason));
        socket.on('connect_error', (err) => {
            console.error('[APP SOCKET] Socket.IO connection error:', err.message);
            if (err.data) console.error('[APP SOCKET] Connection error data:', err.data);
            // You might want to inform the user here if connection fails repeatedly
        });

        socket.on('newMessage', (messageData) => {
            console.log('[APP SOCKET] Received "newMessage":', messageData);
            if (messageData.chatId === activeChatId) {
                appendMessageToUI(messageData);
                clearTypingIndicator(messageData.chatId, messageData.senderExternalId);
            }
            updateChatListWithNewMessage(messageData);
        });

        socket.on('userTyping', (typingData) => {
            // console.log('[APP SOCKET] Received "userTyping":', typingData); // Can be noisy
            if (typingData.chatId === activeChatId && typingData.externalUserId !== currentUserExternalId) {
                if (typingData.isTyping) showTypingIndicator(typingData);
                else clearTypingIndicator(typingData.chatId, typingData.externalUserId);
            }
        });

        socket.on('messageError', (errorData) => {
            console.error('[APP SOCKET] Received "messageError":', errorData);
            alert(`Error: ${errorData.error}`);
        });
    } catch (error) {
        console.error("[APP] Error during Socket.IO initialization (e.g., invalid URL):", error);
        socket = null; // Ensure socket remains null/undefined if io() call itself throws
        alert("Could not initialize chat service. Please try again later.");
    }
}


async function loadInitialData() {
    console.log("[APP] Loading initial data");
    const users = await fetch_all_students();
    if (users && Array.isArray(users)) {
        allUsersCache = users.map(u => ({
            id: u.id.toString(),
            name: `${u.Name} ${u.Surname}`,
            firstName: u.Name,
            surname: u.Surname,
            avatarUrl: u.avatar_url || './icons/user.png'
        }));
        console.log("[APP] Users cache populated:", allUsersCache.length, "users");
    } else {
        console.warn("[APP] Failed to load user list for cache.");
    }

    const chats = await fetch_my_chats();
    console.log("[APP] Fetched chats:", chats ? chats.length : 0);
    renderChatList(chats);
}

function setupEventListeners() {
    console.log("[APP] Setting up event listeners");
    sendMessageBtn.addEventListener("click", handleSendMessage);
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    messageInput.addEventListener("input", handleTyping);

    if (chatListToggleBtn) chatListToggleBtn.addEventListener("click", () => chatListEl.classList.toggle("chat-list-open"));

    if (openAddChatModalBtn) openAddChatModalBtn.addEventListener("click", openNewChatModal);
    if (closeAddChatModalBtn) closeAddChatModalBtn.addEventListener("click", closeNewChatModal);
    if (cancelNewChatBtn) cancelNewChatBtn.addEventListener("click", closeNewChatModal);
    if (addChatModalOverlay) addChatModalOverlay.addEventListener("click", (e) => {
        if (e.target === addChatModalOverlay) closeNewChatModal();
    });
    if (confirmNewChatBtn) confirmNewChatBtn.addEventListener("click", handleCreateNewChat);
    if (searchUsersForNewChatInput) searchUsersForNewChatInput.addEventListener("input", handleSearchUsersForNewChat);
}

// --- Chat List ---
function renderChatList(chats) {
    console.log("[APP] renderChatList called with", chats ? chats.length : 0, "chats");
    chatListItemsContainer.innerHTML = "";
    if (!chats || chats.length === 0) {
        showChatListEmptyPlaceholder(true);
        return;
    }
    showChatListEmptyPlaceholder(false);

    chats.sort((a, b) => {
        const dateA = new Date(a.lastMessage ? a.lastMessage.createdAt : a.updatedAt || 0);
        const dateB = new Date(b.lastMessage ? b.lastMessage.createdAt : b.updatedAt || 0);
        return dateB - dateA;
    });

    chats.forEach(chat => chatListItemsContainer.appendChild(createChatItemElement(chat)));
}

function createChatItemElement(chat) {
    const item = document.createElement("div");
    item.classList.add("chat-list-item");
    item.dataset.chatId = chat._id;

    let chatDisplayName = chat.chatName;
    let avatar = chat.avatarUrl || './icons/user.png';

    if (!chat.isGroupChat && chat.participants && chat.participants.length > 0) {
        const otherParticipant = chat.participants.find(p => p.externalId !== currentUserExternalId);
        if (otherParticipant) {
            chatDisplayName = otherParticipant.name || "User";
            avatar = otherParticipant.avatarUrl || getUserAvatarFromCache(otherParticipant.externalId) || './icons/user.png';
        } else {
            chatDisplayName = currentUserName + " (You)"; // Chat with self
            avatar = getUserAvatarFromCache(currentUserExternalId) || './icons/user.png';
        }
    } else if (chat.isGroupChat && !chat.chatName) {
        chatDisplayName = "Unnamed Group";
    }

    const lastMessage = chat.lastMessage || { senderName: "", senderExternalId: null, message: "No messages yet.", createdAt: chat.updatedAt };
    const senderPrefix = lastMessage.senderExternalId === currentUserExternalId ? "You: " : (lastMessage.senderName ? `${lastMessage.senderName}: ` : "");
    const lastMessageText = `${senderPrefix}${truncateText(lastMessage.message, 30)}`;
    const lastMessageTimestamp = formatTimestamp(lastMessage.createdAt, true);

    item.innerHTML = `
        <img src="${avatar}" alt="${escapeHTML(chatDisplayName)}" class="chat-avatar">
        <div class="chat-item-details">
            <span class="chat-name">${escapeHTML(chatDisplayName)}</span>
            <span class="chat-last-message">${escapeHTML(lastMessageText)}</span>
        </div>
        <div class="chat-item-meta">
            <span class="chat-timestamp">${lastMessageTimestamp}</span>
            ${chat.unreadCount > 0 ? `<span class="unread-count">${chat.unreadCount}</span>` : ''}
        </div>
    `;
    item.addEventListener("click", () => handleChatSelection(chat));
    if (chat._id === activeChatId) item.classList.add("active-chat");
    return item;
}

function getUserAvatarFromCache(userId) {
    const user = allUsersCache.find(u => u.id === userId);
    return user ? user.avatarUrl : null;
}

function showChatListEmptyPlaceholder(show) {
    if (chatListEmptyPlaceholder) {
        chatListEmptyPlaceholder.style.display = show ? "flex" : "none";
        chatListItemsContainer.style.display = show ? "none" : "block";
    }
}

async function handleChatSelection(chat) {
    console.log("[APP] handleChatSelection for chat:", chat._id, chat.chatName);
    if (activeChatId === chat._id && chatMessagesArea.innerHTML !== "" && !chatMessagesArea.querySelector('.loading-messages')) {
      console.log("[APP] Chat already selected and loaded.");
      messageInput.focus();
      return;
    }

    if (socket && socket.connected && activeChatId) {
        console.log("[APP SOCKET] Leaving previous chat room:", activeChatId);
        socket.emit('leaveChat', activeChatId);
    }

    activeChatId = chat._id;
    currentActiveChatObject = chat;
    console.log("[APP] New activeChatId:", activeChatId);
    console.log("[APP] New currentActiveChatObject:", currentActiveChatObject);


    document.querySelectorAll(".chat-list-item.active-chat").forEach(el => el.classList.remove("active-chat"));
    const selectedChatItem = chatListItemsContainer.querySelector(`[data-chat-id="${chat._id}"]`);
    if (selectedChatItem) {
        selectedChatItem.classList.add("active-chat");
        const unreadEl = selectedChatItem.querySelector('.unread-count');
        if (unreadEl) unreadEl.remove();
    }

    updateChatHeader(chat);
    chatMessagesArea.innerHTML = '<div class="loading-messages" style="text-align:center; padding:20px; color:#777;">Loading messages...</div>';

    const messages = await fetch_chat_messages(chat._id);
    renderMessages(messages);

    if (socket && socket.connected) {
        console.log("[APP SOCKET] Joining new chat room:", activeChatId);
        socket.emit('joinChat', activeChatId);
    }

    if (window.innerWidth <= 768 && chatListEl.classList.contains("chat-list-open")) {
        chatListEl.classList.remove("chat-list-open");
    }
    messageInput.focus();
}

function updateChatHeader(chat) {
    console.log("[APP] updateChatHeader for chat:", chat);
    let chatDisplayName = chat.chatName;
    if (!chat.isGroupChat && chat.participants && chat.participants.length > 0) {
        const otherParticipant = chat.participants.find(p => p.externalId !== currentUserExternalId);
        chatDisplayName = otherParticipant ? (otherParticipant.name || "Chat Partner") : (currentUserName + " (You)");
    } else if (chat.isGroupChat && !chat.chatName) {
         chatDisplayName = "Unnamed Group";
    }
    currentChatNameEl.textContent = escapeHTML(chatDisplayName);

    currentChatParticipantsEl.innerHTML = "";
    if (chat.participants) {
        chat.participants.forEach(p => {
            const userFromCache = allUsersCache.find(u => u.id === p.externalId);
            const avatar = userFromCache ? userFromCache.avatarUrl : (p.avatarUrl || './icons/user.png');
            const name = userFromCache ? userFromCache.name : (p.name || "User");

            const img = document.createElement("img");
            img.src = avatar;
            img.alt = escapeHTML(name);
            img.title = escapeHTML(name);
            img.classList.add("participant-avatar");
            currentChatParticipantsEl.appendChild(img);
        });
    }
}

function updateChatListWithNewMessage(messageData) {
    console.log("[APP] updateChatListWithNewMessage, messageData:", messageData);
    let chatItem = chatListItemsContainer.querySelector(`[data-chat-id="${messageData.chatId}"]`);

    if (chatItem) {
        const lastMessageEl = chatItem.querySelector('.chat-last-message');
        const timestampEl = chatItem.querySelector('.chat-timestamp');
        const senderName = messageData.senderExternalId === currentUserExternalId ? "You" : (messageData.username || "User");
        if (lastMessageEl) lastMessageEl.textContent = escapeHTML(`${senderName}: ${truncateText(messageData.message, 30)}`);
        if (timestampEl) timestampEl.textContent = formatTimestamp(messageData.createdAt, true);

        chatListItemsContainer.prepend(chatItem);

        if (messageData.chatId !== activeChatId && messageData.senderExternalId !== currentUserExternalId) {
            let unreadCountEl = chatItem.querySelector('.unread-count');
            if (!unreadCountEl) {
                unreadCountEl = document.createElement('span');
                unreadCountEl.classList.add('unread-count');
                chatItem.querySelector('.chat-item-meta').appendChild(unreadCountEl);
            }
            unreadCountEl.textContent = (parseInt(unreadCountEl.textContent || '0') + 1).toString();
        }
    } else {
        console.log("[APP] New message for a chat not in the list. Re-fetching chats.");
        fetch_my_chats().then(renderChatList);
    }
}

// --- Message Area ---
function renderMessages(messages) {
    console.log("[APP] renderMessages, count:", messages ? messages.length : 0);
    chatMessagesArea.innerHTML = "";
    if (!messages || messages.length === 0) {
        chatMessagesArea.innerHTML = '<div class="no-messages-placeholder" style="text-align:center; padding:20px; color:#777;">No messages in this chat yet. Send one!</div>';
        return;
    }
    messages.forEach(msg => appendMessageToUI(msg));
    scrollToBottom(chatMessagesArea);
}

function appendMessageToUI(msg) {
    // console.log("[APP] appendMessageToUI:", msg); // Can be noisy
    const noMessagesPlaceholder = chatMessagesArea.querySelector('.no-messages-placeholder');
    if (noMessagesPlaceholder) noMessagesPlaceholder.remove();
    clearTypingIndicator(msg.chatId, msg.senderExternalId);

    const item = document.createElement("div");
    item.classList.add("message-item");
    const isSent = msg.senderExternalId === currentUserExternalId;
    item.classList.add(isSent ? "sent" : "received");

    const senderNameHTML = (!isSent && currentActiveChatObject && currentActiveChatObject.isGroupChat)
        ? `<span class="message-sender-name">${escapeHTML(msg.username || 'User')}</span>`
        : "";

    item.innerHTML = `
        <div class="message-content">
            ${senderNameHTML}
            <div class="message-bubble">
                <p>${escapeHTML(msg.message).replace(/\n/g, '<br>')}</p>
            </div>
            <span class="message-timestamp">${formatTimestamp(msg.createdAt)}</span>
        </div>
    `;
    chatMessagesArea.appendChild(item);
    scrollToBottom(chatMessagesArea);
}

function handleSendMessage() {
    console.log("[APP] handleSendMessage triggered");
    const messageText = messageInput.value.trim();
    console.log("  Message Text:", `"${messageText}"`);
    console.log("  Active Chat ID:", activeChatId);
    console.log("  Socket Exists:", !!socket); // Crucial check
    if (socket) {
        console.log("  Socket Connected:", socket.connected);
    }
    console.log("  Current User External ID:", currentUserExternalId);


    if (!messageText || !activeChatId || !socket || !socket.connected || !currentUserExternalId) {
        console.warn("[APP] handleSendMessage: Exiting early due to conditions.");
        if (!messageText) console.warn("  Reason: messageText is empty.");
        if (!activeChatId) console.warn("  Reason: activeChatId is null or undefined.");
        if (!currentUserExternalId) console.warn("  Reason: currentUserExternalId is null or undefined.");
        if (!socket) console.warn("  Reason: socket is not initialized or io() failed."); // Modified log
        if (socket && !socket.connected) console.warn("  Reason: socket is not connected.");
        return;
    }

    const messagePayload = {
        chatId: activeChatId,
        senderExternalId: currentUserExternalId,
        message: messageText,
    };
    console.log("[APP SOCKET] Emitting 'sendMessage' with payload:", messagePayload);
    socket.emit("sendMessage", messagePayload);

    messageInput.value = "";
    messageInput.style.height = 'auto';
    if (socket && socket.connected) {
      socket.emit('typing', { chatId: activeChatId, isTyping: false, externalUserId: currentUserExternalId });
    }
    messageInput.focus();
}

function handleTyping() {
    if (!activeChatId || !socket || !socket.connected) return;
    messageInput.style.height = 'auto';
    messageInput.style.height = (messageInput.scrollHeight) + 'px';

    socket.emit('typing', {
        chatId: activeChatId,
        isTyping: messageInput.value.length > 0,
        externalUserId: currentUserExternalId
    });
}

// --- Typing Indicators ---
function showTypingIndicator(typingData) {
    const indicatorId = `typing-${typingData.chatId}-${typingData.externalUserId}`;
    let typingIndicatorEl = chatMessagesArea.querySelector(`#${indicatorId}`);

    if (!typingIndicatorEl) {
        typingIndicatorEl = document.createElement('div');
        typingIndicatorEl.id = indicatorId;
        typingIndicatorEl.classList.add('message-item', 'received', 'typing-indicator');
        const senderName = escapeHTML(typingData.username || 'Someone');
        typingIndicatorEl.innerHTML = `
            <div class="message-content">
                <span class="message-sender-name">${senderName} is typing</span>
                <div class="message-bubble">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        chatMessagesArea.appendChild(typingIndicatorEl);
        scrollToBottom(chatMessagesArea);
    }

    if (typingTimers[indicatorId]) clearTimeout(typingTimers[indicatorId]);
    typingTimers[indicatorId] = setTimeout(() => {
        clearTypingIndicator(typingData.chatId, typingData.externalUserId);
    }, 3000);
}

function clearTypingIndicator(chatId, userId) {
    const indicatorId = `typing-${chatId}-${userId}`;
    const typingIndicatorEl = chatMessagesArea.querySelector(`#${indicatorId}`);
    if (typingIndicatorEl) typingIndicatorEl.remove();
    if (typingTimers[indicatorId]) {
        clearTimeout(typingTimers[indicatorId]);
        delete typingTimers[indicatorId];
    }
}

// --- "Add New Chat" Modal ---
function openNewChatModal() {
    console.log("[APP] openNewChatModal called");
    addChatModalOverlay.style.display = "flex";
    newGroupNameInput.value = "";
    searchUsersForNewChatInput.value = "";
    newChatSelectedUsersIconsEl.innerHTML = "";
    selectedUsersForNewChat = [];
    confirmNewChatBtn.disabled = true;
    renderUserListForNewChat(allUsersCache.filter(u => u.id !== currentUserExternalId));
}

function closeNewChatModal() {
    console.log("[APP] closeNewChatModal called");
    addChatModalOverlay.style.display = "none";
}

function handleSearchUsersForNewChat() {
    const searchTerm = searchUsersForNewChatInput.value.toLowerCase().trim();
    const filteredUsers = allUsersCache.filter(user =>
        user.id !== currentUserExternalId &&
        user.name.toLowerCase().includes(searchTerm)
    );
    renderUserListForNewChat(filteredUsers);
}

function renderUserListForNewChat(users) {
    newUserSearchResultsContainer.innerHTML = "";
    if (users.length === 0) {
        const message = searchUsersForNewChatInput.value.trim()
            ? `No users found matching "${escapeHTML(searchUsersForNewChatInput.value)}".`
            : (allUsersCache.length <= 1 ? "No other users available to chat." : "Search for users to add.");
        newUserSearchResultsContainer.innerHTML = `<p class="no-users-found">${message}</p>`;
        return;
    }

    users.forEach(user => {
        const item = document.createElement("div");
        item.classList.add("user-list-item");
        item.dataset.userId = user.id;
        const isSelected = selectedUsersForNewChat.some(su => su.id === user.id);

        item.innerHTML = `
            <img src="${user.avatarUrl || './icons/user.png'}" alt="${escapeHTML(user.name)}">
            <span>${escapeHTML(user.name)}</span>
            <button class="add-user-btn" ${isSelected ? 'disabled' : ''}>${isSelected ? 'Added' : 'Add'}</button>
        `;
        item.querySelector(".add-user-btn").addEventListener("click", (e) => toggleUserSelectionForNewChat(user, e.currentTarget));
        newUserSearchResultsContainer.appendChild(item);
    });
}

function toggleUserSelectionForNewChat(user, button) {
    const index = selectedUsersForNewChat.findIndex(su => su.id === user.id);
    if (index > -1) {
        selectedUsersForNewChat.splice(index, 1);
        button.disabled = false;
        button.textContent = "Add";
    } else {
        selectedUsersForNewChat.push(user);
        button.disabled = true;
        button.textContent = "Added";
    }
    renderSelectedUserIcons();
    confirmNewChatBtn.disabled = selectedUsersForNewChat.length === 0;
    console.log("[APP] Selected users for new chat:", selectedUsersForNewChat);
}

function renderSelectedUserIcons() {
    newChatSelectedUsersIconsEl.innerHTML = "";
    selectedUsersForNewChat.forEach(user => {
        const img = document.createElement("img");
        img.src = user.avatarUrl || './icons/user.png';
        img.alt = escapeHTML(user.name);
        img.title = escapeHTML(user.name);
        newChatSelectedUsersIconsEl.appendChild(img);
    });
}

async function handleCreateNewChat() {
    console.log("[APP] handleCreateNewChat called");
    const groupNameInputVal = newGroupNameInput.value.trim();
    let participantExternalIds = selectedUsersForNewChat.map(u => u.id);

    if (participantExternalIds.length === 0) {
        alert("Please select at least one user to chat with.");
        return;
    }

    if (!participantExternalIds.includes(currentUserExternalId)) {
         participantExternalIds.push(currentUserExternalId);
    }
    console.log("[APP] Final participant IDs for new chat:", participantExternalIds);


    let chatNameForApi = null;
    let creatorIdForApi = null;

    const isEffectivelyGroup = participantExternalIds.length > 2 ||
                               (participantExternalIds.length === 2 && groupNameInputVal) ||
                               (participantExternalIds.length === 1 && participantExternalIds[0] === currentUserExternalId);

    if (isEffectivelyGroup) {
        chatNameForApi = groupNameInputVal || `Group with ${selectedUsersForNewChat.map(u => u.firstName).slice(0,2).join(', ')}`;
        if(participantExternalIds.length === 1 && participantExternalIds[0] === currentUserExternalId && !groupNameInputVal) {
            chatNameForApi = "My Notes";
        }
        creatorIdForApi = currentUserExternalId;
    }
    console.log("[APP] Creating chat with name:", chatNameForApi, "and creator:", creatorIdForApi);


    confirmNewChatBtn.disabled = true;
    confirmNewChatBtn.textContent = "Creating...";

    const result = await create_new_chat(participantExternalIds, chatNameForApi, creatorIdForApi);
    console.log("[APP] Create new chat API result:", result);


    confirmNewChatBtn.disabled = selectedUsersForNewChat.length === 0;
    confirmNewChatBtn.textContent = "Create Chat";

    if (result && result.chat) {
        closeNewChatModal();
        const existingChatItem = chatListItemsContainer.querySelector(`[data-chat-id="${result.chat._id}"]`);
        if (existingChatItem) {
            chatListItemsContainer.prepend(existingChatItem);
        } else {
            const chatItemElement = createChatItemElement(result.chat);
            chatListItemsContainer.prepend(chatItemElement);
            showChatListEmptyPlaceholder(false);
        }
        handleChatSelection(result.chat);
    } else {
        console.error("[APP] Failed to create or retrieve chat from API after create_new_chat call.");
    }
}

// --- Utility ---
function scrollToBottom(element) {
    if (element) element.scrollTop = element.scrollHeight;
}

function formatTimestamp(isoString, short = false) {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            // console.warn("Invalid date string for timestamp:", isoString);
            return "Invalid Date";
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (short) {
            if (date.toDateString() === today.toDateString()) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            } else if (date.toDateString() === yesterday.toDateString()) {
                return "Yesterday";
            } else {
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
    } catch (e) {
        console.error("Error formatting timestamp:", e, "Input:", isoString);
        return "Time N/A";
    }
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, "&") // Corrected HTML entity for ampersand
        .replace(/</g, "<")
        .replace(/>/g, ">"); // Added for single quotes (apostrophe)
}

function truncateText(text, maxLength) {
    if (!text) return "";
    text = String(text);
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
}