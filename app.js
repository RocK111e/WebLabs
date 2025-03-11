document.addEventListener("DOMContentLoaded", function() {
    const bur_but = document.getElementById("burger-btn");
    bur_but.addEventListener("click", burger_menu);
});

function burger_menu() {
    console.log("burger menu clicked");
    var menu = document.getElementById("sidebar");  // Updated to "sidebar"
    var btn = document.querySelector(".burger-btn");
    
    if (menu.classList.contains("open")) {
        menu.classList.remove("open");
        btn.textContent = "☰";
    } else {
        menu.classList.add("open");
        btn.textContent = "✕";
    }
}