const express = require('express');
const { getStorage, ref: stRef, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { ref: dbRef, update, push, get, set, remove, query, orderByChild, equalTo } = require('firebase/database');
const { database } = require('../../config/firebase');
const router = express.Router();

// Rota para receber dados do dispositivo de conforto termico e salvar no Firebase
router.post('/receber_dados_conforto_termico', async (req, res) => {
  try {
    const { id_linha, b1, b2, b3, b4, id_dispositivo } = req.body;

    if (
      id_linha === undefined || b1 === undefined ||
      b2 === undefined || b3 === undefined || b4 === undefined || id_dispositivo === undefined
    ) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    const linhaRef = dbRef(database, `confortoTermico/${id_dispositivo}`);

    // Busca os dados atuais
    const snapshot = await get(linhaRef);
    let dadosAtuais = snapshot.exists() ? snapshot.val() : { b1: 0, b2: 0, b3: 0, b4: 0 };

    // Incrementa os valores
    const novosDados = {
      id_dispositivo,
      id_linha,
      b1: Number(dadosAtuais.b1 || 0) + Number(b1),
      b2: Number(dadosAtuais.b2 || 0) + Number(b2),
      b3: Number(dadosAtuais.b3 || 0) + Number(b3),
      b4: Number(dadosAtuais.b4 || 0) + Number(b4),
      ultimoUpdate: Date.now()
    };

    await set(linhaRef, novosDados);

    res.json({ status: true, id: id_linha, mensagem: 'Dados incrementados com sucesso.' });
  } catch (error) {
    console.error('Erro ao adicionar dados:', error);
    res.status(500).json({ erro: 'Erro ao adicionar dados.' });
  }
});

// Rota para buscar todas as linhas de conforto térmico
router.get('/todas_linhas_conforto_termico', async (req, res) => {
  try {
    const linhasRef = dbRef(database, 'confortoTermico');
    const snapshot = await get(linhasRef);

    if (!snapshot.exists()) {
      return res.json({ status: true, linhas: {} });
    }

    res.json({ status: true, linhas: snapshot.val() });
  } catch (error) {
    console.error('Erro ao buscar linhas:', error);
    res.status(500).json({ erro: 'Erro ao buscar linhas.' });
  }
});

// Rota para buscar uma linha específica de conforto térmico
router.get('/linha_conforto_termico/:id_linha', async (req, res) => {
  try {
    const { id_linha } = req.params;
    const linhasRef = dbRef(database, 'confortoTermico');
    const {  } = require('firebase/database');

    // Cria uma query para buscar por id_linha dentro de confortoTermico
    const linhaQuery = query(linhasRef, orderByChild('id_linha'), equalTo(id_linha));
    const snapshot = await get(linhaQuery);

    if (!snapshot.exists()) {
      return res.status(404).json({ status: false, mensagem: 'Linha não encontrada.' });
    }

    // snapshot.val() retorna um objeto com os dispositivos que possuem esse id_linha
    res.json({ status: true, linhas: snapshot.val() });
  } catch (error) {
    console.error('Erro ao buscar linha:', error);
    res.status(500).json({ erro: 'Erro ao buscar linha.' });
  }
});

module.exports = router;