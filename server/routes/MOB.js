const express = require('express');
const multer = require('multer');
const { getStorage, ref: stRef, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { database } = require('../config/firebase');
const router = express.Router();

// Rota para receber dados GPS e salvar no Firebase
router.post('/nunca_so_gps', async (req, res) => {
  try {
    const { latitude, longitude, altitude, velocidade, data, hora } = req.body;

    // Validação simples
    if (
      latitude === undefined || longitude === undefined ||
      altitude === undefined || velocidade === undefined ||
      !data || !hora
    ) {
      return res.status(400).json({ erro: 'Todos os campos GPS são obrigatórios.' });
    }

    // Referência no Firebase (pode ajustar caminho se quiser)
    const novaRef = dbRef(database, `gps_data/`);
    const novoDadoRef = push(novaRef);

    // Salvar os dados GPS no banco
    await set(novoDadoRef, {
    latitude,
    longitude,
    altitude,
    velocidade,
    data,
    hora,
    timestamp: Date.now()
    });

    res.json({ status: true, id: gpsID, mensagem: 'Dados GPS adicionados com sucesso.' });
  } catch (error) {
    console.error('Erro ao adicionar dados GPS:', error);
    res.status(500).json({ erro: 'Erro ao adicionar dados GPS.' });
  }
});

// Rota para retornar os dados GPS em formato JSON
router.get('/ver_gps', async (req, res) => {
  try {
    const gpsRef = dbRef(database, 'gps_data');
    const snapshot = await get(gpsRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ erro: 'Nenhum dado GPS encontrado.' });
    }

    const dados = snapshot.val();
    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar dados GPS:', error);
    res.status(500).json({ erro: 'Erro ao buscar dados GPS.' });
  }
});


module.exports = router;