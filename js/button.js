// button.js
import { setup_cb_listeners } from "./checkbox.js";

// Store the currently edited or deleted row globally
let current_edited_row = null;
let current_deleted_row = null;

export function burger_menu() {
    console.log("burger menu clicked");
    var menu = document.getElementById("sidebar");
    var btn = document.querySelector(".burger-btn");
    
    if (menu.classList.contains("open")) {
        menu.classList.remove("open");
        menu.style.display = "none";
        btn.textContent = "☰";
    } else {
        menu.classList.add("open");
        menu.style.display = "block";
        menu.style.width = "150px";
        btn.textContent = "✕";
    }
}

export function open_edit_modal(event) {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'block';
    current_edited_row = event.target.closest('tr');
    console.log('Edit clicked for row:', current_edited_row);

    // Populate the form with current row data
    const cells = current_edited_row.cells;
    document.getElementById('edit-group').value = cells[1].textContent; // Group
    const fullName = cells[2].textContent.split(' ');
    document.getElementById('edit-first-name').value = fullName[0] || ''; // First Name
    document.getElementById('edit-last-name').value = fullName[1] || ''; // Last Name
    document.getElementById('edit-gender').value = cells[3].textContent; // Gender
    document.getElementById('edit-birthday').value = cells[4].textContent; // Birthday
}

export function open_delete_modal(event) {
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'block';
    current_deleted_row = event.target.closest('tr');
    console.log('Delete clicked for row:', current_deleted_row);

    // Populate the name to delete
    const name = current_deleted_row.cells[2].textContent; // Name column
    document.getElementById('delete-name').textContent = name;
}

export function close_modal(event) {
    const modal = event.target.closest('.modal');
    modal.style.display = 'none';
    current_edited_row = null; // Clear edit reference
    current_deleted_row = null; // Clear delete reference
}

export function open_add_modal(event) {
    const modal = document.getElementById('add-modal');
    modal.style.display = 'block';
    console.log('Add Student modal opened');
}

export function add_student_to_table(group, first_name, last_name, gender, birthday) {
    const table = document.querySelector('table');
    if (!table) {
        console.error("Table element not found in HTML");
        return;
    }
    const new_row = table.insertRow(-1);
    new_row.innerHTML = `
        <td><input type="checkbox" class="table_cb"></td>
        <td>${group}</td>
        <td>${first_name} ${last_name}</td>
        <td>${gender}</td>
        <td>${birthday}</td>
        <td>Active</td>
        <td>
            <div class="opt_but">
                <button class="edit-but">✏️</button>
                <button class="delete-but">🗑️</button>
            </div>
        </td>
    `;

    // Add event listeners to new row's buttons
    const new_edit_btn = new_row.querySelector('.edit-but');
    const new_delete_btn = new_row.querySelector('.delete-but');
    new_edit_btn.addEventListener('click', open_edit_modal);
    new_delete_btn.addEventListener('click', open_delete_modal);

    // Setup listeners for all checkboxes, including the new one
    setup_cb_listeners();

    // Update main_cb state based on the current state of all checkboxes
    update_main_cb();
}

export function initialize_add_form() {
    const add_form = document.getElementById('add-form');
    if (!add_form) {
        console.error("Add form not found");
        return;
    }
    add_form.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Form submitted");
        const group = document.getElementById('add-group').value;
        const first_name = document.getElementById('add-first-name').value;
        const last_name = document.getElementById('add-last-name').value;
        const gender = document.getElementById('add-gender').value;
        const birthday = document.getElementById('add-birthday').value;
        add_student_to_table(group, first_name, last_name, gender, birthday);
        const modal = document.getElementById('add-modal');
        modal.style.display = 'none';
        add_form.reset();
        setup_cb_listeners();
    });
}

export function initialize_edit_form() {
    const edit_form = document.getElementById('edit-form');
    if (!edit_form) {
        console.error("Edit form not found");
        return;
    }
    edit_form.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Edit form submitted");

        // Get new values from the form
        const group = document.getElementById('edit-group').value;
        const first_name = document.getElementById('edit-first-name').value;
        const last_name = document.getElementById('edit-last-name').value;
        const gender = document.getElementById('edit-gender').value;
        const birthday = document.getElementById('edit-birthday').value;

        // Update the current edited row
        if (current_edited_row) {
            current_edited_row.cells[1].textContent = group; // Group
            current_edited_row.cells[2].textContent = `${first_name} ${last_name}`; // Name
            current_edited_row.cells[3].textContent = gender; // Gender
            current_edited_row.cells[4].textContent = birthday; // Birthday
        } else {
            console.error("No row selected for editing");
        }

        // Close the modal
        const modal = document.getElementById('edit-modal');
        modal.style.display = 'none';
        current_edited_row = null; // Clear the reference
    });
}

export function initialize_delete_modal() {
    const delete_modal = document.getElementById('delete-modal');
    if (!delete_modal) {
        console.error("Delete modal not found");
        return;
    }

    // Add event listeners for Cancel and Confirm buttons
    const cancel_button = delete_modal.querySelector('.cancel-but');
    const confirm_button = delete_modal.querySelector('.confirm-delete');

    cancel_button.addEventListener('click', function() {
        delete_modal.style.display = 'none';
        current_deleted_row = null; // Clear the reference
    });

    confirm_button.addEventListener('click', function() {
        if (current_deleted_row) {
            current_deleted_row.remove(); // Remove the row
            console.log('Row deleted:', current_deleted_row);
            // Update checkbox listeners and main_cb state
            setup_cb_listeners();
            update_main_cb();
        } else {
            console.error("No row selected for deletion");
        }
        delete_modal.style.display = 'none';
        current_deleted_row = null; // Clear the reference
    });
}

// Import update_main_cb from checkbox.js
import { update_main_cb } from "./checkbox.js";