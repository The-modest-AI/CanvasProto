const theme = document.querySelector("#dark-theme");

theme.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  if (document.body.classList.contains("dark-theme")) {
    theme.innerHTML = '<i id="light" class="fas fa-sun"></i>';
    document.querySelector("#light").style.color = "rgb(255,255,255, 0.87)";
  } else {
    theme.innerHTML = '<i class="fas fa-moon"></i>';
  }
});
