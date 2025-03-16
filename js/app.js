document.addEventListener("DOMContentLoaded", function() {
    const bur_but = document.getElementById("burger-btn");
    bur_but.addEventListener("click", burger_menu);
    
    const main_cb = document.getElementById("main_cb");
    if (main_cb) {
        main_cb.addEventListener("click", function() {
            update_table_cb(main_cb);
        });
    } else {
        console.error("Main checkbox not found");
    }

    // Added dot for class
    const tableCheckboxes = document.querySelectorAll(".table_cb"); 
    console.log("Found table checkboxes:", tableCheckboxes.length);
    tableCheckboxes.forEach(cb => {
        cb.addEventListener("change", function() {
            update_main_cb();
        });
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-but').forEach(btn => {
        btn.addEventListener('click', open_edit_modal);
    });

    document.querySelectorAll('.delete-but').forEach(btn => {
        btn.addEventListener('click', open_delete_modal);
    });

    // Close modal when clicking outside or on close button
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', close_modal);
    });

});

function burger_menu() {
    console.log("burger menu clicked");
    var menu = document.getElementById("sidebar");  // The aside element
    var btn = document.querySelector(".burger-btn");
    
    if (menu.classList.contains("open")) {
        // Closing the menu
        menu.classList.remove("open");
        menu.style.display = "none";  // Hide completely, no space taken
        btn.textContent = "☰";
    } else {
        // Opening the menu
        menu.classList.add("open");
        menu.style.display = "block";  // Show and take space
        menu.style.width = "150px";   // Set desired width when open
        btn.textContent = "✕";
    }
}

function update_table_cb(source) {
    // Consistent class selector
    let checkboxes = document.querySelectorAll(".table_cb"); 
    console.log("Found checkboxes:", checkboxes.length);
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
    });
}

function update_main_cb() {
    const main_cb = document.getElementById("main_cb");
    const tableCheckboxes = document.querySelectorAll(".table_cb");
    
    if (!main_cb) {
        console.error("Main checkbox not found in update_main_cb");
        return;
    }

    console.log("Table checkboxes found:", tableCheckboxes.length);
    const allChecked = Array.from(tableCheckboxes).every(cb => cb.checked);
    main_cb.checked = allChecked;
}

function open_edit_modal(event) {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'block';
    const row = event.target.closest('tr');
    console.log('Edit clicked for row:', row);
}

function open_delete_modal(event) {
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'block';
    const row = event.target.closest('tr');
    console.log('Delete clicked for row:', row);
}

function close_modal(event) {
    const modal = event.target.closest('.modal');
    modal.style.display = 'none';
}