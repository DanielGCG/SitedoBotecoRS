function playDeathSound() {
    if(isAudioEnabled){
        const DeathSound = new Audio('/pages/minigames/quadrados/sounds/death.mp3'); // Substitua pelo caminho do seu arquivo de som
        DeathSound.volume = 0.15; // Ajuste o volume de 0.0 a 1.0
        DeathSound.play();
    }
}

function playPlaySound() {
    if(isAudioEnabled){
        const PlaySound = new Audio('/pages/minigames/quadrados/sounds/play2.mp3'); // Substitua pelo caminho do seu arquivo de som
        PlaySound.volume = 0.55; // Ajuste o volume de 0.0 a 1.0
        PlaySound.play();
    }
}

function playPauseSound() {
    if(isAudioEnabled){
        const PauseSound = new Audio('/pages/minigames/quadrados/sounds/bell.mp3'); // Substitua pelo caminho do seu arquivo de som
        PauseSound.volume = 0.15; // Ajuste o volume de 0.0 a 1.0
        PauseSound.play();
    }
}

function playResumeSound() {
    
}

function playBackgroundMusic() {
    
}

