import { open_edit_modal, open_delete_modal, update_buttons } from "./button.js"; 
import { setup_cb_listeners, update_main_cb } from "./checkbox.js";
import { fetch_all_students, fetch_students_count } from "./api_connector.js";

const table= document.querySelector('table');
const items_per_page = 4;
let global_current_page = 1;

export async function update_table(current_page) {
    let data_rows = table.querySelectorAll('tr');
    for (let i = 1; i < data_rows.length; i++) {
        data_rows[i].remove();
    }
    let students_list = await fetch_all_students();
    console.log(students_list);
    if (students_list === false) { return; }

    if (current_page === 0){
        current_page = global_current_page;
    }
    global_current_page = current_page;

    // pass to student list onlu current page students
    let start_index = (current_page - 1) * items_per_page;
    let end_index = start_index + items_per_page;
    if (end_index > students_list.length) {
        end_index = students_list.length;
    }
    if (start_index > students_list.length) {
        start_index = students_list.length;
    }
    students_list = students_list.slice(start_index, end_index);

    if (students_list) {
        for (const item of students_list) {
            await put_item_to_table(item.id, item.Group, item.Name, item.Surname, item.Gender, item.Birthday, item.Status);
        }
    }
    await render_pagination(current_page);
}

export async function render_pagination(current_page)
{
    const students_count = await fetch_students_count();
    const pages_count = Math.ceil(students_count / items_per_page);
    const pagination = document.querySelector('.pagination');

    // Clear previous pagination
    pagination.innerHTML = '';

    // Helper function to create page button
    const createPageButton = (page, text = page, isCurrent = false, isDisabled = false) => {
        const button = document.createElement('button');
        button.classList.add('pagination-button');
        button.textContent = text;

        if (isCurrent) {
            button.classList.add('current');
            // Current buttons don't need a click event since we're already on this page
        } else if (isDisabled) {
            button.disabled = true;
            button.classList.add('disabled');
        } else {
            // Only non-current, non-disabled buttons get click events
            button.addEventListener('click', () => {
                update_table(page);
            });
        }

        return button;
    };

    // Helper function to create ellipsis
    const createEllipsis = () => {
        const span = document.createElement('span');
        span.textContent = '...';
        span.classList.add('ellipsis');
        return span;
    };

    if (pages_count <= 1) {
        // Render ( 1 )
        pagination.appendChild(createPageButton(1, '1', true));
    } else if (pages_count === 2) {
        // Render ( 1 2 )
        pagination.appendChild(createPageButton(1, '1', current_page === 1));
        pagination.appendChild(createPageButton(2, '2', current_page === 2));
    } else if (pages_count === 3) {
        // Render ( 1 2 3 )
        for (let i = 1; i <= 3; i++) {
            pagination.appendChild(createPageButton(i, i.toString(), current_page === i));
        }
    } else {
        // Render ( << 1 ... 3 4 5 ... 10 >> )

        // Previous button
        pagination.appendChild(createPageButton(
            current_page - 1,
            '« Prev',
            false,
            current_page === 1
        ));

        // First page
        pagination.appendChild(createPageButton(1, '1', current_page === 1));

        // Ellipsis before middle pages if needed
        if (current_page > 3) {
            pagination.appendChild(createEllipsis());
        }

        // Middle pages (current page and one page before/after)
        const start = Math.max(2, current_page - 1);
        const end = Math.min(pages_count - 1, current_page + 1);

        for (let i = start; i <= end; i++) {
            pagination.appendChild(createPageButton(i, i.toString(), current_page === i));
        }

        // Ellipsis after middle pages if needed
        if (current_page < pages_count - 2) {
            pagination.appendChild(createEllipsis());
        }

        // Last page
        pagination.appendChild(createPageButton(
            pages_count,
            pages_count.toString(),
            current_page === pages_count
        ));

        // Next button
        pagination.appendChild(createPageButton(
            current_page + 1,
            'Next »',
            false,
            current_page === pages_count
        ));
    }
}

export async function put_item_to_table(id, group, first_name, last_name, gender, birthday, status){
    if (!table) {
        console.error("Table element not found in HTML");
        return;
    }
    let status_container;
    if (status === "t") {
        status_container = "online"
    }
    else {
        status_container = "offline"
    }
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
                <div class=${status_container}></div>
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
    
    setup_cb_listeners();
    update_main_cb();
    update_buttons();
}
