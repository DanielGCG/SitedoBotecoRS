// Exemplo de URLs de imagens que você pode usar
const imagens = [
    "/img/imagemdodia.jpg",
    "/img/imagemdodia.jpg",
    "/img/imagemdodia.jpg",
    "/img/imagemdodia.jpg",
    "/img/imagemdodia.jpg",
    "/img/imagemdodia.jpg"
];

function carregarImagens() {
    const galeria = document.getElementById('galeria');

    imagens.forEach(url => {
        const divImagem = document.createElement('div');
        divImagem.className = 'imagem';
        divImagem.innerHTML = `<img src="${url}" alt="Imagem">`;
        galeria.appendChild(divImagem);
    });

    exibirMensagem(`Total de imagens carregadas: ${imagens.length}`, 'success');
}

function exibirMensagem(mensagem, tipo) {
    const mensagemDiv = document.getElementById('mensagem');
    mensagemDiv.textContent = mensagem;
    mensagemDiv.style.display = 'block';
    mensagemDiv.style.color = tipo === 'success' ? 'green' : 'red';
    
    setTimeout(() => {
        mensagemDiv.style.display = 'none';
    }, 5000);
}

// Carregar as imagens quando a página for carregada
window.onload = carregarImagens;
