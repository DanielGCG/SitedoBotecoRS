// Funções de controle do jogo
function startGame() {
    if(document.getElementById("pause-screen")){
        removePauseScreen();
    }
    if(document.getElementById("death-screen")){
        removeDeathScreen();
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

function setGameInterval(gamemode) {
    if (gamemode === "hard"){
        gameIntervalTime = 5;
    }
    if(gamemode === "medium"){
        gameIntervalTime = 20;
    }
    if(gamemode === "easy"){
        gameIntervalTime = 40;
    }
}

function pauseGame() {
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

function deathGame() {
    gamePaused = true;
    if (gameInterval) {
        clearInterval(gameInterval);
        clearInterval(checkColisionInterval);
        gameInterval = null;
        checkColisionInterval = null;
        deathScreen();
        setHighscore();
        resetScore();
        console.log("Morreu");
    }
}