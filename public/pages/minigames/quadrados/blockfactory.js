function createBlock() {
    const block = document.createElement("div");
    block.classList.add("block");

    // Configurar posição e direção iniciais
    const { startX, startY, directionX, directionY, speed } = getInitialPositionAndDirection();

    block.style.left = `${startX}px`;
    block.style.top = `${startY}px`;

    blockArea.appendChild(block);

    // Iniciar o movimento do bloco
    moveBlock(block, directionX, directionY, speed);
}

function getInitialPositionAndDirection() {
    const randomCase = Math.floor(Math.random() * 4) + 1; // Gera valores inteiros entre 1 e 4
    let startX = 0, startY = 0, directionX = 0, directionY = 0, speed = (Math.floor(Math.random() * 2) + 1);

    switch (randomCase) {
        case 1:
            // Inicia na parede esquerda
            startX = 0;
            startY = Math.random() * gameplayArea.offsetHeight;
            directionX = 1;
            directionY = Math.random() < 0.5 ? -1 : 1;
            break;

        case 2:
            // Inicia na parede direita
            startX = gameplayArea.offsetWidth;
            startY = Math.random() * gameplayArea.offsetHeight;
            directionX = -1;
            directionY = Math.random() < 0.5 ? -1 : 1;
            break;

        case 3:
            // Inicia no teto
            startX = Math.random() * gameplayArea.offsetWidth;
            startY = 0;
            directionX = Math.random() < 0.5 ? -1 : 1;
            directionY = 1;
            break;

        case 4:
            // Inicia no piso
            startX = Math.random() * gameplayArea.offsetWidth;
            startY = gameplayArea.offsetHeight;
            directionX = Math.random() < 0.5 ? -1 : 1;
            directionY = -1;
            break;

        default:
            console.error("Valor inesperado no switch");
    }

    return { startX, startY, directionX, directionY, speed };
}