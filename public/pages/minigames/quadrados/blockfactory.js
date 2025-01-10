function createBlock(type, position) {
    const block = document.createElement("div");
    block.classList.add("block");

    // Variáveis para configurar posição e direção iniciais
    let startX, startY, directionX, directionY, speed;

    switch (type) {
        case "fuzy":
            ({ startX, startY, directionX, directionY, speed } = createFuzy());
            break;

        case "bottomVerticalLine":
            ({ startX, startY, directionX, directionY, speed } = createBottomVerticalLine(position));
            break;
        
        case "topVerticalLine":
            ({ startX, startY, directionX, directionY, speed } = createTopVerticalLine(position));
            break;

        case "leftHorizontalLine":
            ({ startX, startY, directionX, directionY, speed } = createLeftHorizontalLine(position));
            break;

        case "rightHorizontalLine":
            ({ startX, startY, directionX, directionY, speed } = createRightHorizontalLine(position));
            break;
                    

        default:
            console.error("Tipo desconhecido:", type);
            return; // Encerra a função se o tipo for desconhecido
    }

    // Configurar estilo do bloco e adicioná-lo ao jogo
    block.style.left = `${startX}px`;
    block.style.top = `${startY}px`;
    blockArea.appendChild(block);

    // Iniciar o movimento do bloco
    moveBlock(block, directionX, directionY, speed);
}

function startBlockCreation(type, blockLimitTime, position) {
    // Inicia o intervalo para criar blocos
    gameInterval = setInterval(() => {
        createBlock(type, position);
    }, 100);

    // Define um timeout para parar a criação de blocos após o limite de tempo
    blockCreationTimeout = setTimeout(() => {
        clearInterval(gameInterval); // Para o intervalo de criação de blocos
        console.log("Limite de tempo atingido. Parando criação de blocos.");
    }, blockLimitTime);
}

/*  PRECISO ARRUMAR ISSO AQUI 

function startBlockCreation(type, ticks, blockLimitTime) {
    const interval = setInterval(() => {
        createBlock(type);
    }, gameIntervalTime*ticks);

    // Limitar o tempo de criação de blocos
    setTimeout(() => {
        clearInterval(interval); // Para o intervalo após o tempo limite
        console.log(`${type} creation stopped.`);
    }, blockLimitTime);
}
*/


function blockCreationControler() {
    ciclo1();
}

