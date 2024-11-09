const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './src/index.js',  // O ponto de entrada do seu aplicativo
  output: {
    filename: 'bundle.js',  // Nome do arquivo de saída
    path: path.resolve(__dirname, 'dist')  // Caminho para a pasta de saída
  },
  plugins: [
    new Dotenv()  // O plugin que injeta variáveis de ambiente
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',  // Se estiver usando Babel para compilar o JS
        }
      }
    ]
  }
};
