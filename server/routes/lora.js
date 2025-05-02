const express = require('express');
const multer = require('multer');
const { getStorage, ref: stRef, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database'); // Certifique-se de importar corretamente
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { database } = require('../../config/firebase');
const router = express.Router();

router.post('/lora_recive', async (req, res) => {
    try{
        const { mensagem } = req.body;

        if (!mensagem) {
            return res.status(400).json({ erro: 'Mensagem ausente no corpo da requisição.' });
        }

        const mensagemID = crypto.randomUUID();
        const mensagemRef = dbRef(database, `lora/notifications/${mensagemID}`);

        await set(mensagemRef, {
            mensagemID: mensagemID,
            mensagem: mensagem,
            timestamp: Date.now(),
        });

        console.log(`Nova mensagem recebida do LoRa: ${mensagem}`);

        // Aqui você pode salvar a mensagem num banco de dados, arquivo, ou responder para o dispositivo
        res.json({ status: 'Mensagem recebida com sucesso.' });

    } catch (error) {
        console.error('Erro ao salvar mensagem LoRa:', error);
        return res.status(500).json({ erro: 'Erro interno ao processar a mensagem.' });
    }
});

module.exports = router;