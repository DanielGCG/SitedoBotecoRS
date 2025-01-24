require('dotenv').config();
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cors = require('cors');
const multer = require('./server/config/multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(multer.single('file'));

app.use((req, res, next) => {
    if (req.headers.host === 'boteco.live') {
      return res.redirect(301, `https://www.boteco.live${req.url}`);
    }
    next();
  });

app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Rotas Fórum
app.use('/API/forum', require('./server/routes/forum/auth'));
app.use('/API/forum', require('./server/routes/forum/profile'));
app.use('/API/forum', require('./server/routes/forum/stream'));
app.use('/API/forum', require('./server/routes/forum/posts'));

// Rota Cutucar
app.use('', require('./server/routes/cutucar'));

// Rota Galeria
app.use('', require('./server/routes/galeria'));

// Rota watchlist
app.use('', require('./server/routes/watchlist'))

// Rota principal
app.use('/', require('./server/routes/main'));

// Iniciar o servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Tratar encerramento de processo para liberar a porta
const shutdown = () => {
  console.log('Encerrando servidor...');
  server.close(() => {
      console.log('Servidor encerrado com sucesso.');
      process.exit(0);
  });
};

// Escutar sinais de interrupção e finalização do processo
process.on('SIGINT', shutdown); // Ctrl+C no terminal
process.on('SIGTERM', shutdown); // Finalização pelo sistema