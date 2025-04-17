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

import { fetch_all_students } from "./api_connector.js";
import { put_item_to_table } from "./data_process.js";

document.addEventListener("DOMContentLoaded", async function() {
    const bur_but = document.getElementById("burger-btn");
    bur_but.addEventListener("click", burger_menu);

    const main_cb = document.getElementById("main_cb");
    main_cb.addEventListener("click", function() {
        update_table_cb(main_cb);
    });

    setup_cb_listeners();
    
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
    initialize_delete_modal();

    update_buttons();

    const bellContainer = document.querySelector('.bell-container');
    const bellWrapper = document.querySelector('.bell-wrapper');

    bellContainer.addEventListener('contextmenu', function (e) {
        if (bellWrapper.classList.contains('shake')) return;
        bellWrapper.classList.add('shake');
        setTimeout(() => {
            bellWrapper.classList.remove('shake');
        }, 600);
    });

    //Fetch students

    let students_list = await fetch_all_students();
    console.log(students_list);
    if (students_list !== false) {
        students_list.forEach(item => {
            put_item_to_table(item.id, item.Group, item.Name, item.Surname, item.Gender, item.Birthday, item.Status)
        })
    }

    // window.addEventListener('load', () => {
    //     navigator.serviceWorker.register('/WebLabs/sw.js')
    //         .then(registration => {
    //             console.log('Service Worker registered:', registration);
    //         })
    //         .catch(error => {
    //             console.log('Service Worker registration failed:', error);
    //         });
    //     });
    
});