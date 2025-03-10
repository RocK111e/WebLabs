function burger_menu() {
    var menu = document.getElementById("side_bar");
    var btn = document.querySelector(".burger-btn");
    if (menu.style.display === "block") {
        menu.style.display = "none";
        btn.textContent = "☰";
    } else {
        menu.style.display = "block";
        btn.textContent = "✕";
    }
}