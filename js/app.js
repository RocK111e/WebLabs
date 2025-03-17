import { 
    burger_menu, 
    close_modal,
    open_delete_modal,
    open_edit_modal,
    open_add_modal,
    initializeAddForm
} from "./button.js";
import { update_table_cb, update_main_cb } from "./checkbox.js";

document.addEventListener("DOMContentLoaded", function() {
    //Burger menu event listener
    const bur_but = document.getElementById("burger-btn");
    bur_but.addEventListener("click", burger_menu);
    

    //Checkbox event listeners
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
    
    //Modal buttons event listeners
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
    initializeAddForm(); 


});