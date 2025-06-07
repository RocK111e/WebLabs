// WebLabs/js/app.js
// For index.html (Student List Page)

import {
    burger_menu,
    close_modal
} from "./button.js";

import { 
    logout, 
    fetch_my_chats, 
    fetch_all_students, 
    create_chat,
    fetch_chat_messages,
    send_message as send_message_http,
} from "./api_connector.js";
import ChatSocket from './sockets.js';
import { 
    processStatusData, 
    updateUserStatus as updateStatusInMap, 
    isUserOnline 
} from './data_process.js';

// Global state
let selectedStudents = new Set();
let chatSocket;
let statusMap = {};

// Cache for participant statuses
let participantStatusCache = new Map();
let allStudentsCache = null;

// Chat list functionality
function toggleChatList(chatList) {
    if (chatList) {
        chatList.classList.toggle('show-mobile');
    }
}

function closeChatList(chatList) {
    if (chatList) {
        chatList.classList.remove('show-mobile');
    }
}

// Student selection functionality
function updateConfirmButtonState(confirmButton) {
    if (confirmButton) {
        const groupNameInput = document.getElementById('newGroupNameInput');
        const hasGroupName = groupNameInput && groupNameInput.value.trim() !== '';
        const hasSelectedStudents = selectedStudents.size > 0;
        confirmButton.disabled = !hasGroupName || !hasSelectedStudents;
    }
}

function addSelectedStudentAvatar(student, selectedAvatarsContainer) {
    const avatarElement = document.createElement('div');
    avatarElement.className = 'selected-student-avatar';
    avatarElement.innerHTML = `
        <img src="${student.avatarUrl || './icons/user.png'}" alt="${student.name} ${student.surname}">
        <div class="tooltip">${student.name} ${student.surname}</div>
    `;

    selectedAvatarsContainer.appendChild(avatarElement);
}

function displayStudentSearchResults(students, studentsList, selectedAvatarsContainer) {
    if (!studentsList) return;

    if (students.length === 0) {
        studentsList.innerHTML = '<div class="student-list-item">No students found</div>';
        return;
    }

    studentsList.innerHTML = students.map(student => `
        <div class="student-list-item ${selectedStudents.has(student.id) ? 'selected' : ''}" 
             data-student-id="${student.id}">
            <img src="${student.avatarUrl}" alt="${student.name}">
            <div class="student-info">
                <div class="student-name">${student.name} ${student.surname}</div>
                <div class="student-group">${student.group}</div>
            </div>
        </div>
    `).join('');

    // Add click handlers for student selection
    studentsList.querySelectorAll('.student-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const studentId = item.dataset.studentId;
            const student = students.find(s => s.id === studentId);
            
            if (!student) return;

            if (selectedStudents.has(studentId)) {
                // Deselect student
                selectedStudents.delete(studentId);
                item.classList.remove('selected');
                document.querySelector(`[data-student-id="${studentId}"]`)?.remove();
            } else {
                // Select student
                selectedStudents.add(studentId);
                item.classList.add('selected');
                addSelectedStudentAvatar(student, selectedAvatarsContainer);
            }

            updateConfirmButtonState(document.getElementById('confirmNewChatBtn'));
        });
    });
}

async function initializeStudentSelection() {
    const searchInput = document.getElementById('searchStudentsInput');
    const studentsList = document.getElementById('studentsSearchResults');
    const selectedAvatarsContainer = document.getElementById('selectedStudentsAvatars');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const searchTerm = e.target.value.trim();
            const students = await searchStudents(searchTerm);
            displayStudentSearchResults(students, studentsList, selectedAvatarsContainer);
        }, 300));
    }
}

function resetStudentSelection() {
    selectedStudents.clear();
    const selectedAvatarsContainer = document.getElementById('selectedStudentsAvatars');
    if (selectedAvatarsContainer) {
        selectedAvatarsContainer.innerHTML = '';
    }
    const confirmButton = document.getElementById('confirmNewChatBtn');
    if (confirmButton) {
        confirmButton.disabled = true;
    }
}

async function loadAndDisplayChats() {
    const chatListItems = document.querySelector('.chat-list-items');
    const chatListEmpty = document.querySelector('.chat-list-empty-placeholder');
    const chats = await fetch_my_chats();
    console.log('Fetched chats:', chats);
    
    if (chats && chats.length > 0) {
        chatListItems.style.display = 'block';
        chatListEmpty.style.display = 'none';
        
        chatListItems.innerHTML = chats.map(chat => {
            console.log('Processing chat:', chat);
            return `
                <div class="chat-list-item" 
                     data-chat-id="${chat._id}"
                     data-participants='${JSON.stringify(chat.userIds || [])}'>
                    <div class="chat-item-details">
                        <div class="chat-name">${chat.chatName || 'Unnamed Chat'}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers for chat items
        document.querySelectorAll('.chat-list-item').forEach(item => {
            item.addEventListener('click', async () => {
                const chatId = item.dataset.chatId;
                const participants = JSON.parse(item.dataset.participants || '[]');
                
                // Remove active class from all chat items
                document.querySelectorAll('.chat-list-item').forEach(i => i.classList.remove('active-chat'));
                // Add active class to selected chat
                item.classList.add('active-chat');
                
                // Update chat header with chat name and participants
                const chatName = item.querySelector('.chat-name').textContent;
                const chatHeader = document.querySelector('.chat-header');
                
                // Create chat header structure if it doesn't exist
                if (!chatHeader.querySelector('.chat-header-info')) {
                    chatHeader.innerHTML = `
                        <button class="chat-list-toggle-btn">☰</button>
                        <div class="chat-header-info">
                            <div class="chat-header-name"></div>
                            <div class="chat-header-participants"></div>
                        </div>
                    `;
                }
                
                // Update chat name and participants
                const chatHeaderName = chatHeader.querySelector('.chat-header-name');
                chatHeaderName.textContent = chatName;
                
                // Fetch initial participant status when entering chat
                await fetchParticipantStatus(chatId);
                
                // Load messages for the selected chat
                await loadChatMessages(chatId);
                
                // On mobile, close the chat list after selection
                const chatList = document.querySelector('.chat-list');
                if (window.innerWidth <= 768) {
                    closeChatList(chatList);
                }
            });
        });
    } else {
        chatListItems.style.display = 'none';
        chatListEmpty.style.display = 'block';
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Replace mock searchStudents function with actual API call
async function searchStudents(searchTerm) {
    const students = await fetch_all_students();
    if (!students) return [];
    
    return students.map(student => ({
        id: student.id,
        name: student.Name,
        surname: student.Surname,
        group: student.Group,
        avatarUrl: student.avatarUrl || './icons/user.png'
    })).filter(student => 
        `${student.name} ${student.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
}

async function handleCreateChat() {
    const groupNameInput = document.getElementById('newGroupNameInput');
    const chatName = groupNameInput.value.trim();
    const userIds = Array.from(selectedStudents);
    const creatorExternalId = sessionStorage.getItem('userExternalId');

    if (!chatName || userIds.length === 0) {
        console.warn('Cannot create chat: missing name or participants');
        return;
    }

    const result = await create_chat(chatName, userIds);
    if (result) {
        // Close the modal and reset selection
        const addChatModalOverlay = document.getElementById('addChatModalOverlay');
        addChatModalOverlay.style.display = 'none';
        resetStudentSelection();
        groupNameInput.value = '';

        // Refresh the chat list
        await loadAndDisplayChats();
    } else {
        alert('Failed to create chat. Please try again.');
    }
}

// Function to send a message
function sendMessage(message, chatId) {
    console.log('Attempting to send message:', { message, chatId });
    
    if (!message.trim() || !chatId) {
        console.log('Message or chatId is empty, aborting send');
        return;
    }

    console.log('Socket state:', { 
        socketExists: !!chatSocket,
        isConnected: chatSocket?.isConnected,
        socket: chatSocket?.socket
    });

    if (chatSocket && chatSocket.isConnected) {
        const userExternalId = sessionStorage.getItem('userExternalId');
        const username = sessionStorage.getItem('userDisplayName') || 'User';
        
        console.log('Sending message with:', { userExternalId, username });
        const result = chatSocket.sendMessage(chatId, message, username, userExternalId);
        
        // If the message was sent successfully through the socket
        if (result) {
            // Clear the input field
            const messageInput = document.querySelector('.message-input');
            if (messageInput) {
                messageInput.value = '';
            }
            
            // We'll let the socket server echo back our message instead of appending it immediately
            // This ensures consistency and prevents duplicates
        } else {
            console.error('Failed to send message through socket');
            alert('Failed to send message. Please try again.');
        }
    } else {
        console.error('Socket not connected. Cannot send message.', {
            socketExists: !!chatSocket,
            isConnected: chatSocket?.isConnected
        });
        alert('Connection error. Please try again.');
    }
}

// Function to append a new message to the chat
function appendMessage(data) {
    const messagesArea = document.querySelector('.chat-messages-area');
    if (!messagesArea) return;

    const currentUserId = sessionStorage.getItem('userExternalId')?.toString();
    const isOwnMessage = data.userId === currentUserId;
    
    console.log('Appending message:', {
        messageUserId: data.userId,
        currentUserId: currentUserId,
        isOwnMessage: isOwnMessage
    });
    
    // Create message container with alignment
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${isOwnMessage ? 'own-container' : ''}`;
    messageContainer.style.display = 'flex';
    messageContainer.style.justifyContent = isOwnMessage ? 'flex-end' : 'flex-start';
    messageContainer.style.width = '100%';
    messageContainer.style.marginBottom = '10px';
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = isOwnMessage ? 'message own-message' : 'message';
    messageElement.style.maxWidth = '70%';
    
    // Create message content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = data.message;
    messageContent.style.backgroundColor = isOwnMessage ? '#6c757d' : '#e9ecef';
    messageContent.style.color = isOwnMessage ? 'white' : 'black';
    messageContent.style.padding = '10px 15px';
    messageContent.style.borderRadius = '15px';
    messageContent.style.marginBottom = '5px';
    
    // Create message info
    const messageInfo = document.createElement('div');
    messageInfo.className = 'message-info';
    messageInfo.style.display = 'flex';
    messageInfo.style.gap = '8px';
    messageInfo.style.fontSize = '0.9em';
    messageInfo.style.justifyContent = isOwnMessage ? 'flex-end' : 'flex-start';
    
    const senderName = document.createElement('span');
    senderName.className = 'message-sender';
    senderName.textContent = isOwnMessage ? 'You' : data.username;
    senderName.style.color = 'black';
    senderName.style.fontWeight = '500';
    
    const timestamp = document.createElement('span');
    timestamp.className = 'message-time';
    timestamp.textContent = data.timestamp.toLocaleTimeString([], { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    timestamp.style.color = '#6c757d';
    
    // Assemble message info based on message ownership
    if (isOwnMessage) {
        messageInfo.appendChild(timestamp);
        messageInfo.appendChild(senderName);
    } else {
        messageInfo.appendChild(senderName);
        messageInfo.appendChild(timestamp);
    }
    
    // Assemble message
    messageElement.appendChild(messageContent);
    messageElement.appendChild(messageInfo);
    messageContainer.appendChild(messageElement);
    
    // Add to messages area
    messagesArea.appendChild(messageContainer);
    
    // Scroll to the new message
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function loadChatMessages(chatId) {
    const messagesArea = document.querySelector('.chat-messages-area');
    if (!messagesArea || !chatId) return;

    try {
        const currentUserId = sessionStorage.getItem('userExternalId');
        console.log('Current user ID:', currentUserId);
        
        // Show loading state
        messagesArea.innerHTML = '<div class="loading-messages">Loading messages...</div>';
        
        // Get the current chat's data from the chat list
        const currentChat = Array.from(document.querySelectorAll('.chat-list-item'))
            .find(item => item.dataset.chatId === chatId);
            
        if (!currentChat) {
            console.error('Could not find chat data for:', chatId);
            return;
        }
        
        // Fetch messages
        const messages = await fetch_chat_messages(chatId);
        console.log('Fetched messages:', messages);
        
        // Clear loading state
        messagesArea.innerHTML = '';
        
        // Display messages
        messages.forEach(msg => {
            console.log('Processing message:', msg);
            console.log('Message sender ID:', msg.userId, 'Current user ID:', currentUserId);
            
            const messageData = {
                chatId,
                message: msg.message,
                username: msg.username || 'Unknown User',
                userId: msg.userId?.toString(),
                timestamp: new Date(msg.createdAt)
            };
            appendMessage(messageData);
        });
        
        // Scroll to the bottom of messages
        messagesArea.scrollTop = messagesArea.scrollHeight;
        
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesArea.innerHTML = '<div class="error-message">Failed to load messages. Please try again.</div>';
    }
}

// Initialize everything when the DOM is loaded
document.addEventListener("DOMContentLoaded", async function() {
    const currentPagePath = window.location.pathname.split("/").pop() || "index.html";

    // --- Common Header/UI Initialization ---
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

    // Initialize bell notification state
    const redBall = document.querySelector('.red-ball');
    if (redBall) {
        redBall.style.display = 'none';
    }

    // Clear existing notifications
    const bellNotifications = document.querySelector('.bell-notifications');
    if (bellNotifications) {
        bellNotifications.innerHTML = '';
    }

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

    // --- Common Modal Close Buttons ---
    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', close_modal));
    document.querySelectorAll('.cancel-but').forEach(btn => btn.addEventListener('click', close_modal));

    // --- Chat-specific Event Listeners ---
    const addChatModalOverlay = document.getElementById('addChatModalOverlay');
    const openAddChatModalBtn = document.getElementById('openAddChatModalBtn');
    const closeAddChatModalBtn = document.getElementById('closeAddChatModalBtn');
    const cancelNewChatBtn = document.getElementById('cancelNewChatBtn');

    // New chat modal controls
    if (openAddChatModalBtn && addChatModalOverlay) {
        openAddChatModalBtn.addEventListener('click', () => {
            addChatModalOverlay.style.display = 'flex';
        });
    }

    if (closeAddChatModalBtn && addChatModalOverlay) {
        closeAddChatModalBtn.addEventListener('click', () => {
            addChatModalOverlay.style.display = 'none';
            resetStudentSelection();
        });
    }

    if (cancelNewChatBtn && addChatModalOverlay) {
        cancelNewChatBtn.addEventListener('click', () => {
            addChatModalOverlay.style.display = 'none';
            resetStudentSelection();
        });
    }

    // Add confirm button click handler
    const confirmNewChatBtn = document.getElementById('confirmNewChatBtn');
    if (confirmNewChatBtn) {
        confirmNewChatBtn.addEventListener('click', async () => {
            // Show loading state
            confirmNewChatBtn.disabled = true;
            confirmNewChatBtn.textContent = 'Creating...';
            
            try {
                await handleCreateChat();
            } catch (error) {
                console.error('Error creating chat:', error);
                alert('Failed to create chat. Please try again.');
            } finally {
                // Reset button state
                confirmNewChatBtn.disabled = false;
                confirmNewChatBtn.textContent = 'Create Chat';
            }
        });
    }

    // Load chats when the page loads
    await loadAndDisplayChats();

    // Chat list mobile toggle functionality
    const chatListToggleBtn = document.querySelector('.chat-list-toggle-btn');
    const closeChatListBtn = document.getElementById('closeChatListBtn');
    const chatList = document.querySelector('.chat-list');

    if (chatListToggleBtn) {
        chatListToggleBtn.addEventListener('click', () => toggleChatList(chatList));
    }

    if (closeChatListBtn) {
        closeChatListBtn.addEventListener('click', () => closeChatList(chatList));
    }

    // Close chat list when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) { // Only on mobile
            const isClickInsideChatList = chatList?.contains(e.target);
            const isClickOnToggleBtn = chatListToggleBtn?.contains(e.target);
            
            if (!isClickInsideChatList && !isClickOnToggleBtn && chatList?.classList.contains('show-mobile')) {
                closeChatList(chatList);
            }
        }
    });

    // Initialize student selection
    await initializeStudentSelection();

    // Add group name input listener
    const groupNameInput = document.getElementById('newGroupNameInput');
    if (groupNameInput) {
        groupNameInput.addEventListener('input', () => {
            updateConfirmButtonState(document.getElementById('confirmNewChatBtn'));
        });
    }

    // Initialize socket connection without notification support
    initializeSocket();

    // Add message input event listeners
    const messageInput = document.querySelector('.message-input');
    const sendMessageBtn = document.querySelector('.send-message-btn');

    if (messageInput && sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            const currentChatId = getCurrentChatId();
            if (!currentChatId) return;

            const message = messageInput.value.trim();
            if (message) {
                sendMessage(message, currentChatId);
                messageInput.value = '';
            }
        });

        // Handle Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessageBtn.click();
            }
        });
    }
});

// Helper function to get current chat ID
function getCurrentChatId() {
    // TODO: Implement this function to return the ID of the currently selected chat
    const activeChatElement = document.querySelector('.chat-list-item.active-chat');
    return activeChatElement ? activeChatElement.dataset.chatId : null;
}

// Function to update user status in the UI
function updateUserStatus(userId, status) {
    console.log('Updating status for user:', userId, 'to:', status);
    // Convert userId to string for consistent comparison
    userId = userId.toString();
    
    const participantElement = document.querySelector(`[data-participant-id="${userId}"]`);
    console.log('Found participant element:', participantElement);
    
    if (participantElement) {
        const currentUserId = sessionStorage.getItem('userExternalId').toString();
        // If this is the current user, always show as online
        if (userId === currentUserId) {
            status = 'online';
        }
        
        console.log('Applying status class:', `user-${status}`);
        // Remove existing status classes
        participantElement.classList.remove('user-online', 'user-offline');
        // Add new status class
        participantElement.classList.add(`user-${status}`);
    }
}

// Fetch initial participant status
async function fetchParticipantStatus(chatId) {
    try {
        // Get all students data if not cached
        if (!allStudentsCache) {
            allStudentsCache = await fetch_all_students();
        }
        
        if (!allStudentsCache) {
            console.log('Could not fetch students data');
            return null;
        }

        console.log('Processing students data for status:', allStudentsCache);
        
        // Update cache with received statuses
        allStudentsCache.forEach(student => {
            const userId = student.id.toString();
            // Current user is always online
            const isOnline = userId === sessionStorage.getItem('userExternalId') || student.isOnline;
            console.log('Caching status:', { userId, isOnline });
            participantStatusCache.set(userId, isOnline);
        });
        
        // Update UI with new statuses
        updateParticipantsWithStatus();
        
        return allStudentsCache;
    } catch (error) {
        console.error('Error in fetchParticipantStatus:', error);
        return null;
    }
}

// Update single participant status
function updateParticipantStatus(userId, isOnline) {
    userId = userId.toString();
    participantStatusCache.set(userId, isOnline);
    
    // Update the cached student data if it exists
    if (allStudentsCache) {
        const student = allStudentsCache.find(s => s.id.toString() === userId);
        if (student) {
            student.isOnline = isOnline;
        }
    }
    
    const participantElement = document.querySelector(`[data-participant-id="${userId}"]`);
    if (participantElement) {
        // Remove existing status classes
        participantElement.classList.remove('user-online', 'user-offline');
        // Add new status class
        participantElement.classList.add(`user-${isOnline ? 'online' : 'offline'}`);
    }
}

// Update the chat header participants with online status indicators
async function updateParticipantsWithStatus(participants = null) {
    const chatHeaderParticipants = document.querySelector('.chat-header-participants');
    if (!chatHeaderParticipants) return;

    try {
        // If no participants provided, get them from current chat
        if (!participants) {
            const currentChatItem = document.querySelector('.chat-list-item.active-chat');
            if (currentChatItem) {
                participants = JSON.parse(currentChatItem.dataset.participants || '[]');
            } else {
                return;
            }
        }

        // Ensure we have status data
        if (Object.keys(statusMap).length === 0) {
            await initializeStatusData();
        }

        const participantsWithDetails = participants.map(participantId => {
            participantId = participantId.toString();
            const userStatus = statusMap[participantId];
            
            return userStatus ? {
                id: participantId,
                name: userStatus.name,
                surname: userStatus.surname,
                status: userStatus.isOnline ? 'online' : 'offline'
            } : {
                id: participantId,
                name: 'Unknown',
                surname: 'User',
                status: 'offline'
            };
        });

        chatHeaderParticipants.innerHTML = participantsWithDetails.map(participant => `
            <div class="participant-avatar-wrapper user-${participant.status}" data-participant-id="${participant.id}">
                <img src="./icons/user.png" 
                     alt="${participant.name}" 
                     class="participant-avatar">
                <div class="tooltip">${participant.name} ${participant.surname}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating participants:', error);
        chatHeaderParticipants.innerHTML = '';
    }
}

// Bell notification functions
function addBellNotification(senderName, messageText, chatId) {
    const bellNotifications = document.querySelector('.bell-notifications');
    if (!bellNotifications) return;

    // Create new notification item
    const notificationItem = document.createElement('div');
    notificationItem.className = 'notification-item';
    notificationItem.dataset.chatId = chatId;
    notificationItem.style.cursor = 'pointer';
    notificationItem.innerHTML = `
        <img class="notification-icon" src="./icons/user.png" alt="User Icon">
        <div class="notification-content">
            <span class="notification-name">${senderName}</span>
            <span class="notification-message">${messageText}</span>
        </div>
    `;

    // Add click handler to switch to the chat
    notificationItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Switch to the chat
        switchToChat(chatId);
        
        // Remove this notification
        notificationItem.remove();
        
        // Check if there are any notifications left
        if (bellNotifications.children.length === 0) {
            // Hide red dot if no notifications
            const redBall = document.querySelector('.red-ball');
            if (redBall) {
                redBall.style.display = 'none';
            }
        }
    });

    // Add to the top of the notifications list
    bellNotifications.insertBefore(notificationItem, bellNotifications.firstChild);

    // Show red dot
    const redBall = document.querySelector('.red-ball');
    if (redBall) {
        redBall.style.display = 'block';
    }

    // Shake the bell
    const bellWrapper = document.querySelector('.bell-wrapper');
    if (bellWrapper && !bellWrapper.classList.contains('shake')) {
        bellWrapper.classList.add('shake');
        setTimeout(() => {
            bellWrapper.classList.remove('shake');
        }, 600);
    }
}

// Function to switch to a specific chat
function switchToChat(chatId) {
    const chatItem = document.querySelector(`.chat-list-item[data-chat-id="${chatId}"]`);
    if (chatItem) {
        // Remove active class from all chats
        document.querySelectorAll('.chat-list-item').forEach(item => {
            item.classList.remove('active-chat');
        });
        
        // Add active class to selected chat
        chatItem.classList.add('active-chat');
        
        // Update chat header
        const chatName = chatItem.querySelector('.chat-name').textContent;
        const chatHeader = document.querySelector('.chat-header');
        
        // Create chat header structure if it doesn't exist
        if (!chatHeader.querySelector('.chat-header-info')) {
            chatHeader.innerHTML = `
                <button class="chat-list-toggle-btn">☰</button>
                <div class="chat-header-info">
                    <div class="chat-header-name"></div>
                    <div class="chat-header-participants"></div>
                </div>
            `;

            // Re-add event listener for the toggle button
            const chatListToggleBtn = chatHeader.querySelector('.chat-list-toggle-btn');
            const chatList = document.querySelector('.chat-list');
            if (chatListToggleBtn && chatList) {
                chatListToggleBtn.addEventListener('click', () => toggleChatList(chatList));
            }
        }
        
        // Update chat name
        const chatHeaderName = chatHeader.querySelector('.chat-header-name');
        if (chatHeaderName) {
            chatHeaderName.textContent = chatName;
        }
        
        // Fetch and update participant status
        fetchParticipantStatus(chatId);
        
        // Load messages for this chat
        loadChatMessages(chatId);
        
        // On mobile, close the chat list
        const chatList = document.querySelector('.chat-list');
        if (window.innerWidth <= 768) {
            closeChatList(chatList);
        }
    }
}

// Initialize socket connection without notification support
function initializeSocket() {
    const userExternalId = sessionStorage.getItem('userExternalId');
    const username = sessionStorage.getItem('userDisplayName');
    
    console.log('Initializing socket with:', { userExternalId, username });
    
    if (!userExternalId) {
        console.error('User ID not found in session storage');
        return;
    }

    try {
        console.log('Creating new ChatSocket instance');
        chatSocket = new ChatSocket();
        
        // Add connection state change listener
        chatSocket.socket?.on('connect', () => {
            console.log('Socket connected successfully');
        });
        
        chatSocket.socket?.on('disconnect', () => {
            console.log('Socket disconnected');
        });
        
        chatSocket.socket?.on('error', (error) => {
            console.error('Socket error:', error);
        });
        
        console.log('Connecting user to socket');
        chatSocket.connectUser(userExternalId, username);
        
        // Set up message listener with bell notification
        chatSocket.onNewMessage((data) => {
            console.log('New message received:', data);
            const currentChatId = getCurrentChatId();
            const currentUserId = sessionStorage.getItem('userExternalId');
            const senderId = data.sender?.userId || data.message.userId;
            
            // Don't show notification for own messages or if user is in the same chat
            if (senderId !== currentUserId && currentChatId !== data.chatId) {
                const senderName = data.sender?.username || data.message.username || 'Someone';
                const messageText = data.message.message || data.message;
                addBellNotification(senderName, messageText, data.chatId);
            }
            
            // Only handle messages for the currently selected chat
            if (currentChatId === data.chatId) {
                // Extract message data based on the server's response format
                const messageData = {
                    chatId: data.chatId,
                    message: data.message.message || data.message,
                    username: data.sender?.username || data.message.username || data.username,
                    userId: data.sender?.userId || data.message.userId || data.userId,
                    timestamp: new Date(data.message.createdAt || Date.now())
                };
                
                appendMessage(messageData);
            }
        });

        // Set up user status listener
        chatSocket.onUserStatus((data) => {
            const userId = data.userId.toString();
            const isOnline = data.status === 'online';
            
            // Don't update status if it's the current user (they're always online)
            if (userId !== userExternalId) {
                // Update status map and UI
                statusMap = updateStatusInMap(statusMap, userId, isOnline);
                updateParticipantStatusUI(userId);
            }
        });

        // Initialize status data
        initializeStatusData();
        
        console.log('Socket initialization completed');
    } catch (error) {
        console.error('Error during socket initialization:', error);
    }
}

// Initialize status data
async function initializeStatusData() {
    const students = await fetch_all_students();
    if (students) {
        statusMap = processStatusData(students);
        console.log('Initialized status map:', statusMap);
    }
}

// Update single participant status in UI
function updateParticipantStatusUI(userId) {
    userId = userId.toString();
    const isOnline = isUserOnline(statusMap, userId);
    
    const participantElement = document.querySelector(`[data-participant-id="${userId}"]`);
    if (participantElement) {
        // Remove existing status classes
        participantElement.classList.remove('user-online', 'user-offline');
        // Add new status class
        participantElement.classList.add(`user-${isOnline ? 'online' : 'offline'}`);
    }
}