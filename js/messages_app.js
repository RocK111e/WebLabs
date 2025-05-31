// WebLabs/js/messages_app.js

import {
    fetch_my_chats,
    fetch_chat_messages,
    create_new_chat,
    logout,
    fetch_all_students
} from "./api_connector.js";
import { burger_menu } from "./button.js";

document.addEventListener("DOMContentLoaded", async function() {
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
        // --- End Common Header/UI ---

});