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
}

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Função para buscar a imagem do dia
async function buscarImagemDoDia() {
    const pasta = "imagensdodia/"; // Pasta onde as imagens estão armazenadas
    const imagemRef = ref(storage, pasta);

    try {
        // Listar todos os arquivos na pasta imagensdodia
        const resultado = await listAll(imagemRef);
        const imagens = resultado.items;

        // Encontrar a imagem que começa com "imagemdodia"
        const imagemDoDia = imagens.find(imagem => imagem.name.startsWith("imagemdodia"));

        if (!imagemDoDia) {
            console.log("Nenhuma imagem do dia encontrada.");
            return;
        }

        // Obter URL de download da imagem
        const urlImagem = await getDownloadURL(imagemDoDia);

        // Extrair o nome da imagem (remover "imagemdodia" e a data)
        const nomeImagem = imagemDoDia.name.replace(/^imagemdodia-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.\d{3}Z-/, '').split('.').slice(0, -1).join('.');

        // Atualizar a página com a imagem e o nome
        document.querySelector('.imagem-do-dia img').src = urlImagem;
        document.querySelector('.plaquinha a').textContent = nomeImagem; // Exibe o nome na plaquinha
        document.querySelector('.plaquinha a').href = ``; // Atualiza o link, se necessário

    } catch (error) {
        console.error("Erro ao buscar a imagem do dia:", error);
    }
}

// Chama a função para buscar a imagem do dia ao carregar a página
window.onload = buscarImagemDoDia;