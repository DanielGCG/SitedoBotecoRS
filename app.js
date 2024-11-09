require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS se necessário (caso o frontend esteja em outro domínio)
app.use(cors());

// Middleware para entender o corpo da requisição como JSON
app.use(express.json());

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Serve arquivos estáticos
app.use(express.static('public'));

// Rota principal
app.use('/', require('./server/routes/main'));

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
