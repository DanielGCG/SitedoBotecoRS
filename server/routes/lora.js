const express = require('express');
const multer = require('multer');
const { getStorage, ref: stRef, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database'); // Certifique-se de importar corretamente
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { database } = require('../config/firebase');
const router = express.Router();

router.post('/lora_recive', async (req, res) => {
    try {
        const { mensagem, mensagemID } = req.body;

        // Valida se a mensagem e o ID foram recebidos
        if (!mensagem || !mensagemID) {
            return res.status(400).json({ erro: 'Mensagem ou ID ausentes no corpo da requisição.' });
        }

        // Referência no banco de dados para o ID específico
        const mensagemRef = dbRef(database, `lora/notifications/${mensagemID}`);

        // Salva a mensagem com o ID recebido
        await set(mensagemRef, {
            mensagemID: mensagemID,
            mensagem: mensagem,
            timestamp: Date.now(),
            status: 'enviada'
        });

        console.log(`Nova mensagem recebida do LoRa com ID ${mensagemID}: ${mensagem}`);

        res.json({ status: 'Mensagem recebida com sucesso.' });

    } catch (error) {
        console.error('Erro ao salvar mensagem LoRa:', error);
        return res.status(500).json({ erro: 'Erro interno ao processar a mensagem.' });
    }
});

router.get('/lora_notifications', async (req, res) => {
    try {
        const mensagensRef = dbRef(database, 'lora/notifications');
        const snapshot = await get(mensagensRef);

        if (!snapshot.exists()) return res.json([]);

        const mensagens = snapshot.val();
        const mensagensArray = [];

        for (const id in mensagens) {
            if (mensagens.hasOwnProperty(id)) {
                const dados = mensagens[id];
                mensagensArray.push({
                    id,
                    ...dados
                });
            }
        }

        // Ordena por timestamp decrescente (mais recente primeiro)
        mensagensArray.sort((a, b) => b.timestamp - a.timestamp);

        return res.json(mensagensArray);
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        res.status(500).json({ erro: 'Erro ao buscar notificações.' });
    }
});

router.post('/lora_send', async (req, res) => {
    try {
        const { mensagem } = req.body;

        if (!mensagem) {
            return res.status(400).json({ erro: 'Mensagem é obrigatória.' });
        }

        const novaRef = push(dbRef(database, 'lora/toSend'));

        await set(novaRef, {
            mensagem,
            timestamp: Date.now(),
            status: 'pendente'
        });

        res.json({ status: 'Mensagem registrada para envio ao LoRa.' });
    } catch (error) {
        console.error('Erro ao salvar mensagem para o LoRa:', error);
        res.status(500).json({ erro: 'Erro ao salvar mensagem.' });
    }
});


router

module.exports = router;