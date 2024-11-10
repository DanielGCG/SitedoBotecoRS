import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDuwnu2XcSTJ1YZkgD4570AtE6uKci_nDQ",
    authDomain: "boteco-6fcfa.firebaseapp.com",
    projectId: "boteco-6fcfa",
    storageBucket: "boteco-6fcfa.appspot.com",
    messagingSenderId: "531032694476",
    appId: "1:531032694476:web:6e03bdd824b90fd2b2ec69"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
let obrasLocais = [];


// Carrega imagens locais e Firebase
async function carregarImagensFirebase() {
    const galeriaRef = ref(storage, 'galeria/jogador');
    const result = await listAll(galeriaRef);

    obrasLocais = await Promise.all(result.items.map(async itemRef => {
        const url = await getDownloadURL(itemRef);
        const nome = itemRef.name.split('.png')[0];
        return { nome, url };
    }));

    carregarImagens();
}

async function carregarImagens() {
    const galeria = document.getElementById('galeria');
    galeria.innerHTML = '';

    // Adiciona as imagens à galeria
    obrasLocais.forEach(imagem => {
        adicionarItemLista(imagem.url, imagem.nome);
    });

    // Cria o botão de adicionar imagem
    const adicionarQuadro = document.createElement('div');
    adicionarQuadro.className = 'imagem adicionar-quadro';
    adicionarQuadro.innerHTML = `<span>+</span>`;
    adicionarQuadro.onclick = abrirPopup; // Abre o popup de adicionar imagem

    // Adiciona o botão de adicionar imagem ao final da galeria
    galeria.appendChild(adicionarQuadro);
}

// Adiciona item à lista de imagens
function adicionarItemLista(url, nome) {
    const galeria = document.getElementById('galeria');
    const divImagem = document.createElement('div');
    divImagem.className = 'imagem';
    
    divImagem.innerHTML = `
        <img src="${url}" alt="" onclick="abrirPopupComImagem('${url}', '${nome}')">
        <div class="plaquinha">${nome}</div>
    `;
    
    // Adiciona a imagem antes do quadro de "+"
    galeria.insertBefore(divImagem, galeria.lastChild);
}

// Upload de arquivo para Firebase
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const nomeObraInput = document.getElementById('nomeObra');
    const nomeObra = nomeObraInput.value.trim();

    if (fileInput.files.length === 0) {
        exibirMensagem('Por favor, selecione um arquivo!', 'error');
        return;
    }

    const file = fileInput.files[0];
    if (!file.type.startsWith('image/')) {
        exibirMensagem('Por favor, selecione um arquivo de imagem válido!', 'error');
        return;
    }

    const imageName = `${nomeObra}.png`;
    const imagePath = `galeria/jogador/${imageName}`;
    const imageRef = ref(storage, imagePath);

    try {
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        exibirMensagem('Arquivo enviado com sucesso!', 'success');

        obrasLocais.push({ nome: nomeObra, url: downloadURL });
        adicionarItemLista(downloadURL, nomeObra);
        
        fecharPopup();
        fileInput.value = '';
        nomeObraInput.value = '';
    } catch (error) {
        console.error('Erro ao enviar o arquivo:', error);
        exibirMensagem('Erro ao enviar o arquivo. Verifique a conexão e tente novamente.', 'error');
    }
}

// Remoção de obra do Firebase
async function removerObra(nomeObra) {
    const imagePath = `galeria/jogador/${nomeObra}.png`;
    
    try {
        await deleteObject(ref(storage, imagePath));
        
        obrasLocais = obrasLocais.filter(obra => obra.nome !== nomeObra);
        exibirMensagem('Imagem removida com sucesso!', 'success');
        
        fecharPopup();
        carregarImagens();
    } catch (error) {
        console.error('Erro ao remover a obra:', error);
        exibirMensagem('Erro ao remover a obra. Tente novamente.', 'error');
    }
}

// Exibe mensagem de sucesso/erro
function exibirMensagem(mensagem, tipo) {
    const mensagemDiv = document.getElementById('mensagem');
    mensagemDiv.textContent = mensagem;
    mensagemDiv.className = tipo === 'success' ? 'success' : 'error';
    mensagemDiv.style.display = 'block';

    setTimeout(() => {
        mensagemDiv.style.display = 'none';
    }, 5000);
}

// Função para abrir o popup com a imagem
function abrirPopupComImagem(url, nome) {
    const popup = document.getElementById('popup');
    const popupConteudo = document.getElementById('popup-conteudo');
    const imagemPopup = document.getElementById('imagem-popup');
    const nomeImagem = document.getElementById('nome-imagem');
    
    // Garante que o popup tenha a estrutura de imagem e nome
    popupConteudo.innerHTML = `
        <img id="imagem-popup" src="${url}" alt="Imagem da obra">
        <div class="acoes">
            <button class="deletar" onclick="removerObra('${nome}')">Deletar</button>
            <button class="fechar" onclick="fecharPopup()">Fechar</button>
        </div>
        <div id="nome-imagem" style="margin-top: 10px;">${nome}</div>
    `;

    // Garantir que o layout seja recalculado após a adição da imagem
    setTimeout(() => {
        popup.style.display = 'flex';
    }, 50); // Pequeno atraso para garantir que o layout seja atualizado

    // Exibe o popup
    popup.style.display = 'flex';
}


// Função de abrir popup para o formulário de upload
function abrirPopup() {
    const popup = document.getElementById('popup');
    const popupConteudo = document.getElementById('popup-conteudo');
    const imagemPopup = document.getElementById('imagem-popup');
    const nomeImagem = document.getElementById('nome-imagem');
    
    // Defina o conteúdo do popup para o formulário de envio de nova obra
    popupConteudo.innerHTML = `
        <h2>Enviar nova obra</h2>
        <form id="formUpload">
            <label for="nomeObra">Nome da Obra:</label>
            <input type="text" id="nomeObra" placeholder="Nome da obra" required>
            <br><br>
            <label for="fileInput">Escolha uma imagem:</label>
            <input type="file" id="fileInput" accept="image/*" required>
            <br><br>
            <button type="button" onclick="uploadFile()">Enviar</button>
            <button type="button" onclick="fecharPopup()">Fechar</button>
        </form>
    `;

    // Exibe o popup
    popup.style.display = 'flex';
    popupConteudo.style.display = 'block';
}

// Para a função de fechar o popup
function fecharPopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}

// Tornar as funções globais
window.uploadFile = uploadFile;
window.removerObra = removerObra;
window.abrirPopupComImagem = abrirPopupComImagem; // Corrigido para abrir o popup com imagem
window.fecharPopup = fecharPopup;
window.abrirPopup = abrirPopup;
window.onload = carregarImagensFirebase;

// Carregar imagens do Firebase ao iniciar
