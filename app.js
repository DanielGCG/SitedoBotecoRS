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

// Configuração do Twitter API
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Rota para postar no Twitter com mídia
app.post('/tweet-media', upload.single('media'), async (req, res) => {
  const { text } = req.body;
  const media = req.file;
  const userIp = req.ip; // Obtém o IP do usuário
  const currentDate = new Date().toISOString(); // Obtém a data atual

  try {
    let mediaId;

    if (media) {
      // Upload da mídia para o Twitter, se houver
      mediaId = await twitterClient.v1.uploadMedia(media.buffer, {
        mimeType: media.mimetype,
      });
    }

    // Publicação do tweet com ou sem mídia
    const tweetOptions = { text };

    if (mediaId) {
      tweetOptions.media = { media_ids: [mediaId] };
    }

    const tweet = await twitterClient.v2.tweet(tweetOptions);

    res.json({ success: true, message: 'Tweet enviado com sucesso!', tweet });
  } catch (error) {
    console.error('Erro ao postar tweet:', error);
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


app.post('/watchlistDelete/:nome', upload.single('imagem'), async (req, res) => {
  const nome = req.params.nome;

  try {
    // Referência ao arquivo no Firebase Storage
    const fileRef = ref(storageFirebase, `listaFilmes/${nome}.png`);

    // Deleta o arquivo
    await deleteObject(fileRef);

    // Responde com sucesso
    res.status(200).json({ success: true, message: 'Arquivo deletado com sucesso!' });
  } catch (error) {
    
    // Trata o erro e responde ao cliente
    res.status(500).json({ success: false, message: 'Erro ao deletar a imagem. Tente novamente.' });
  }
});

app.post('/watchlistUpload/:nome', upload.single('imagem'), async (req, res) => {
  const nome = req.params.nome;
  const imagem = req.file; // Aqui, `imagem` será o arquivo enviado pelo frontend via FormData

  if (!imagem) {
    return res.status(400).json({ success: false, message: 'Nenhum arquivo de imagem enviado.' });
  }
  try {
    // Fazendo o tratamento da imagem antes do upload
    const processedImageBuffer = await sharp(imagem.buffer)
      .resize(478, 641, { // Limita a imagem a 478x641px, mantendo a proporção
        fit: sharp.fit.inside,  // Ajusta para dentro do limite sem cortar
        withoutEnlargement: true, // Não aumenta imagens pequenas
      })
      .toBuffer(); // Converte a imagem processada em buffer para o upload

    const galeriaRef = ref(storageFirebase, `listaFilmes/${nome}.png`);
    
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
});

app.get('/watchlistsearch-movies', async (req, res) => {
  const query = req.query.query;
  const BASE_URL = 'https://api.themoviedb.org/3';

  if (!query || query.length < 3) {
    return res.status(400).json({ message: 'Por favor, insira pelo menos 3 caracteres.' });
  }

  // Determinar o idioma, pode ser 'pt-BR' ou 'en-US'
  const language = req.query.language || 'en-US';  // Se não houver 'language', usa 'pt-BR' por padrão

  try {
    // Normalizar texto para remover acentos e caracteres especiais
    const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Fazer a busca na API do TMDb
    const response = await fetch(`${BASE_URL}/search/multi?api_key=${process.env.TMDB_APIKEY}&query=${encodeURIComponent(normalizedQuery)}&language=${language}`);
    const data = await response.json();

    if (data.results.length === 0) {
      return res.status(404).json({ message: 'No movies found.' });
    }

    // Filtrar apenas filmes e séries
    const filteredResults = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');

    // Limitar para os 6 primeiros resultados
    const limitedResults = filteredResults.slice(0, 6);

    res.json(limitedResults);  // Enviar apenas filmes e séries, limitados a 6
  } catch (error) {
    console.error('Error fetching movie data:', error);
    res.status(500).json({ message: 'Erro ao buscar filmes.' });
  }
});

app.post('/watchlistupload-movies', async (req, res) => {
  const movie = req.body;  // Dados do filme/série enviados

  try {
      // Definindo o nome do arquivo
      const fileName = `${movie.id}.json`;

      // Caminho para o Firebase Storage
      const filePath = `teste/${fileName}`;

      // Convertendo os dados do filme para JSON
      const movieDataBuffer = Buffer.from(JSON.stringify(movie));

      // Referência ao arquivo no Firebase Storage
      const fileRef = ref(storageFirebase, filePath);

      // Fazendo o upload do arquivo JSON para o Firebase Storage
      await uploadBytes(fileRef, movieDataBuffer);

      // Retornando a URL pública do arquivo armazenado no Firebase Storage
      const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${storageFirebase.app.options.storageBucket}/o/${encodeURIComponent(filePath)}?alt=media`;

      res.json({ success: true, fileUrl });
  } catch (error) {
      console.error('Erro ao salvar filme/série:', error);
      res.status(500).json({ success: false, message: 'Erro ao salvar filme/série.' });
  }
});

app.delete('/watchlistdelete-movie', async (req, res) => {
  const { id } = req.query; // Obtém o ID da query string

  if (!id) {
      return res.status(400).json({ success: false, message: 'ID do filme/série é obrigatório.' });
  }

  try {
      // Caminho do arquivo baseado no ID
      const filePath = `teste/${id}.json`;

      // Referência ao arquivo no Firebase Storage
      const fileRef = ref(storageFirebase, filePath);

      // Deletando o arquivo do Firebase Storage
      await deleteObject(fileRef);

      res.json({ success: true, message: `Filme/série com ID ${id} foi deletado com sucesso.` });
  } catch (error) {
      console.error('Erro ao deletar filme/série:', error);

      // Retorna mensagem mais clara com base no tipo de erro
      if (error.code === 'storage/object-not-found') {
          return res.status(404).json({ success: false, message: 'Filme/série não encontrado no servidor.' });
      }

      res.status(500).json({ success: false, message: 'Erro interno ao tentar excluir o filme/série.' });
  }
});

app.get('/watchlistdownload-movies', async (req, res) => {
  try {
      // Referência à pasta onde os filmes/séries estão armazenados
      const listRef = ref(storageFirebase, 'teste/');

      // Obtendo a lista de todos os arquivos na pasta
      const fileList = await listAll(listRef);

      // Criando um array para armazenar os dados dos filmes
      const movies = [];

      // Iterando pelos arquivos para obter os URLs de download
      for (const file of fileList.items) {
          const fileUrl = await getDownloadURL(file);
          
          // Obtendo o nome do arquivo para adicionar aos dados
          const fileName = file.name;

          // Fazendo uma requisição para obter o conteúdo do arquivo JSON
          const response = await fetch(fileUrl);
          const movieData = await response.json();

          // Adicionando o objeto de filme ao array
          movies.push(movieData);
      }

      // Ordenando os filmes pela propriedade 'title' ou 'name' de forma alfabética
      const sortedMovies = movies.sort((a, b) => {
          const titleA = a.title || a.name;
          const titleB = b.title || b.name;
          return titleA.localeCompare(titleB);
      });

      // Retornando os filmes ordenados em formato JSON
      res.json(sortedMovies);

  } catch (error) {
      console.error('Erro ao baixar a lista de filmes:', error);
      res.status(500).json({ success: false, message: 'Erro ao baixar a lista de filmes.' });
  }
});

// Rota principal
app.use('/', require('./server/routes/main'));


// Inicia o servidor
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});