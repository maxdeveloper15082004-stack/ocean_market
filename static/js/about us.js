document.addEventListener("DOMContentLoaded", () => {
  const pageContent = document.getElementById("page-content") || document.body;
  
  const urlParams = new URLSearchParams(window.location.search);
  const dir = urlParams.get("dir");

  if (!dir) {
      pageContent.classList.add("animate-in-right");
      setTimeout(() => {
        pageContent.classList.remove("animate-in-right");
      }, 500);
  }

});
