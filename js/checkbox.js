export function update_table_cb(source) {
    let checkboxes = document.querySelectorAll(".table_cb"); 
    console.log("Found checkboxes:", checkboxes.length);
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
    });
}

export function update_main_cb() {
    const main_cb = document.getElementById("main_cb");
    const tableCheckboxes = document.querySelectorAll(".table_cb");

    console.log("Table checkboxes found:", tableCheckboxes.length);
    const allChecked = Array.from(tableCheckboxes).every(cb => cb.checked);
    main_cb.checked = allChecked;
}

export function setup_cb_listeners() {
    const tableCheckboxes = document.querySelectorAll('.table_cb');
    console.log("Setting up listeners for table checkboxes:", tableCheckboxes.length);
    
    // Remove existing listeners to avoid duplicates
    tableCheckboxes.forEach(cb => {
        cb.removeEventListener('change', update_main_cb);
        cb.addEventListener('change', update_main_cb);
    });
}