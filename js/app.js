// WebLabs/js/app.js
// For index.html (Student List Page)

import {
    burger_menu,
    open_delete_modal,
    open_edit_modal,
    open_add_modal,
    initialize_add_form,
    initialize_edit_form,
    initialize_delete_modal,
    update_buttons,
    close_modal
} from "./button.js";

import { update_table_cb, setup_cb_listeners } from "./checkbox.js";
import { update_table } from "./data_process.js";
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

    // --- Page-specific initializations for index.html (Student List) ---
    if (currentPagePath === 'index.html' || currentPagePath === '') {
        console.log("Initializing student page (index.html via app.js)");

        const mainCb = document.getElementById("main_cb");
        if (mainCb) mainCb.addEventListener("click", function() { update_table_cb(mainCb); });

        setup_cb_listeners();

        // Event listeners for static buttons or for initial load.
        // Dynamically added buttons within update_table should have listeners attached there (in data_process.js)
        document.querySelectorAll('.edit-but').forEach(btn => btn.addEventListener('click', open_edit_modal));
        document.querySelectorAll('.delete-but').forEach(btn => btn.addEventListener('click', open_delete_modal));

        const addBtn = document.getElementById('add-but');
        if (addBtn) addBtn.addEventListener('click', open_add_modal);

        initialize_add_form();
        initialize_edit_form();
        initialize_delete_modal();
        update_buttons();

        await update_table(1);
    }

    // --- Common Modal Close Buttons ---
    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', close_modal));
    document.querySelectorAll('.cancel-but').forEach(btn => btn.addEventListener('click', close_modal));

});