function previewMedia() {
    const fileInput = document.getElementById('mediaFile');
    const previewContainer = document.getElementById('media-preview');

    // Limpa o preview anterior e adiciona o botão de limpar input
    previewContainer.innerHTML = '';
    previewContainer.innerHTML += `
    <div id="media-preview-closebtn" class="media-preview-closebtn">
        <label for="clearMidiaInput" style="cursor: url('/img/cursor-mao.png'), auto;">
            <?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
            <svg width="36px" height="36px" viewBox="0 0 24 24" fill="#1D9BF0" xmlns="http://www.w3.org/2000/svg">
                <circle opacity="0.5" cx="12" cy="12" r="8" stroke="#1C274C" stroke-width="1.5"/>
                <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        </label>
        <button id="clearMidiaInput" style="display: none;" onclick="event.preventDefault(), clearMidiaInput()"></button>
    </div>
    `

    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const fileType = file.type;

        // Verifica o tipo do arquivo
        if (fileType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            previewContainer.appendChild(img);
        } else if (fileType.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            previewContainer.appendChild(video);
        } else {
            previewContainer.textContent = 'Formato de arquivo não suportado.';
        }
    }
}

// Contador de caracteres do post
document.getElementById("messageText").addEventListener("input", function() {
    var maxLength = 440; // Limite de caracteres
    var currentLength = this.value.length;

    // Atualiza o contador para mostrar "x/220"
    document.getElementById("char-count-text").textContent = `${currentLength}/${maxLength}`;

    // Se o limite for alcançado, desabilitar mais entradas
    if (currentLength >= maxLength) {
        this.value = this.value.substring(0, maxLength); // Impede mais caracteres
    }
});

function clearMidiaInput() {
    document.getElementById('mediaFile').value = '';
    disableBrat();

    const mediaPreviewCloseBtn = document.getElementById('media-preview-closebtn');
    mediaPreviewCloseBtn.remove();


    // Limpa o preview anterior
    const previewContainer = document.getElementById('media-preview');
    previewContainer.innerHTML = '';
    
}

function clearMessageTextInput() {
    document.getElementById('messageText').value = '';
}

function clearMentionInput() {
    document.getElementById('mention').value = '';
}