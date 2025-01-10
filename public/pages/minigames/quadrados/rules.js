function gameMainLoop() {
    blockCreationControler();

    checkColisionInterval = setInterval(() => {
        checkCollision(); // Verifica colisões a cada intervalo
    }, 5);
}

function setGameInterval(gamemode) {
    if (gamemode === "hard"){
        gameIntervalTime = 5;
    }
    if(gamemode === "medium"){
        gameIntervalTime = 30;
    }
    if(gamemode === "easy"){
        gameIntervalTime = 50;
    }
}

// Funções de controle do jogo
function startGame() {
    gamePaused = false;
    if(document.getElementById("death-screen")){
        removeDeathScreen();
    }
    if(document.getElementById("play-screen")){
        removePlayScreen();
    }
    gameMainLoop();
}

function pauseGame() {
    gamePaused = true;
    if(document.getElementById("play-screen")){
        removePlayScreen();
    }
    if (gameInterval) {
        clearInterval(gameInterval);
        clearInterval(checkColisionInterval);
        gameInterval = null;
        checkColisionInterval = null;
        pauseScreen();
        playPauseSound();
    }
}

function resumeGame() {
    gamePaused = false;
    if(document.getElementById("pause-screen")){
        removePauseScreen();
    }
    if (!gameInterval) {
        gameMainLoop();
    }
    playResumeSound();
}

function deathGame() {
    gamePaused = true;
    if (gameInterval) {
        clearInterval(gameInterval);
        clearInterval(checkColisionInterval);
        gameInterval = null;
        checkColisionInterval = null;
        deathScreen();
        playDeathSound();
        setHighscore();
        resetScore();
        console.log("Morreu");
    }
}