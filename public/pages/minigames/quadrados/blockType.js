function createFuzy() {
    const randomCase = Math.floor(Math.random() * 4) + 1; // Gera valores inteiros entre 1 e 4
    let startX = 0, startY = 0, directionX = 0, directionY = 0, speed = speedModifier;

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

function createBottomVerticalLine(startX) {
    let startY = 0, directionX = 0, directionY = 0, speed = speedModifier;

    // Inicia no piso
    startY = gameplayArea.offsetHeight;
    directionX = 0;
    directionY = -1;


    return { startX, startY, directionX, directionY, speed };
}

function createTopVerticalLine(startX) {
    let startY = 0, directionX = 0, directionY = 0, speed = speedModifier;

    // Inicia no teto
    startY = 0;
    directionX = 0;
    directionY = 1;


    return { startX, startY, directionX, directionY, speed };
}

function createLeftHorizontalLine(startY) {
    let startX = 0, directionX = 0, directionY = 0, speed = speedModifier;

    // Inicia na parede esquerda
    startX = 0;
    directionX = 1;
    directionY = 0;


    return { startX, startY, directionX, directionY, speed };
}

function createRightHorizontalLine(startY) {
    let startX = 0, directionX = 0, directionY = 0, speed = speedModifier;

    // Inicia na parede direita
    startX = gameplayArea.offsetWidth;
    directionX = -1;
    directionY = 0;


    return { startX, startY, directionX, directionY, speed };
}