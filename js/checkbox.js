export function update_table_cb(source) {
    // Consistent class selector
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