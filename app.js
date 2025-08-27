require('dotenv').config();
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
app.use('/API/forum', require('./server/routes/forum/get'));
app.use('/API/forum', require('./server/routes/forum/posts'));
app.use('/API/forum', require('./server/routes/forum/profile'));
app.use('/API/forum', require('./server/routes/forum/remove'));
app.use('/API/forum', require('./server/routes/forum/stream'));

// Rota Cutucar
app.use('/API/cutucar', require('./server/routes/cutucar'));

// Rota BSMP Skins
app.use('/API/skins', require('./server/routes/skins'));

// Rota LoRa
app.use('/API/lora', require('./server/routes/lora'));

// Rota MOB
app.use('/API/mob', require('./server/routes/MOB'));

// Rota Galeria
app.use('', require('./server/routes/galeria'));

// Rota watchlist
app.use('', require('./server/routes/watchlist'))

// Rota watchlist
app.use('/API/imagemdodia', require('./server/routes/imagemdodia'))

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