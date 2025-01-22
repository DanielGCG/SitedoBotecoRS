const express = require('express');
const multer = require('multer');
const { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { storageFirebase } = require('../config/firebase');
const router = express.Router();

router.get('/watchlistsearch-movies', async (req, res) => {
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

router.post('/watchlistupload-movies', async (req, res) => {
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

router.delete('/watchlistdelete-movie', async (req, res) => {
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

router.get('/watchlistdownload-movies', async (req, res) => {
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

module.exports = router;