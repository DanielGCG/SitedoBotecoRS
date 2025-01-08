// Funções de controle do jogo
function startGame() {
    if(document.getElementById("pause-screen")){
        removePauseScreen();
    }
    if (!gameInterval) {
        gameInterval = setInterval(() => {
            createBlock();
            checkCollision(); // Verifica colisões a cada intervalo
        }, gameIntervalTime);

        checkColisionInterval = setInterval(() => {
            checkCollision(); // Verifica colisões a cada intervalo
        }, 5);
        console.log("Jogo iniciado");
    }
}

function stopGame() {
    gamePaused = true;
    if (gameInterval) {
        clearInterval(gameInterval);
        clearInterval(checkColisionInterval);
        gameInterval = null;
        checkColisionInterval = null;
        pauseScreen();
        console.log("Jogo pausado");
    }
}