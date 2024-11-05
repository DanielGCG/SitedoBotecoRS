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
}

// Carregar as imagens quando a página for carregada
window.onload = carregarImagens;
