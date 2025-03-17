// app.js
import { 
    burger_menu, 
    close_modal,
    open_delete_modal,
    open_edit_modal,
    open_add_modal,
    initialize_add_form,
    initialize_edit_form,
    initialize_delete_modal
} from "./button.js";

import { update_table_cb, setup_cb_listeners } from "./checkbox.js";

document.addEventListener("DOMContentLoaded", function() {
    // Burger menu event listener
    const bur_but = document.getElementById("burger-btn");
    bur_but.addEventListener("click", burger_menu);

    // Checkbox event listeners
    const main_cb = document.getElementById("main_cb");
    main_cb.addEventListener("click", function() {
        update_table_cb(main_cb);
    });

    // Setup listeners for table checkboxes on page load
    setup_cb_listeners();
    
    // Modal buttons event listeners
    document.querySelectorAll('.edit-but').forEach(btn => {
        btn.addEventListener('click', open_edit_modal);
    });

    document.querySelectorAll('.delete-but').forEach(btn => {
        btn.addEventListener('click', open_delete_modal);
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', close_modal);
    });

    document.querySelectorAll('.cancel-but').forEach(btn => {
        btn.addEventListener('click', close_modal);
    });

    const add_btn = document.getElementById('add-but');
    add_btn.addEventListener('click', open_add_modal);
    initialize_add_form();
    initialize_edit_form();
    initialize_delete_modal(); // Initialize delete modal handler
});