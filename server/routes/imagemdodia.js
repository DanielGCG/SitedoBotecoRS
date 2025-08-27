const express = require('express');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/dbconfig');
const router = express.Router();

// Lista todas as imagens do dia já ativadas (start_at IS NOT NULL), da mais recente para a mais antiga
router.get('/ativas', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
        'SELECT id, url, border_url, texto, created_at, start_at FROM br_imagemdodia WHERE start_at IS NOT NULL ORDER BY start_at DESC'
    );
    await connection.end();
    res.json(rows);
});
// Ativa manualmente a próxima imagem da fila
router.post('/next', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Pega a próxima da fila
        const [rows] = await connection.execute(
            'SELECT id FROM br_imagemdodia WHERE start_at IS NULL ORDER BY created_at ASC LIMIT 1'
        );
        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Nenhuma imagem na fila.' });
        }
        const prox_id = rows[0].id;
        await connection.execute(
            'UPDATE br_imagemdodia SET start_at = NOW() WHERE id = ?',
            [prox_id]
        );
        await connection.end();
        res.json({ message: 'Imagem ativada com sucesso.', id: prox_id });
    } catch (err) {
        await connection.end();
        res.status(500).json({ message: 'Erro ao ativar próxima imagem.', error: err.message });
    }
});

// Retorna o número de imagens na fila
router.get('/fila/count', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    // Conta imagens na fila
    const [rows] = await connection.execute(
        'SELECT COUNT(*) AS count FROM br_imagemdodia WHERE start_at IS NULL'
    );
    // Verifica se há imagem ativa
    const [activeRows] = await connection.execute(
        'SELECT id FROM br_imagemdodia WHERE start_at IS NOT NULL ORDER BY start_at DESC LIMIT 1'
    );
    await connection.end();
    res.json({ count: rows[0].count, hasActive: activeRows.length > 0 });
});

// Lista todas as imagens na fila
router.get('/fila', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
        'SELECT id, url, texto, created_at FROM br_imagemdodia WHERE start_at IS NULL ORDER BY created_at ASC'
    );
    await connection.end();
    res.json(rows);
});

// Remove imagem da fila (e do servidor de arquivos)
router.delete('/fila/:id', async (req, res) => {
    const id = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Busca imagem na fila
        const [rows] = await connection.execute(
            'SELECT url FROM br_imagemdodia WHERE id = ? AND start_at IS NULL',
            [id]
        );
        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Imagem não encontrada na fila.' });
        }
        const url = rows[0].url;
        // Remove do banco
        await connection.execute('DELETE FROM br_imagemdodia WHERE id = ?', [id]);
        await connection.end();
        // Remove do servidor de arquivos
        try {
            // Extrai caminho relativo da url
            const urlObj = new URL(url, 'http://localhost');
            let relPath = urlObj.pathname;
            // Remove /files/ do início se existir
            if (relPath.startsWith('/files/')) relPath = relPath.substring(7);
            // Chama API do servidor de arquivos
            const axios = require('axios');
            await axios.delete(process.env.SERVIDORDEARQUIVOS_URL + '/delete', {
                headers: {
                    'x-api-key': process.env.SERVIDORDEARQUIVOS_KEY,
                    'Content-Type': 'application/json'
                },
                data: { filepath: relPath }
            });
        } catch (err) {
            // Não bloqueia remoção se falhar
            return res.json({ message: 'Removido do banco. Falha ao remover arquivo.', error: err.message });
        }
        res.json({ message: 'Imagem removida com sucesso.' });
    } catch (err) {
        await connection.end();
        res.status(500).json({ message: 'Erro ao remover imagem.', error: err.message });
    }
});

// Busca a imagem do dia (a ativa)
router.get('/', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
        'SELECT * FROM br_imagemdodia WHERE start_at IS NOT NULL ORDER BY start_at DESC LIMIT 1'
    );
    await connection.end();

    if (rows.length > 0) {
        res.json(rows[0]);
    } else {
        res.status(404).json({ message: 'Imagem do dia não encontrada.' });
    }
});



// Adiciona nova imagem (faz upload para servidor externo)
router.post('/', async (req, res, next) => {
    // Requires dentro da função
    const multer = require('multer');
    const axios = require('axios');
    const FormData = require('form-data');
    const upload = multer({ storage: multer.memoryStorage() });

    const multiUpload = upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'border', maxCount: 1 }
    ]);
    multiUpload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: 'Erro no upload do arquivo.', error: err.message });
        }
        const { texto } = req.body;
        if (!req.files || !req.files['file'] || !texto) {
            return res.status(400).json({ message: 'Campos obrigatórios: file, texto.' });
        }

        try {
            // Upload imagem principal
            const form = new FormData();
            form.append('file', req.files['file'][0].buffer, req.files['file'][0].originalname);
            form.append('folder', 'imagemdodia');
            const uploadRes = await axios.post(
                process.env.SERVIDORDEARQUIVOS_URL + '/upload?folder=imagemdodia',
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        'x-api-key': process.env.SERVIDORDEARQUIVOS_KEY
                    }
                }
            );
            const url = uploadRes.data.url;

            // Upload da moldura se enviada
            let border_url = '';
            if (req.files['border'] && req.files['border'][0]) {
                const borderForm = new FormData();
                borderForm.append('file', req.files['border'][0].buffer, req.files['border'][0].originalname);
                borderForm.append('folder', 'imagemdodia/borders');
                const borderRes = await axios.post(
                    process.env.SERVIDORDEARQUIVOS_URL + '/upload?folder=imagemdodia/borders',
                    borderForm,
                    {
                        headers: {
                            ...borderForm.getHeaders(),
                            'x-api-key': process.env.SERVIDORDEARQUIVOS_KEY
                        }
                    }
                );
                border_url = borderRes.data.url;
            }

            // Salva no banco
            const connection = await mysql.createConnection(dbConfig);
            const [result] = await connection.execute(
                'INSERT INTO br_imagemdodia (url, border_url, texto) VALUES (?, ?, ?)',
                [url, border_url, texto]
            );
            await connection.end();
            res.status(201).json({ id: result.insertId, url, border_url, texto });
        } catch (err) {
            res.status(500).json({ message: 'Erro ao adicionar imagem.', error: err.message });
        }
    });
});

module.exports = router;