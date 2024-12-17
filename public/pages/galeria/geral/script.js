let obrasLocais = [];

// Carrega imagens
async function carregarObrasFirebase(endereco) {
    try {
        const response = await fetch(`/galeriaDownload/${endereco}`);
        const data = await response.json();

        if (!data.success) {
            console.error('Erro ao carregar obras:', data.message);
            return;
        }

        obrasLocais = data.obras;
        carregarObras();
    } catch (error) {
        console.error('Erro ao buscar obras do backend:', error);
    }
}

function adicionarItemLista(url, nome) {
    const galeria = document.getElementById('galeria');
    const divObra = document.createElement('div');
    divObra.className = 'imagem';
    
    divObra.innerHTML = `
        <img src="${url}" alt="" onclick="abrirPopupComImagem('${url}', '${nome}')">
        <div class="plaquinha">${nome}</div>
    `;
    
    galeria.insertBefore(divObra, galeria.lastChild);
}

function abrirConfirmacaoDelecao(nomeObra) {
    const popupConfirmacao = document.getElementById('popup-confirmacao');
    const confirmarDelecaoBtn = document.getElementById('confirmarDelecaoBtn');
    confirmarDelecaoBtn.setAttribute('data-nome-obra', nomeObra);
    popupConfirmacao.style.display = 'flex';
}

async function confirmarRemocao() {
    const confirmarDelecaoBtn = document.getElementById('confirmarDelecaoBtn');
    const nomeObra = confirmarDelecaoBtn.getAttribute('data-nome-obra');
    
    await removerObraNoFirebase(nomeObra);
    fecharConfirmacao();
    fecharPopup();
}

function fecharConfirmacao() {
    const popupConfirmacao = document.getElementById('popup-confirmacao');
    popupConfirmacao.style.display = 'none';
}

async function removerObraNoFirebase(nomeObra) {
    try {
        const response = await fetch(`/galeriaDelete/${endereco}/${nomeObra}`, {
            method: 'POST', // Alinhe o método com o backend
        });

        // Certifique-se de consumir o body apenas uma vez
        const result = await response.json();

        if (result.success) {
            console.log(result.message);
            exibirMensagem('Obra removida com sucesso!', 'success');

            // Remove a obra do vetor obrasLocais
            obrasLocais = obrasLocais.filter(obra => obra.nome !== nomeObra);
            carregarObras();  // Atualiza a galeria sem a obra deletada
        } else {
            console.error('Erro:', result.message);
            exibirMensagem('Erro ao remover a obra. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro ao remover a obra no backend:', error);
        exibirMensagem('Erro ao conectar com o servidor.', 'error');
    }
}

async function carregarObras() {
    const galeria = document.getElementById('galeria');
    galeria.innerHTML = '';

    obrasLocais.forEach(obra => {
        adicionarItemLista(obra.url, obra.nome);
    });

    const adicionarQuadro = document.createElement('div');
    adicionarQuadro.className = 'imagem adicionar-quadro';
    adicionarQuadro.innerHTML = `<span>+</span>`;
    adicionarQuadro.onclick = abrirPopup;

    galeria.appendChild(adicionarQuadro);
}

async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const nomeObraInput = document.getElementById('nomeObra');
    const nomeObra = nomeObraInput.value.trim();
    const nomeArquivo = nomeObra + ".png";

    if (fileInput.files.length === 0) {
        exibirMensagem('Por favor, selecione um arquivo!', 'error');
        return;
    }

    const file = fileInput.files[0];
    if (!file.type.startsWith('image/')) {
        fecharPopup();
        alert("Por favor, selecione um arquivo de imagem válido!");
        exibirMensagem('Por favor, selecione um arquivo de imagem válido!', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('imagem', file);

        const response = await fetch(`/galeriaUpload/${endereco}/${nomeArquivo}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            exibirMensagem('Arquivo enviado com sucesso!', 'success');
            // Adiciona a nova obra ao vetor de obrasLocais
            obrasLocais.push({ nome: nomeObra, url: `/path/to/image/${nomeArquivo}` });
            carregarObras();  // Atualiza a galeria com a nova obra
        } else {
            exibirMensagem(data.message || 'Erro desconhecido.', 'error');
        }

        fecharPopup();
        fileInput.value = '';
        nomeObraInput.value = '';
    } catch (error) {
        console.error('Erro ao enviar o arquivo:', error);
        exibirMensagem('Erro ao enviar o arquivo. Verifique a conexão e tente novamente.', 'error');
    }
}

function exibirMensagem(mensagem, tipo) {
    const mensagemDiv = document.getElementById('mensagem');
    mensagemDiv.textContent = mensagem;
    mensagemDiv.className = tipo === 'success' ? 'success' : 'error';
    mensagemDiv.style.display = 'block';

    setTimeout(() => {
        mensagemDiv.style.display = 'none';
    }, 5000);
}

function abrirPopupComImagem(url, nome) {
    const popup = document.getElementById('popup');
    const popupConteudo = document.getElementById('popup-conteudo');

    popupConteudo.innerHTML = `
        <img id="imagem-popup" src="${url}" alt="Imagem da obra">
        <div class="acoes">
            <button class="deletar" onclick="abrirConfirmacaoDelecao('${nome}')">Deletar</button>
            <button class="branco" id="editarNomeBtn">Editar</button>
            <button class="branco" onclick="fecharPopup()">Fechar</button>
        </div>
        <div id="campo-editar" style="display: none; margin-top: 10px;">
            <input type="text" id="novoNome" value="${nome}" placeholder="Novo nome">
            <button class="salvar" onclick="editarNomeObra('${nome}', '${url}')">Salvar</button>
        </div>
        <div id="nome-imagem" style="margin-top: 10px;">${nome}</div>
    `;

    popup.style.display = 'flex';
    const editarNomeBtn = document.getElementById('editarNomeBtn');
    const campoEditar = document.getElementById('campo-editar');
    const nomeImagem = document.getElementById('nome-imagem');

    editarNomeBtn.addEventListener('click', () => {
        if (campoEditar.style.display === 'none') {
            campoEditar.style.display = 'block';
            nomeImagem.style.display = 'none';
            editarNomeBtn.textContent = 'Cancelar';
        } else {
            campoEditar.style.display = 'none';
            nomeImagem.style.display = 'block';
            editarNomeBtn.textContent = 'Editar';
        }
    });
}

async function editarNomeObra(nomeAtual, url) {
    const novoNomeInput = document.getElementById('novoNome');
    const novoNome = novoNomeInput.value.trim();

    if (!novoNome || novoNome === nomeAtual) {
        exibirMensagem('Insira um novo nome para a imagem.', 'error');
        return;
    }

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const novaImagemRef = ref(storage, `galeria/${endereco}/${novoNome}.png`);
        const imagemAntigaRef = ref(storage, `galeria/${endereco}/${nomeAtual}.png`);

        await uploadBytes(novaImagemRef, blob);
        await deleteObject(imagemAntigaRef);

        // Atualiza o nome no vetor obrasLocais
        obrasLocais = obrasLocais.map(obra => 
            obra.nome === nomeAtual ? { nome: novoNome, url } : obra
        );
        carregarObras();  // Atualiza a galeria com o nome da obra alterado

        obrasLocais = obrasLocais.map(obra => obra.nome === nomeAtual ? { nome: novoNome, url } : obra);
        carregarObras();

        exibirMensagem('Nome da obra atualizado com sucesso!', 'success');
        fecharPopup();
    } catch (error) {
        console.error('Erro ao editar o nome da obra:', error);
        exibirMensagem('Erro ao editar o nome da obra. Tente novamente.', 'error');
    }
}

function abrirPopup() {
    const popup = document.getElementById('popup');
    const popupConteudo = document.getElementById('popup-conteudo');
    const imagemPopup = document.getElementById('imagem-popup');
    const nomeImagem = document.getElementById('nome-imagem');

    popupConteudo.innerHTML = `
        <h2>Enviar obra</h2>
        <form id="formUpload" style="margin-top: 10px;">
            <label for="nomeObra">Nome da Obra:</label>
            <input type="text" id="nomeObra" placeholder="nome da obra" required>
            <br><br>
            <label for="fileInput">Escolha uma imagem:</label>
            <input type="file" id="fileInput" accept="image/*" required>
            <br><br>
            <button type="button" onclick="uploadFile()">Enviar</button>
            <button type="button" onclick="fecharPopup()">Fechar</button>
        </form>
    `;

    popup.style.display = 'flex';
    popupConteudo.style.display = 'block';
}

function fecharPopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => carregarObrasFirebase(endereco));

// Tornar as funções globais
window.uploadFile = uploadFile;
window.abrirConfirmacaoDelecao = abrirConfirmacaoDelecao;
window.abrirPopupComImagem = abrirPopupComImagem;
window.editarNomeObra = editarNomeObra;
window.removerObraNoFirebase = removerObraNoFirebase;
window.fecharPopup = fecharPopup;
window.carregarObras = carregarObras;
window.confirmarRemocao = confirmarRemocao;
window.fecharConfirmacao = fecharConfirmacao;