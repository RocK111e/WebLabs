// WebLabs/js/app.js
// For index.html (Student List Page)

import {
    burger_menu,
    close_modal
} from "./button.js";

import { logout, fetch_my_chats, fetch_all_students } from "./api_connector.js";

// Global state
let selectedStudents = new Set();

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
    
    if (chats && chats.length > 0) {
        chatListItems.style.display = 'block';
        chatListEmpty.style.display = 'none';
        
        chatListItems.innerHTML = chats.map(chat => `
            <div class="chat-list-item" data-chat-id="${chat.id}">
                <img class="chat-avatar" src="${chat.avatarUrl || './icons/group.png'}" alt="Chat Avatar">
                <div class="chat-item-details">
                    <div class="chat-name">${chat.name || 'Unnamed Chat'}</div>
                    <div class="chat-last-message">${chat.lastMessage || 'No messages yet'}</div>
                </div>
                <div class="chat-item-meta">
                    <span class="chat-timestamp">${chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString() : ''}</span>
                    ${chat.unreadCount ? `<span class="unread-count">${chat.unreadCount}</span>` : ''}
                </div>
            </div>
        `).join('');

        // Add click handlers for chat items
        document.querySelectorAll('.chat-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chatId;
                // TODO: Implement chat selection logic
                console.log('Selected chat:', chatId);
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
});