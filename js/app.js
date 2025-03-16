import { burger_menu, 
    close_modal,
    open_delete_modal,
    open_edit_modal } from "./button.js";
import { update_table_cb, update_main_cb } from "./checkbox.js";

document.addEventListener("DOMContentLoaded", function() {
    const bur_but = document.getElementById("burger-btn");
    bur_but.addEventListener("click", burger_menu);
    
    const main_cb = document.getElementById("main_cb");
    main_cb.addEventListener("click", function() {
        update_table_cb(main_cb);
    });

    const tableCheckboxes = document.querySelectorAll(".table_cb"); 
    console.log("Found table checkboxes:", tableCheckboxes.length);
    tableCheckboxes.forEach(cb => {
        cb.addEventListener("change", function() {
            update_main_cb();
        });
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-but').forEach(btn => {
        btn.addEventListener('click', open_edit_modal);
    });

    document.querySelectorAll('.delete-but').forEach(btn => {
        btn.addEventListener('click', open_delete_modal);
    });

    // Close modal when clicking outside or on close button
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', close_modal);
    });

});