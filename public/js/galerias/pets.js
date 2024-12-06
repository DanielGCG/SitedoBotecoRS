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
    const galeriaRef = ref(storage, 'galeria/pets');
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
    const imagePath = `galeria/pets/${imageName}`;
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

// Função para abrir o popup de confirmação de exclusão
function abrirConfirmacaoDelecao(nomeObra) {
    const popupConfirmacao = document.getElementById('popup-confirmacao');
    const confirmarDelecaoBtn = document.getElementById('confirmarDelecaoBtn');

    // Armazenar o nome da obra que será deletada
    confirmarDelecaoBtn.setAttribute('data-nome-obra', nomeObra);
    
    // Exibe o popup de confirmação
    popupConfirmacao.style.display = 'flex';
}

// Função para confirmar a remoção da obra
async function confirmarRemocao() {
    const confirmarDelecaoBtn = document.getElementById('confirmarDelecaoBtn');
    const nomeObra = confirmarDelecaoBtn.getAttribute('data-nome-obra');
    
    // Deletar a obra no Firebase
    await removerObraNoFirebase(nomeObra);

    // Fechar o popup de confirmação
    fecharConfirmacao();

    fecharPopup();
}

// Função para fechar o popup de confirmação sem excluir
function fecharConfirmacao() {
    const popupConfirmacao = document.getElementById('popup-confirmacao');
    popupConfirmacao.style.display = 'none';
}

// Função para remover a obra no Firebase
async function removerObraNoFirebase(nomeObra) {
    try {
        // Referência ao arquivo no Firebase
        const obraRef = ref(storage, `galeria/pets/${nomeObra}.png`);
        
        // Deletar a obra
        await deleteObject(obraRef);

        // Remover a obra localmente
        obrasLocais = obrasLocais.filter(obra => obra.nome !== nomeObra);

        // Atualizar a galeria
        carregarImagens();
        
        exibirMensagem('Obra removida com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao remover a obra:', error);
        exibirMensagem('Erro ao remover a obra. Tente novamente.', 'error');
    }
}

// Modificar a função de deletar obra para abrir o popup de confirmação
function removerObra(nomeObra) {
    // Chama o popup de confirmação diretamente aqui
    abrirConfirmacaoDelecao(nomeObra);
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

    // Estrutura do popup com campo para editar o nome inicialmente escondido
    popupConteudo.innerHTML = `
        <img id="imagem-popup" src="${url}" alt="">
        <div class="acoes">
            <button class="deletar" onclick="removerObra('${nome}')">Deletar</button>
            <button class="branco" id="editarNomeBtn">Editar</button>
            <button class="branco" onclick="fecharPopup()">Fechar</button>
        </div>
        <div id="campo-editar" style="display: none; margin-top: 10px;">
            <input type="text" id="novoNome" value="${nome}" placeholder="Novo nome">
            <button class="salvar" onclick="editarNomeObra('${nome}', '${url}')">Salvar</button>
        </div>
        <div id="nome-imagem" style="margin-top: 10px;">${nome}</div>
    `;

    // Exibe o popup
    popup.style.display = 'flex';

    // Ação do botão de editar nome
    const editarNomeBtn = document.getElementById('editarNomeBtn');
    const campoEditar = document.getElementById('campo-editar');
    const nomeImagem = document.getElementById('nome-imagem');

    // Quando o botão de editar for clicado, alterna a visibilidade do campo de input e o texto do botão
    editarNomeBtn.addEventListener('click', () => {
        if (campoEditar.style.display === 'none') {
            campoEditar.style.display = 'block';  // Exibe o campo de input
            nomeImagem.style.display = 'none';    // Esconde o nome da obra
            editarNomeBtn.textContent = 'Cancelar'; // Muda o texto do botão para "Cancelar"
        } else {
            campoEditar.style.display = 'none';   // Esconde o campo de input
            nomeImagem.style.display = 'block';   // Exibe o nome da obra
            editarNomeBtn.textContent = 'Editar'; // Muda o texto do botão de volta para "Editar"
        }
    });
}

// Função para editar o nome da obra
async function editarNomeObra(nomeAtual, url) {
    const novoNomeInput = document.getElementById('novoNome');
    const novoNome = novoNomeInput.value.trim();

    // Verifica se o novo nome é diferente do atual
    if (!novoNome || novoNome === nomeAtual) {
        exibirMensagem('Insira um novo nome para a imagem.', 'error');
        return;
    }

    try {
        // Baixa o arquivo atual
        const response = await fetch(url);
        const blob = await response.blob();

        // Referências para o arquivo novo e o antigo no Firebase Storage
        const novaImagemRef = ref(storage, `galeria/pets/${novoNome}.png`);
        const imagemAntigaRef = ref(storage, `galeria/pets/${nomeAtual}.png`);

        // Faz o upload da imagem com o novo nome
        await uploadBytes(novaImagemRef, blob);

        // Remove a imagem antiga
        await deleteObject(imagemAntigaRef);

        // Atualiza localmente: renomeia a obra no array de obrasLocais
        obrasLocais = obrasLocais.map(obra => obra.nome === nomeAtual ? { nome: novoNome, url } : obra);

        // Recarrega as imagens após a atualização
        carregarImagens();

        // Exibe mensagem de sucesso
        exibirMensagem('Nome da obra atualizado com sucesso!', 'success');
        fecharPopup();
    } catch (error) {
        console.error('Erro ao editar o nome da obra:', error);
        exibirMensagem('Erro ao editar o nome da obra. Tente novamente.', 'error');
    }
}

// Função de abrir popup para o formulário de upload
function abrirPopup() {
    const popup = document.getElementById('popup');
    const popupConteudo = document.getElementById('popup-conteudo');
    const imagemPopup = document.getElementById('imagem-popup');
    const nomeImagem = document.getElementById('nome-imagem');
    
    // Defina o conteúdo do popup para o formulário de envio de nova obra
    popupConteudo.innerHTML = `
        <h2>Enviar novo Pet</h2>
        <form id="formUpload" style="margin-top: 10px;">
            <label for="nomeObra">Nome da Obra:</label>
            <input type="text" id="nomeObra" placeholder="Nome do Pet" required>
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
window.editarNomeObra = editarNomeObra;
window.confirmarRemocao = confirmarRemocao;
window.fecharConfirmacao = fecharConfirmacao;
window.abrirConfirmacaoDelecao = abrirConfirmacaoDelecao;