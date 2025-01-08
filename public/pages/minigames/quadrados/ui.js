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
        playDiv.innerHTML += '<p>aperte esc</p>'

        // Adiciona a nova div como filho de gameplay-area
        document.getElementById("gameplay-area").appendChild(playDiv);
    }
}

function removePauseScreen() {
    const pauseDiv = document.getElementById("pause-screen");
    if (pauseDiv) {
        pauseDiv.remove(); // Remove a div de pausa
    }
}

function removePlayScreen() {
    const playDiv = document.getElementById("play-screen");
    if (playDiv) {
        playDiv.remove(); // Remove a div de play
    }
}

function addToScore() {
    pontos++;
    document.getElementById("score").innerHTML = pontos;
}

function resetScore() {
    pontos = 0;
    document.getElementById("score").innerHTML = pontos;
}

// Obtém o controle da barra
const intervalSlider = document.getElementById("interval-slider");
const sliderValueText = document.getElementById("slider-value");

// Atualiza o valor de gameIntervalTime conforme o slider é movido
intervalSlider.addEventListener("input", (event) => {
    gameIntervalTime = event.target.value;
    sliderValueText.textContent = `${gameIntervalTime} ms`;
    
    // Se o jogo estiver em andamento, reinicia o intervalo com a nova velocidade
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = setInterval(() => {
            createBlock();
            checkCollision(); // Verifica colisões a cada intervalo
        }, gameIntervalTime);
    }
});

// Deixar o slider no default
document.addEventListener("DOMContentLoaded", () => {
    intervalSlider.value = 50;
});