function abrirBetterPopup(id) {
  document.getElementById(id).setAttribute('data-active', '');
}

function fecharBetterPopup(id) {
  document.getElementById(id).removeAttribute('data-active');
}

window.addEventListener("load", () => {
  document
  .querySelectorAll("[data-popup]")
  .forEach((el) => {
    el.addEventListener("click", () => {
      const target = el.getAttribute("data-popup");
      abrirBetterPopup(target);
    });
  });

  document
    .querySelectorAll(".better-popup-close")
    .forEach((el) => {
      el.addEventListener("click", () => {
        el.closest(".better-popup").removeAttribute("data-active");
      });
    });
});