const express = require('express');
const multer = require('multer');
const { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { storageFirebase } = require('../config/firebase');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

// Rota para obter a lista de imagens
router.get('/galeriaDownload/:endereco', async (req, res) => {
  const endereco = req.params.endereco;

  try {
    const galeriaRef = ref(storageFirebase, `galeria/${endereco}`);
    const result = await listAll(galeriaRef);

    const obras = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const nome = itemRef.name.split('.').slice(0, -1).join('.'); // Remove a extensão
        return { nome, url };
      })
    );

    res.json({ success: true, obras });
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
    res.status(500).json({ success: false, message: 'Erro ao carregar obras.' });
  }
});

// Rota para upload de imagens para o Firebase Storage
router.post('/galeriaUpload/:endereco/:nome', upload.single('imagem'), async (req, res) => {
  const endereco = req.params.endereco;
  const nome = req.params.nome;
  const imagem = req.file; // Aqui, `imagem` será o arquivo enviado pelo frontend via FormData
  if (!imagem) {
    return res.status(400).json({ success: false, message: 'Nenhum arquivo de imagem enviado.' });
  }
  if (endereco === "jogador"){
    try {
      const galeriaRef = ref(storageFirebase, `galeria/${endereco}/${nome}`);
      
      // Fazendo o upload do arquivo para o Firebase Storage
      const snapshot = await uploadBytes(galeriaRef, imagem.buffer);
  
      // Obtém a URL de download do arquivo enviado
      const downloadURL = await getDownloadURL(snapshot.ref);
  
      // Envia a resposta com a URL do arquivo enviado
      res.json({ success: true, message: 'Arquivo enviado com sucesso!', downloadURL });
    } catch (error) {
      console.error('Erro ao fazer upload para o Firebase:', error);
      res.status(500).json({ success: false, message: 'Erro ao fazer upload para o Firebase.' });
    }
  }
  else{
    try {
      // Fazendo o tratamento da imagem antes do upload
      const processedImageBuffer = await sharp(imagem.buffer)
        .resize(1080, 720, { // Limita a imagem a 1080x720px, mantendo a proporção
          fit: sharp.fit.inside,  // Ajusta para dentro do limite sem cortar
          withoutEnlargement: true, // Não aumenta imagens pequenas
        })
        .toBuffer(); // Converte a imagem processada em buffer para o upload
  
      const galeriaRef = ref(storageFirebase, `galeria/${endereco}/${nome}`);
      
      // Fazendo o upload do arquivo para o Firebase Storage
      const snapshot = await uploadBytes(galeriaRef, processedImageBuffer);
  
      // Obtém a URL de download do arquivo enviado
      const downloadURL = await getDownloadURL(snapshot.ref);
  
      // Envia a resposta com a URL do arquivo enviado
      res.json({ success: true, message: 'Arquivo enviado com sucesso!', downloadURL });
    } catch (error) {
      console.error('Erro ao fazer upload para o Firebase:', error);
      res.status(500).json({ success: false, message: 'Erro ao fazer upload para o Firebase.' });
    }
  }
});

// Rota deleção de imagens do Firebase Storage
router.post('/galeriaDelete/:endereco/:nome', upload.single('imagem'), async (req, res) => {
  const endereco = req.params.endereco;
  const nome = req.params.nome;

  try {
    // Referência ao arquivo no Firebase Storage
    const fileRef = ref(storageFirebase, `galeria/${endereco}/${nome}.png`);

    // Deleta o arquivo
    await deleteObject(fileRef);

    // Responde com sucesso
    res.status(200).json({ success: true, message: 'Arquivo deletado com sucesso!' });
  } catch (error) {
    
    // Trata o erro e responde ao cliente
    res.status(500).json({ success: false, message: 'Erro ao deletar a imagem. Tente novamente.' });
  }
});

async function renameFile(oldPath, newPath) {
  try {
    const oldRef = ref(storageFirebase, oldPath);
    const newRef = ref(storageFirebase, newPath);

    const fileContent = await getBytes(oldRef);

    // Faz o upload do arquivo com o novo nome
    await uploadBytes(newRef, fileContent);

    // Exclui o arquivo antigo
    await deleteObject(oldRef);

    return { success: true, message: `Arquivo renomeado para ${newPath}` };
  } catch (error) {
    console.error('Erro ao renomear arquivo:', error);
    return { success: false, error: error.message };
  }
}

router.post('/galeriaEdit/:endereco/:nome/:nomenovo', async (req, res) => {
  const { endereco, nome, nomenovo } = req.params;

  const oldPath = `galeria/${endereco}/${nome}`;
  const newPath = `galeria/${endereco}/${nomenovo}`;

  try {
    const result = await renameFile(oldPath, newPath);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.json({ success: false});
    }
  } catch (error) {
    console.error('Erro no endpoint:', error);
    return res.status(500).send({ success: false, error: error.message });
  }
});

module.exports = router;