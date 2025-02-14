// Exibir uma janela/modal para buscar GIFs
selectGifButton.addEventListener('click', async () => {
    // Criação de uma caixa de pesquisa de GIFs
    const searchTerm = prompt('Digite o termo para buscar GIFs:');
    if (!searchTerm) return; // Se o termo for vazio, não faz nada

    try {
        // Fazer a requisição para a API do Giphy
        const response = await fetch(`${giphyUrl}?api_key=${apiKey}&q=${searchTerm}&limit=8`);
        const data = await response.json();

        // Mostrar os GIFs encontrados
        const gifs = data.data;
        if (gifs.length > 0) {
            popupGif.style.display = "";
            const gifUrls = gifs.map(gif => gif.images.fixed_height.url); // URLs dos GIFs

            // Exibir GIFs na interface
            let gifHtml = '';
            gifUrls.forEach(gifUrl => {
                gifHtml += `<img src="${gifUrl}" class="gif-preview" onclick="setGif('${gifUrl}')">`;
            });
            popupGifContainer.innerHTML = gifHtml;
        } else {
            alert('Nenhum GIF encontrado!');
        }
    } catch (error) {
        console.error('Erro ao buscar GIFs:', error);
        alert('Erro ao buscar GIFs.');
    }
});

// Função para baixar o GIF e tratá-lo como um arquivo
async function setGif(gifUrl) {
    try {
        // Baixar o conteúdo do GIF
        const response = await fetch(gifUrl);
        if (!response.ok) throw new Error('Falha ao baixar o GIF');
        
        // Obter o conteúdo como um Blob (binário)
        const blob = await response.blob();
        
        // Criar um File a partir do Blob (usando o nome do arquivo original)
        const mediaFile = new File([blob], 'gif.gif', { type: 'image/gif' });
        
        // Atualizar o input de arquivo com o novo arquivo
        mediaFileInput.files = createFileList(mediaFile);
        
        // Atualizar o preview de mídia
        popupGif.style.display = "none";
        previewMedia();
    } catch (error) {
        console.error('Erro ao baixar o GIF:', error);
        alert('Erro ao baixar o GIF.');
    }
}

// Função para criar uma lista de arquivos a partir de um Blob
function createFileList(file) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer.files;
}

// Fechar popup de gifs
function fecharPopup(){
    document.getElementById('popup-gif').style.display = "none";
}