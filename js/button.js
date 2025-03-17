// button.js
import { setup_cb_listeners } from "./checkbox.js";

// Store the currently edited or deleted row globally
let current_edited_row = null;

export function burger_menu() {
    console.log("burger menu clicked");
    var menu = document.getElementById("sidebar");
    var btnIcon = document.querySelector(".burger-char");

    if (menu.classList.contains("open")) {
        menu.classList.remove("open");
        menu.style.display = "none";
        btnIcon.textContent = "☰";  // Use same spacing
    } else {
        menu.classList.add("open");
        menu.style.display = "block";
        menu.style.width = "150px";
        btnIcon.textContent = "✕";  // Ensure same width
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
    const full_name = cells[2].textContent.split(' ');
    document.getElementById('edit-first-name').value = full_name[0] || ''; // First Name
    document.getElementById('edit-last-name').value = full_name[1] || ''; // Last Name
    document.getElementById('edit-gender').value = cells[3].textContent; // Gender
    document.getElementById('edit-birthday').value = cells[4].textContent; // Birthday
}

export function open_delete_modal(event) {
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'block';
    
    // Get all checked rows
    const checked_rows = Array.from(document.querySelectorAll('.table_cb:checked'))
        .map(cb => cb.closest('tr'));
    
    if (checked_rows.length === 0) {
        console.log('No rows selected for deletion');
        close_modal(event); // Use close_modal function
        return;
    }

    // Update the modal with the student's name if only one row is checked
    if (checked_rows.length === 1) {
        const student_name = checked_rows[0].cells[2].textContent || 'this student'; // Name column (index 2)
        document.getElementById('delete-name').textContent = student_name;
    } else {
        document.getElementById('delete-name').textContent = `${checked_rows.length} students`;
    }
}

export function close_modal(event) {
    const modal = event.target.closest('.modal');
    modal.style.display = 'none';
    current_edited_row = null; // Clear edit reference
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
        <td>
            <div class="status">
                <div class="offline"></div>
            </div>
        </td>
        <td>
            <div class="opt_but">
                <button class="edit-but"><img class="edit_img" src="./icons/pencil.png"></button>  
                <button class="delete-but"><img class="delete_img" src="./icons/delete.png"></button>
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

    // Update main_cb state and button states
    update_main_cb();
    update_buttons();
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

        if (!group || !first_name || !last_name || !gender || !birthday) {
            alert("Please fill in all fields.");
            const modal = document.getElementById('add-modal');
            modal.style.display = 'none'; // Close the modal
            return; // Stop form submission
        }

        add_student_to_table(group, first_name, last_name, gender, birthday);
        const modal = document.getElementById('add-modal');
        close_modal(event); // Use close_modal function
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
        close_modal(event); // Use close_modal function
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

    cancel_button.addEventListener('click', function(event) {
        close_modal(event); // Use close_modal function
    });

    confirm_button.addEventListener('click', function(event) {
        // Get all checked rows
        const checked_rows = Array.from(document.querySelectorAll('.table_cb:checked'))
            .map(cb => cb.closest('tr'));
        
        // Delete each checked row
        checked_rows.forEach(row => {
            row.remove();
            console.log('Row deleted:', row);
        });

        // Update checkbox listeners and main_cb state
        setup_cb_listeners();
        update_main_cb();

        // Update button states
        update_buttons();

        // Close the modal
        close_modal(event); // Use close_modal function
    });
}

// Function to update the disabled state of both edit and delete buttons
export function update_buttons() {
    const checked_count = document.querySelectorAll('.table_cb:checked').length;
    const edit_buttons = document.querySelectorAll('.edit-but');
    const delete_buttons = document.querySelectorAll('.delete-but');

    // Update edit buttons
    edit_buttons.forEach(button => {
        if (checked_count !== 1) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }
    });

    // Update delete buttons
    delete_buttons.forEach(button => {
        if (checked_count === 0) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }
    });
}

// Import update_main_cb from checkbox.js
import { update_main_cb } from "./checkbox.js";