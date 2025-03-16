export function burger_menu() {
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

export function open_edit_modal(event) {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'block';
    const row = event.target.closest('tr');
    console.log('Edit clicked for row:', row);
}

export function open_delete_modal(event) {
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'block';
    const row = event.target.closest('tr');
    console.log('Delete clicked for row:', row);
}

export function close_modal(event) {
    const modal = event.target.closest('.modal');
    modal.style.display = 'none';
}

export function open_add_modal(event){
    const modal = document.getElementById('add-modal');
    modal.style.display = 'block';
    console.log('Add Student modal opened');
}