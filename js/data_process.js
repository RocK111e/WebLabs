import { open_edit_modal, open_delete_modal, update_buttons } from "./button.js"; 
import { setup_cb_listeners, update_main_cb } from "./checkbox.js";
import { fetch_all_students } from "./api_connector.js";

const table= document.querySelector('table');

export async function update_table() {
    let students_list = await fetch_all_students();
    console.log(students_list);
    if (students_list !== false) {
        students_list.forEach(item => {
            put_item_to_table(item.id, item.Group, item.Name, item.Surname, item.Gender, item.Birthday, item.Status)
        })
    }
}

export function put_item_to_table(id, group, first_name, last_name, gender, birthday, status){
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