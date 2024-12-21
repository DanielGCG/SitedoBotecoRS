require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const { TwitterApi } = require('twitter-api-v2');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do multer para fazer upload de imagens
const storage = multer.memoryStorage(); // Armazenar os arquivos na memória
const upload = multer({ storage });

// Configuração CORS
app.use(cors());

// Middleware para entender o corpo da requisição como JSON
app.use(express.json());

// Middleware para redirecionar para o domínio correto
app.use((req, res, next) => {
  if (req.headers.host === 'boteco.live') {
    return res.redirect(301, `https://www.boteco.live${req.url}`);
  }
  next();
});

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Serve arquivos estáticos
app.use(express.static('public'));

// Configuração do Twitter API
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Configuração do Firebase API
const firebaseConfig = {
  apiKey: process.env.FB_APIKEY,
  authDomain: process.env.FB_AUTHDOMAIN,
  projectId: process.env.FB_PROJECTID,
  storageBucket: process.env.FB_STORAGEBUCKET,
  messagingSenderId: process.env.FB_MESSAGINGSENDERID,
  appId: process.env.FB_APPID
};

const firebaseApp = initializeApp(firebaseConfig);
const storageFirebase = getStorage(firebaseApp);

// Rota para postar no Twitter
app.post('/tweet', async (req, res) => {
  const { text } = req.body; // Recebe o texto do tweet enviado na requisição

  if (!text) {
    return res.status(400).send('Texto do tweet é obrigatório.');
  }

  try {
    const tweet = await twitterClient.v2.tweet(text); // Envia o tweet com o texto
    res.json({ success: true, message: 'Tweet enviado com sucesso!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao postar o tweet: ' + error.message });
  }
});

// Verificar Senha Cutucar
app.post('/verify-senha-cutucar', (req, res) => {
  const { senha } = req.body;
  const predefinedPassword = process.env.SENHACUTUCAR;

  if (senha === predefinedPassword) {
    res.json({ success: true, message: 'Senha correta!' });
  } else {
    res.json({ success: false, message: 'Senha incorreta!' });
  }
});

// Rota para obter a lista de imagens
app.get('/galeriaDownload/:endereco', async (req, res) => {
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
app.post('/galeriaUpload/:endereco/:nome', upload.single('imagem'), async (req, res) => {
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
app.post('/galeriaDelete/:endereco/:nome', upload.single('imagem'), async (req, res) => {
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

app.post('/galeriaEdit/:endereco/:nome/:nomenovo', async (req, res) => {
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

// Rota principal
app.use('/', require('./server/routes/main'));

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});