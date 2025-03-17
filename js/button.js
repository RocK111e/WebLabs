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

export function addStudentToTable(group, firstName, lastName, gender, birthday) {
    const table = document.querySelector('table');
    if (!table) {
        console.error("Table element not found in HTML");
        return;
    }
    const newRow = table.insertRow(-1);
    newRow.innerHTML = `
        <td><input type="checkbox" class="table_cb"></td>
        <td>${group}</td>
        <td>${firstName} ${lastName}</td>
        <td>${gender}</td>
        <td>${birthday}</td>
        <td>Active</td>
        <td>
            <div class="opt_but">
                <button class="edit-but">✏️</button>
                <button class="delete-but">🗑️</button>
            </div>
        </td>
    `;
    newRow.querySelector('.edit-but').addEventListener('click', open_edit_modal);
    newRow.querySelector('.delete-but').addEventListener('click', open_delete_modal);
    console.log("New row added:", newRow);
}

export function initializeAddForm() {
    const addForm = document.getElementById('add-form');
    if (!addForm) {
        console.error("Add form not found");
        return;
    }
    addForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Form submitted");
        const group = document.getElementById('add-group').value;
        const firstName = document.getElementById('add-first-name').value;
        const lastName = document.getElementById('add-last-name').value;
        const gender = document.getElementById('add-gender').value;
        const birthday = document.getElementById('add-birthday').value;
        addStudentToTable(group, firstName, lastName, gender, birthday);
        const modal = document.getElementById('add-modal');
        modal.style.display = 'none';
        addForm.reset();
    });
}
