// WebLabs/js/app.js
// For index.html (Student List Page)

import {
    burger_menu,
    close_modal
} from "./button.js";

import { logout } from "./api_connector.js";

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
        // TODO: Bell notification dropdown toggle logic if needed on this page
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
        });
    }

    if (cancelNewChatBtn && addChatModalOverlay) {
        cancelNewChatBtn.addEventListener('click', () => {
            addChatModalOverlay.style.display = 'none';
        });
    }

    // Chat list mobile toggle functionality
    const chatListToggleBtn = document.querySelector('.chat-list-toggle-btn');
    const closeChatListBtn = document.getElementById('closeChatListBtn');
    const chatList = document.querySelector('.chat-list');

    function toggleChatList() {
        if (chatList) {
            chatList.classList.toggle('show-mobile');
        }
    }

    function closeChatList() {
        if (chatList) {
            chatList.classList.remove('show-mobile');
        }
    }

    if (chatListToggleBtn) {
        chatListToggleBtn.addEventListener('click', toggleChatList);
    }

    if (closeChatListBtn) {
        closeChatListBtn.addEventListener('click', closeChatList);
    }

    // Close chat list when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) { // Only on mobile
            const isClickInsideChatList = chatList?.contains(e.target);
            const isClickOnToggleBtn = chatListToggleBtn?.contains(e.target);
            
            if (!isClickInsideChatList && !isClickOnToggleBtn && chatList?.classList.contains('show-mobile')) {
                closeChatList();
            }
        }
    });

});