document.addEventListener("DOMContentLoaded", event => {
  console.log("DOM fully loaded and parsed");

  document
    .getElementById("colab-btn")
    .addEventListener("mouseenter", function () {
      document.getElementById("tooltip-text").style.visibility = "visible";
    });

  document
    .getElementById("colab-btn")
    .addEventListener("mouseleave", function () {
      document.getElementById("tooltip-text").style.visibility = "hidden";
    });
});
