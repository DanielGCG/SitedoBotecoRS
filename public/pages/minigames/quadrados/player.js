const mouseCursor = document.getElementById("mouse-cursor");
// Atualiza a posição do cubo do mouse conforme o movimento
document.addEventListener("mousemove", (event) => {
    const rect = gameplayArea.getBoundingClientRect();

    // Verifica se o mouse está dentro da área de gameplay
    if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
    ) {
        forbidenToUnpause = false;
        mouseCursor.style.display = "block"; // Mostra o cubo quando está dentro da área
        mouseCursor.style.left = `${event.clientX - rect.left - mouseCursor.offsetWidth / 2}px`;
        mouseCursor.style.top = `${event.clientY - rect.top - mouseCursor.offsetHeight / 2}px`;
    } else {
        mouseCursor.style.display = "none"; // Esconde o cubo quando sai da área
        forbidenToUnpause = true;
        stopGame();
    }

    // Verifica colisão com o quadrado vermelho
    checkCollision();
});

// Detecta colisão entre os blocos e o quadrado branco
function checkCollision() {
    const cursorRect = mouseCursor.getBoundingClientRect();

    // Verifica se o cursor (quadrado branco) está em cima de um elemento (bolinha vermelha)
    const block = document.elementFromPoint(cursorRect.left + cursorRect.width / 2, cursorRect.top + cursorRect.height / 2);

    // Se o elemento encontrado for quadrado vermelho (classe "block")
    if (block && block.classList.contains("block")) {
        resetScore();
        stopGame();
    }
}
