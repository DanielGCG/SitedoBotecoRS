require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cors = require('cors');
const { TwitterApi } = require('twitter-api-v2'); // Importar a biblioteca do Twitter

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS se necessário (caso o frontend esteja em outro domínio)
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

const rwClient = twitterClient.readWrite;

// Rota para postar no Twitter
app.post('/tweet', async (req, res) => {
  const { text } = req.body; // Recebe o texto do tweet enviado na requisição

  if (!text) {
    return res.status(400).send('Texto do tweet é obrigatório.');
  }

  try {
    const tweet = await rwClient.v2.tweet(text); // Envia o tweet com o texto
    res.json({ success: true, message: 'Tweet enviado com sucesso!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao postar o tweet: ' + error.message });
  }
});

// Rota principal
app.use('/', require('./server/routes/main'));

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
