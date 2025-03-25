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

document.addEventListener("DOMContentLoaded", function() {
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

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/js/sw.js")
          .then(() => console.log("Service Worker registered"))
          .catch((err) => console.error("Service Worker registration failed", err));
      }
});