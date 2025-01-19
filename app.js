require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cors = require('cors');
const multer = require('multer');
const { TwitterApi } = require('twitter-api-v2');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const { getDatabase, ref: dbRef, set, get } = require('firebase/database');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do multer para fazer upload de imagens
const storage = multer.memoryStorage(); // Armazenar os arquivos na memória
const upload = multer({ storage });

// Configuração CORS
app.use(cors());

// Middleware para entender o corpo da requisição como JSON
app.use(express.json());

// Adicionando o middleware cookie-parser
app.use(cookieParser());

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
const auth = getAuth(firebaseApp);
const storageFirebase = getStorage(firebaseApp);
const database = getDatabase(firebaseApp);

// Configuração do Twitter API
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Rota de login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user.emailVerified) {
      const idToken = await user.getIdToken();

      // Log para verificar o idToken gerado após o login
      console.log('ID Token gerado no login:', idToken);

      // Define o cookie HttpOnly
      res.cookie('idToken', idToken, {
        httpOnly: true, // Impede que o cookie seja acessado via JavaScript
        secure: process.env.NODE_ENV === 'production', // Só envia o cookie via HTTPS em produção
        maxAge: 60 * 60 * 1000, // Tempo de expiração do cookie em milissegundos (1 hora)
        sameSite: 'Strict', // Evita que o cookie seja enviado em requisições de outros domínios
      });      

      res.status(200).json({
        message: 'Login efetuado com sucesso.',
        userData: { email: user.email, displayName: user.displayName },
      });
    } else {
      res.status(400).json({ error: 'Por favor, verifique seu e-mail antes de continuar.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota de cadastro de usuário
app.post('/register', async (req, res) => {
  const { exibitionName, userTag, email, password } = req.body;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Enviar e-mail de verificação
    await sendEmailVerification(user);

    // Criar um novo usuário no Realtime Database
    const userRef = dbRef(database, `users/${email.replace('.', ',')}`);
    await set(userRef, {
      exibitionName: exibitionName,
      userTag: userTag,
      email: user.email,
      followersList: null,
      followersAmount: 0,
      followingList: null,
      followingAmount: 0,
      friendList: null,
      friendAmount: 0,
      postList: null,
      postAmount: 0,
      pinList: null,
      pinAmount: 0,
      cargo: 0,
      timedOut: false,
      lastTimeOut: null,
      createdAt: new Date().toISOString(),
      // Outros dados do usuário podem ser adicionados aqui
    });

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso. Um e-mail de verificação foi enviado.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para verificar se o e-mail foi verificado
app.post('/verify-email', async (req, res) => {
  const { idToken } = req.body;
  try {
    const userCredential = await auth.verifyIdToken(idToken);
    const user = userCredential.user;

    if (user.emailVerified) {
      res.status(200).json({ message: 'Email verificado com sucesso.' });
    } else {
      res.status(400).json({ error: 'O e-mail ainda não foi verificado.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota de logout
app.post('/logout', (req, res) => {
  res.clearCookie('idToken'); // Limpa o cookie de autenticação
  res.status(200).json({ message: 'Usuário deslogado com sucesso.' });
});

// Função para enviar o log para o Firebase Storage
async function enviarLog(text, userIp, currentDate) {
  try {
    // Verifica se o IP é no formato IPv6 e, se for, converte para IPv4
    const fullIp = userIp.includes('::ffff:') ? userIp.split('::ffff:')[1] : userIp;

    // Formata a data para o formato legível
    const dateObject = new Date(currentDate);
    const formattedDate = dateObject.toLocaleString('pt-BR', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Cria um arquivo de log com os dados
    const logData = `Data: ${formattedDate} | IP: ${fullIp} \nTexto: ${text}\n`;

    // Inicializa o Firebase Storage
    const storage = getStorage();
    const logRef = ref(storage, '/logs/logs.txt');  // Define a referência ao arquivo logs.txt

    let existingLog = '';

    try {
      // Tenta baixar o conteúdo atual do arquivo logs.txt
      const existingLogBytes = await getBytes(logRef);
      existingLog = new TextDecoder().decode(existingLogBytes);  // Decodifica o ArrayBuffer para string
    } catch (error) {
      // Se o arquivo não existir, um erro será lançado, e o arquivo será criado a seguir
      if (error.code === 'storage/object-not-found') {
        console.warn('Arquivo logs.txt não encontrado, criando um novo arquivo...');
      } else {
        // Lança qualquer outro erro
        throw error;
      }
    }

    // Adiciona o novo log ao conteúdo existente (se houver)
    const newLogContent = existingLog + "\n------//------//------\n" + logData;

    // Envia o novo conteúdo para o Firebase Storage (sem sobrescrever, apenas atualiza)
    const logBuffer = new TextEncoder().encode(newLogContent);
    await uploadBytes(logRef, logBuffer);

    console.log('Log enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar log para o Firebase:', error);
  }
}

// Rota para postar no Twitter com mídia
app.post('/tweet-media', upload.single('media'), async (req, res) => {
  const { text, userIp } = req.body; // Captura o IP do usuário enviado do frontend
  const media = req.file;
  const currentDate = new Date().toISOString(); // Obtém a data atual

  // Verifica vagabundo
  const fullIp = userIp.includes('::ffff:') ? userIp.split('::ffff:')[1] : userIp;
  if (fullIp === "0"){
    res.status(500).json({ success: false, message: 'Sossega o cu que eu sei quem é você.'});
    return;
  }

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
    
    if(media){
      // Envia o log para o Firebase Storage com o texto do tweet
      enviarLog(text+" \n(com mídia)", userIp, currentDate); // Passando uma string de erro no log
    }
    else{
      // Envia o log para o Firebase Storage com o texto do tweet
      enviarLog(text, userIp, currentDate); // Passando uma string de erro no log
    }
    
    res.json({ success: true, message: 'Tweet enviado com sucesso!', tweet });
  } catch (error) {
    console.error('Erro ao postar tweet:', error);
    res.status(500).json({ success: false, message: 'Erro ao postar o tweet: ' + error.message });
  }
  if(media){
    // Envia o log para o Firebase Storage com o texto do tweet
    enviarLog(text+" \n(erro ao enviar cutucada com mídia)", userIp, currentDate); // Passando uma string de erro no log
  }
  else{
    // Envia o log para o Firebase Storage com o texto do tweet
    enviarLog(text+" \n(erro ao enviar)", userIp, currentDate); // Passando uma string de erro no log
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

app.get('/watchlistsearch-movies', async (req, res) => {
  const query = req.query.query;
  const BASE_URL = 'https://api.themoviedb.org/3';

  if (!query || query.length < 3) {
    return res.status(400).json({ message: 'Por favor, insira pelo menos 3 caracteres.' });
  }

  // Determinar o idioma, pode ser 'pt-BR' ou 'en-US'
  const language = 'pt-BR';  // Se não houver 'language', usa 'pt-BR' por padrão

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
    const limitedResults = filteredResults.slice(0, 8);

    res.json(limitedResults);  // Enviar apenas filmes e séries, limitados a 6
  } catch (error) {
    console.error('Error fetching movie data:', error);
    res.status(500).json({ message: 'Erro ao buscar filmes.' });
  }
});

app.post('/watchlistupload-movies', async (req, res) => {
  const newMovie = req.body; // Dados do filme/série enviados

  try {
      // Referência ao arquivo JSON consolidado
      const consolidatedFileRef = ref(storageFirebase, 'watchlist/watchlist.json');

      // Baixar o arquivo consolidado atual
      const fileUrl = await getDownloadURL(consolidatedFileRef);
      const response = await fetch(fileUrl);
      const existingMovies = await response.json();

      // Adicionar o novo filme
      existingMovies.push(newMovie);

      // Ordenar os filmes alfabeticamente pelo título
      const sortedMovies = existingMovies.sort((a, b) => {
          const titleA = a.title || a.name;
          const titleB = b.title || b.name;
          return titleA.localeCompare(titleB);
      });

      // Enviar o arquivo atualizado de volta ao Firebase Storage
      const sortedMoviesBuffer = Buffer.from(JSON.stringify(sortedMovies));
      await uploadBytes(consolidatedFileRef, sortedMoviesBuffer);

      res.json({ success: true, message: 'Filme/série adicionado com sucesso.' });
  } catch (error) {
      console.error('Erro ao adicionar filme/série:', error);
      res.status(500).json({ success: false, message: 'Erro ao adicionar filme/série.' });
  }
});

app.delete('/watchlistdelete-movie', async (req, res) => {
  const { id } = req.query; // ID do filme a ser removido

  if (!id) {
      return res.status(400).json({ success: false, message: 'ID do filme/série é obrigatório.' });
  }

  try {
      // Referência ao arquivo JSON consolidado
      const consolidatedFileRef = ref(storageFirebase, 'watchlist/watchlist.json');

      // Baixar o arquivo consolidado atual
      const fileUrl = await getDownloadURL(consolidatedFileRef);
      const response = await fetch(fileUrl);
      const existingMovies = await response.json();

      // Filtrar os filmes para remover o que corresponde ao ID fornecido
      const updatedMovies = existingMovies.filter(movie => String(movie.id) !== String(id));

      // Enviar o arquivo atualizado de volta ao Firebase Storage
      const updatedMoviesBuffer = Buffer.from(JSON.stringify(updatedMovies));
      await uploadBytes(consolidatedFileRef, updatedMoviesBuffer);

      res.json({ success: true, message: 'Filme/série removido com sucesso.' });
  } catch (error) {
      console.error('Erro ao remover filme/série:', error);
      res.status(500).json({ success: false, message: 'Erro ao remover filme/série.' });
  }
});

app.get('/watchlistdownload-movies', async (req, res) => {
  try {
      // Referência ao arquivo JSON consolidado
      const consolidatedFileRef = ref(storageFirebase, 'watchlist/watchlist.json');

      let movies = [];

      try {
          // Tentar obter o URL do arquivo consolidado
          const fileUrl = await getDownloadURL(consolidatedFileRef);

          // Baixar o conteúdo do arquivo, se existir
          const response = await fetch(fileUrl);
          movies = await response.json();
      } catch (error) {
          // Se o arquivo não existir, criamos um arquivo vazio
          if (error.code === 'storage/object-not-found') {
              console.warn('Arquivo "watchlist.json" não encontrado. Criando um novo arquivo vazio.');

              const emptyData = JSON.stringify([]);
              const emptyDataBuffer = Buffer.from(emptyData);

              // Fazer o upload do arquivo vazio no Firebase Storage
              await uploadBytes(consolidatedFileRef, emptyDataBuffer);

              movies = []; // Retornamos uma lista vazia
          } else {
              // Outros erros são propagados
              throw error;
          }
      }

      res.json(movies);
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