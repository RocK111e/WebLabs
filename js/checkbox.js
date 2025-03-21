import { update_buttons } from "./button.js";

export function update_table_cb(source) {
    let checkboxes = document.querySelectorAll(".table_cb"); 
    console.log("Found checkboxes:", checkboxes.length);
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
    });
    update_buttons();
}

export function update_main_cb() {
    const main_cb = document.getElementById("main_cb");
    const table_checkboxes = document.querySelectorAll(".table_cb");

    console.log("Table checkboxes found:", table_checkboxes.length);
    const all_checked = Array.from(table_checkboxes).every(cb => cb.checked);
    main_cb.checked = all_checked;
}

export function setup_cb_listeners() {
    const table_checkboxes = document.querySelectorAll('.table_cb');
    console.log("Setting up listeners for table checkboxes:", table_checkboxes.length);
    
    table_checkboxes.forEach(cb => {
        cb.removeEventListener('change', handle_checkbox_change);
        cb.addEventListener('change', handle_checkbox_change);
    });
}

function handle_checkbox_change() {
    update_main_cb();
    update_buttons();
}