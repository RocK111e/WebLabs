document.addEventListener("DOMContentLoaded", function() {
    const bur_but = document.getElementById("burger-btn");
    bur_but.addEventListener("click", burger_menu);

    const main_cb = document.getElementById("main_cb");
    main_cb.addEventListener("click", function() {
        toggle(main_cb);
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

function toggle(source) {
    let checkboxes = document.querySelectorAll(".table_cb");
    console.log("Found checkboxes:", checkboxes.length);
    for(var i=0, n=checkboxes.length;i<n;i++) {
        checkboxes[i].checked = source.checked;
    }
}
