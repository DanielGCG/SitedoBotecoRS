const express = require('express');
const { ref: dbRef, onValue, get, query, orderByChild, limitToLast, startAt, limitToFirst } = require('firebase/database');
const { database } = require('../../config/firebase');
const router = express.Router();


router.get('/getpublicacao', async (req, res) => {
    let { publicacaoId } = req.query;

    if (!publicacaoId) {
        res.status(400).json({ error: 'publicacaoId é obrigatório.' });
        return;
    }

    const publicacaoRef = dbRef(database, `forum/publicacoes/${publicacaoId}`);

    const snapshot = await get(publicacaoRef);

    if(snapshot.exists()){
        res.status(200).json({ publicacao: snapshot.val() });
    }else{
        res.status(404).json({ error: 'Publicacao não encontrada.' });
    }
});

router.post('/getdestaques', async (req, res) => {
    const { amount, userId } = req.body;
    const limitAmount = Number(amount) || 20;

    try {
        // Buscar as últimas publicações mais recentes
        const publicacoesQuery = query(
            dbRef(database, `forum/publicacoes`),
            orderByChild('ultimoUpdate'),
            limitToLast(limitAmount) // Obtém as publicações mais recentes em ordem crescente
        );

        const snapshot = await get(publicacoesQuery);

        if (!snapshot.exists()) {
            return res.json([]);
        }

        const todasPublicacoes = snapshot.val();
        const userIds = [...new Set(Object.values(todasPublicacoes).map(p => p.userId))]; // Evita buscas repetidas

        // Buscar dados dos usuários em paralelo
        const usersSnapshots = await Promise.all(
            userIds.map(userId => get(dbRef(database, `forum/usuarios/${userId}`)))
        );

        // Criar um cache com os dados dos usuários
        const usersCache = {};
        usersSnapshots.forEach((snap, index) => {
            const userId = userIds[index];
            usersCache[userId] = snap.exists() ? snap.val() : { userTag: "Usuário desconhecido", profileImage: null };
        });

        // Adicionar informações dos usuários às publicações e inverter a ordem
        const publicacoesArray = Object.entries(todasPublicacoes)
            .map(([id, publicacao]) => ({
            id,
            ...publicacao,
            userTag: usersCache[publicacao.userId]?.userTag || "Usuário desconhecido",
            profileImage: usersCache[publicacao.userId]?.profileImage || null,
            adminPermissions: userId?.cargo > 0 ? true : false
            }))
            .sort((a, b) => b.ultimoUpdate - a.ultimoUpdate); // Ordenar manualmente para ter os mais recentes primeiro

        res.json(publicacoesArray);
    } catch (error) {
        console.error("Erro ao buscar a lista de publicações:", error);
        res.status(500).json({ error: "Erro interno ao obter publicações." });
    }
});

router.post('/getuserpublicacoes', async (req, res) => {
    const { amount, userId, userIdRequester } = req.body;
    const limitAmount = Number(amount) || 50;

    try {
        // Buscar as últimas publicações mais recentes
        const publicacoesQuery = query(
            dbRef(database, `forum/publicacoes`),
            orderByChild('userId'),
            startAt(userId),
            limitToFirst(limitAmount) // Obtém as publicações do usuário específico
        );

        const snapshot = await get(publicacoesQuery);

        if (!snapshot.exists()) {
            return res.json([]);
        }

        const todasPublicacoes = snapshot.val();
        const userIds = [...new Set(Object.values(todasPublicacoes).map(p => p.userId))]; // Evita buscas repetidas

        // Buscar dados dos usuários em paralelo
        const usersSnapshots = await Promise.all(
            userIds.map(userId => get(dbRef(database, `forum/usuarios/${userId}`)))
        );

        // Criar um cache com os dados dos usuários
        const usersCache = {};
        usersSnapshots.forEach((snap, index) => {
            const userId = userIds[index];
            usersCache[userId] = snap.exists() ? snap.val() : { userTag: "Usuário desconhecido", profileImage: null };
        });

        // Adicionar informações dos usuários às publicações e inverter a ordem
        const publicacoesArray = Object.entries(todasPublicacoes)
            .map(([id, publicacao]) => ({
            id,
            ...publicacao,
            userTag: usersCache[publicacao.userId]?.userTag || "Usuário desconhecido",
            profileImage: usersCache[publicacao.userId]?.profileImage || null,
            adminPermissions: userIdRequester?.cargo > 0 ? true : false
            }))
            .sort((a, b) => b.ultimoUpdate - a.ultimoUpdate); // Ordenar manualmente para ter os mais recentes primeiro

        res.json(publicacoesArray);
    } catch (error) {
        console.error("Erro ao buscar a lista de publicações:", error);
        res.status(500).json({ error: "Erro interno ao obter publicações." });
    }
});

module.exports = router;