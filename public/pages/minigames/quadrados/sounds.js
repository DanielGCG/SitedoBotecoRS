// Função genérica para reproduzir áudio
function playAudio(soundPath, volume) {
    if (!isAudioEnabled) {
        return;
    }

    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.play().then(() => {
    }).catch(error => {
        console.error("Erro ao tentar reproduzir o som:", error);
    });
}

function playDeathSound() {
    if(isAudioEnabled){
        playAudio('/pages/minigames/quadrados/sounds/death.mp3', 0.1);
    }
}

function playPlaySound() {
    if(isAudioEnabled){
        playAudio('/pages/minigames/quadrados/sounds/play2.mp3', 0.55);
    }
}

function playPlaySound1() {
    if(isAudioEnabled){
        playAudio('/pages/minigames/quadrados/sounds/play1.mp3', 0.55);
    }
}

function playPauseSound() {
    if(isAudioEnabled){
        playAudio('/pages/minigames/quadrados/sounds/bell.mp3', 0.11);
    }
}

function playResumeSound() {
    if(isAudioEnabled){
        playAudio('/pages/minigames/quadrados/sounds/lleb.mp3', 0.11);
    }
}

function playBackgroundMusic() {
    
}

