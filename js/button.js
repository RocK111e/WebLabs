import { setup_cb_listeners, update_main_cb } from "./checkbox.js";
import { validate_name, validate_date } from "./validation.js";

let current_edited_row = null;
let next_id = 3;

// Function to log JSON actions
function log_json_action(action, data) {
    console.log(`${action}:`, JSON.stringify(data));
}

export function burger_menu() {
    console.log("burger menu clicked");
    var menu = document.getElementById("sidebar");
    var btnIcon = document.querySelector(".burger-char");

    if (menu.classList.contains("open")) {
        menu.classList.remove("open");
        menu.style.display = "none";
        btnIcon.textContent = "☰"; 
    } else {
        menu.classList.add("open");
        menu.style.display = "block";
        menu.style.width = "150px";
        btnIcon.textContent = "✕"; 
    }
}

export function open_edit_modal(event) {
    const modal = document.getElementById('edit-modal');
    const edit_form = document.getElementById('edit-form');
    modal.style.display = 'block';
    current_edited_row = event.target.closest('tr');
    console.log('Edit clicked for row:', current_edited_row);

    edit_form.reset();

    const cells = current_edited_row.cells;
    document.getElementById('edit-group').value = cells[1].textContent;
    const full_name = cells[2].textContent.split(' ');
    document.getElementById('edit-first-name').value = full_name[0] || ''; 
    document.getElementById('edit-last-name').value = full_name[1] || ''; 
    document.getElementById('edit-gender').value = cells[3].textContent; 
    document.getElementById('edit-birthday').value = cells[4].textContent; 
}

export function open_delete_modal(event) {
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'block';
    
    const checked_rows = Array.from(document.querySelectorAll('.table_cb:checked'))
        .map(cb => cb.closest('tr'));
    
    if (checked_rows.length === 0) {
        console.log('No rows selected for deletion');
        close_modal(event); 
        return;
    }

    if (checked_rows.length === 1) {
        const student_name = checked_rows[0].cells[2].textContent || 'this student';
        document.getElementById('delete-name').textContent = student_name;
    } else {
        document.getElementById('delete-name').textContent = `${checked_rows.length} students`;
    }
}

export function close_modal(event) {
    const modal = event.target.closest('.modal');
    modal.style.display = 'none';
    current_edited_row = null;

    document.querySelectorAll('.warning').forEach(warning => {
        warning.style.display = 'none';
        warning.textContent = '';
    });
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

    let first_name_pass = validate_name(first_name);
    let last_name_pass = validate_name(last_name);
    let birthday_pass = validate_date(birthday);
    
    if (first_name_pass !== true) {
        console.log(first_name_pass);
        return;
    } 

    if (last_name_pass !== true) {
        console.log(last_name_pass);
        return;
    }

    if (birthday_pass !== true) {
        console.log(birthday_pass);
        return;
    }

    console.log("Validating passed");

    const id = next_id;
    const new_row = table.insertRow(-1);
    new_row.innerHTML = `
        <td data-id="${id}">
            <label>
                <input type="checkbox" class="table_cb" name="checkbox">
                    Select
                </input>
            </label>
        </td>
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
                <button name="Edit button" class="edit-but"><img class="edit_img" src="./icons/pencil.png" alt="Edit button"></button>  
                <button name="Delete button" class="delete-but"><img class="delete_img" src="./icons/delete.png" alt="Delete button"></button>
            </div>
        </td>
    `;

    const new_edit_btn = new_row.querySelector('.edit-but');
    const new_delete_btn = new_row.querySelector('.delete-but');
    new_edit_btn.addEventListener('click', open_edit_modal);
    new_delete_btn.addEventListener('click', open_delete_modal);

    // Log the newly added student
    const newData = {
        id,
        group,
        fullName: `${first_name} ${last_name}`,
        gender,
        birthday
    };
    log_json_action('Row added', newData);

    next_id++;

    setup_cb_listeners();
    update_main_cb();
    update_buttons();
}

export function validate_form(prefix, group, first_name, last_name, gender, birthday) {
    let isValid = true;

    document.querySelectorAll('.warning').forEach(warning => {
        warning.style.display = 'none';
        warning.textContent = '';
    });

    if (!group) {
        document.getElementById(`${prefix}-group-warning`).style.display = 'block';
        document.getElementById(`${prefix}-group-warning`).textContent = "Please select a group.";
        isValid = false;
    }

    let first_name_pass = validate_name(first_name);
    if (first_name_pass !== true) {
        document.getElementById(`${prefix}-first-name-warning`).style.display = 'block';
        document.getElementById(`${prefix}-first-name-warning`).textContent = first_name_pass;
        isValid = false;
    }

    let last_name_pass = validate_name(last_name);
    if (last_name_pass !== true) {
        document.getElementById(`${prefix}-last-name-warning`).style.display = 'block';
        document.getElementById(`${prefix}-last-name-warning`).textContent = last_name_pass;
        isValid = false;
    }

    if (!gender) {
        document.getElementById(`${prefix}-gender-warning`).style.display = 'block';
        document.getElementById(`${prefix}-gender-warning`).textContent = "Please select a gender.";
        isValid = false;
    }

    let birthday_pass = validate_date(birthday);
    if (birthday_pass !== true) {
        document.getElementById(`${prefix}-birthday-warning`).style.display = 'block';
        document.getElementById(`${prefix}-birthday-warning`).textContent = birthday_pass;
        isValid = false;
    }

    return isValid;
}

export function initialize_add_form() {
    const add_form = document.getElementById('add-form');
    if (!add_form) {
        console.error("Add form not found");
        return;
    }
    add_form.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Add form submitted");

        const group = document.getElementById('add-group').value;
        const first_name = document.getElementById('add-first-name').value;
        const last_name = document.getElementById('add-last-name').value;
        const gender = document.getElementById('add-gender').value;
        const birthday = document.getElementById('add-birthday').value;

        if (validate_form('add', group, first_name, last_name, gender, birthday)) {
            add_student_to_table(group, first_name, last_name, gender, birthday);
            close_modal(event);
            add_form.reset();
            setup_cb_listeners();
        }
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

        const group = document.getElementById('edit-group').value;
        const first_name = document.getElementById('edit-first-name').value;
        const last_name = document.getElementById('edit-last-name').value;
        const gender = document.getElementById('edit-gender').value;
        const birthday = document.getElementById('edit-birthday').value;

        if (validate_form('edit', group, first_name, last_name, gender, birthday)) {
            if (current_edited_row) {
                const id = current_edited_row.cells[0].getAttribute('data-id');
                current_edited_row.cells[1].textContent = group;
                current_edited_row.cells[2].textContent = `${first_name} ${last_name}`;
                current_edited_row.cells[3].textContent = gender;
                current_edited_row.cells[4].textContent = birthday;

                const newData = {
                    id,
                    group,
                    fullName: `${first_name} ${last_name}`,
                    gender,
                    birthday
                };

                log_json_action('Row changed', newData);
            } else {
                console.error("No row selected for editing");
            }
            close_modal(event);
            current_edited_row = null;
        }
    });
}

export function initialize_delete_modal() {
    const delete_modal = document.getElementById('delete-modal');
    if (!delete_modal) {
        console.error("Delete modal not found");
        return;
    }
    const cancel_button = delete_modal.querySelector('.cancel-but');
    const confirm_button = delete_modal.querySelector('.confirm-delete');

    cancel_button.addEventListener('click', function(event) {
        close_modal(event);
    });

    confirm_button.addEventListener('click', function(event) {
        const checked_rows = Array.from(document.querySelectorAll('.table_cb:checked'))
            .map(cb => cb.closest('tr'));
        
        const deletedItems = checked_rows.map(row => ({
            id: row.cells[0].getAttribute('data-id'),
            group: row.cells[1].textContent,
            fullName: row.cells[2].textContent,
            gender: row.cells[3].textContent,
            birthday: row.cells[4].textContent
        }));

        checked_rows.forEach(row => {
            row.remove();
        });

        log_json_action('Rows deleted', deletedItems);

        setup_cb_listeners();
        update_main_cb();
        update_buttons();
        close_modal(event);
    });
}

export function update_buttons() {
    const checked_count = document.querySelectorAll('.table_cb:checked').length;
    const edit_buttons = document.querySelectorAll('.edit-but');
    const delete_buttons = document.querySelectorAll('.delete-but');

    edit_buttons.forEach(button => {
        button.disabled = checked_count !== 1;
    });

    delete_buttons.forEach(button => {
        button.disabled = checked_count === 0;
    });
}