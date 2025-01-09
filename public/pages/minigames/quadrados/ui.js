function pauseScreen() {
    // Verifica se a div de pausa já existe antes de criar uma nova
    if (!document.getElementById("pause-screen")) {
        // Cria uma nova div
        const pauseDiv = document.createElement("div");
        pauseDiv.id = "pause-screen";

        pauseDiv.style.position = "absolute";
        pauseDiv.style.top = "0";
        pauseDiv.style.left = "0";
        pauseDiv.style.width = "100%";
        pauseDiv.style.height = "100%";
        pauseDiv.style.backgroundColor = "rgba(255, 0, 0, 0.12)";
        pauseDiv.style.color = "rgba(255, 255, 255, 0.2)";
        pauseDiv.style.display = "flex";
        pauseDiv.style.justifyContent = "center";
        pauseDiv.style.alignItems = "center";
        pauseDiv.style.fontSize = "50px";
        pauseDiv.style.zIndex = "10";

        // Adiciona texto ou outros elementos à div
        pauseDiv.innerHTML = '<p>⏸︎</p>';
        pauseDiv.innerHTML += '<p>aperte esc</p>'

        // Adiciona a nova div como filho de gameplay-area
        document.getElementById("gameplay-area").appendChild(pauseDiv);
    }
}

function playScreen() {
    // Verifica se a div de pausa já existe antes de criar uma nova
    if (!document.getElementById("play-screen")) {
        // Cria uma nova div
        const playDiv = document.createElement("div");
        playDiv.id = "play-screen";

        playDiv.style.position = "absolute";
        playDiv.style.top = "0";
        playDiv.style.left = "0";
        playDiv.style.width = "100%";
        playDiv.style.height = "100%";
        playDiv.style.backgroundColor = "rgba(255, 208, 0, 0.12)";
        playDiv.style.color = "rgba(255, 255, 255, 0.2)";
        playDiv.style.display = "flex";
        playDiv.style.justifyContent = "center";
        playDiv.style.alignItems = "center";
        playDiv.style.fontSize = "50px";
        playDiv.style.zIndex = "10";

        // Adiciona texto ou outros elementos à div
        playDiv.innerHTML = '<p>▶</p>';
        playDiv.innerHTML += '<p>aperte enter</p>'

        // Adiciona a nova div como filho de gameplay-area
        document.getElementById("gameplay-area").appendChild(playDiv);
    }
}

function deathScreen() {
    // Verifica se a div de death já existe antes de criar uma nova
    if (!document.getElementById("death-screen")) {
        // Cria uma nova div
        const deathDiv = document.createElement("div");
        deathDiv.id = "death-screen";

        deathDiv.style.position = "absolute";
        deathDiv.style.top = "0";
        deathDiv.style.left = "0";
        deathDiv.style.width = "100%";
        deathDiv.style.height = "100%";
        deathDiv.style.backgroundColor = "rgba(255, 0, 0, 0.12)";
        deathDiv.style.color = "rgba(255, 255, 255, 0.2)";
        deathDiv.style.display = "flex";
        deathDiv.style.justifyContent = "center";
        deathDiv.style.alignItems = "center";
        deathDiv.style.fontSize = "50px";
        deathDiv.style.zIndex = "10";

        // Adiciona texto ou outros elementos à div
        deathDiv.innerHTML = '<p>Você morreu >:D (esc)</p>';

        // Adiciona a nova div como filho de gameplay-area
        document.getElementById("gameplay-area").appendChild(deathDiv);
    }
}

function removePauseScreen() {
    const pauseDiv = document.getElementById("pause-screen");
    if (pauseDiv) {
        pauseDiv.remove(); // Remove a div de pausa
    }
}

function removePlayScreen() {
    const deathDiv = document.getElementById("play-screen");
    if (deathDiv) {
        deathDiv.remove(); // Remove a div de death
    }
}

function removeDeathScreen() {
    const pauseDiv = document.getElementById("death-screen");
    if (pauseDiv) {
        pauseDiv.remove(); // Remove a div de pausa
    }
}

function addToScore() {
    score++;
    document.getElementById("score").innerHTML = score;
}

function resetScore() {
    score = 0;
    document.getElementById("score").innerHTML = score;
}

function setHighscore() {
    if (score > highscore){
        highscore = score;
        document.getElementById("highscore").innerHTML = "Highscore: " + highscore;
    }
}