const express = require('express');
const multer = require('multer');
const { getStorage, ref: stRef, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { database } = require('../config/firebase');
const router = express.Router();

// Função para gerar um código legível com base64
function gerarCodigo() {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let codigo = "";
    for (let i = 0; i < 8; i++) {
        const indice = Math.floor(Math.random() * caracteres.length);
        codigo += caracteres[indice];
    }

    return codigo;
}

// Recebe mensagem do LoRa
router.post('/lora_recive', async (req, res) => {
    try {
        const { mensagem, mensagemID } = req.body;

        if (!mensagem || !mensagemID) {
            return res.status(400).json({ erro: 'Mensagem ou ID ausentes no corpo da requisição.' });
        }

        const mensagemRef = dbRef(database, `lora/notifications/${mensagemID}`);

        await set(mensagemRef, {
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

// Obter notificações
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

        mensagensArray.sort((a, b) => b.timestamp - a.timestamp);

        return res.json(mensagensArray);
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        res.status(500).json({ erro: 'Erro ao buscar notificações.' });
    }
});

// Adicionar nova notificação
router.post('/lora_add_notifications', async (req, res) => {
    try {
        const { mensagem, status = 'enviada' } = req.body;

        if (!mensagem) {
            return res.status(400).json({ erro: 'Mensagem é obrigatória.' });
        }

        // Gerar um código personalizado para o ID
        const mensagemID = gerarCodigo();

        // Criar uma referência com o ID gerado manualmente
        const novaRef = dbRef(database, `lora/notifications/${mensagemID}`);

        // Salvar a notificação com o ID gerado
        await set(novaRef, {
            mensagem,
            timestamp: Date.now(),
            status
        });

        res.json({ status: 'Notificação adicionada com sucesso.', id: mensagemID });
    } catch (error) {
        console.error('Erro ao adicionar notificação:', error);
        res.status(500).json({ erro: 'Erro ao adicionar notificação.' });
    }
});

// Remover uma notificação
router.delete('/lora_notifications', async (req, res) => {
    try {
        const { id } = req.body; // Agora o ID será enviado no corpo da requisição

        if (!id) {
            return res.status(400).json({ erro: 'ID da notificação é obrigatório.' });
        }

        const notifRef = dbRef(database, `lora/notifications/${id}`);
        await remove(notifRef);

        res.json({ status: 'Notificação removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover notificação:', error);
        res.status(500).json({ erro: 'Erro ao remover notificação.' });
    }
});

// Enviar mensagem para LoRa
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

// Adicionar nova notificação
router.post('/lora_add_notifications', async (req, res) => {
    try {
        const { mensagem, status = 'enviada' } = req.body;

        if (!mensagem) {
            return res.status(400).json({ erro: 'Mensagem é obrigatória.' });
        }

        // Gerar um código personalizado para o ID
        const mensagemID = gerarCodigo();

        // Criar uma referência com o ID gerado manualmente
        const novaRef = dbRef(database, `lora/notifications/${mensagemID}`);

        // Salvar a notificação com o ID gerado
        await set(novaRef, {
            mensagem,
            timestamp: Date.now(),
            status
        });

        res.json({ status: 'Notificação adicionada com sucesso.', id: mensagemID });
    } catch (error) {
        console.error('Erro ao adicionar notificação:', error);
        res.status(500).json({ erro: 'Erro ao adicionar notificação.' });
    }
});

module.exports = router;