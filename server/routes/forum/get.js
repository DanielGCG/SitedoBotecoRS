const express = require('express');
const { ref: dbRef, onValue, get } = require('firebase/database');
const { database } = require('../../config/firebase');
const router = express.Router();


router.get('/getpublicacao', async (req, res) => {
    let { publicacaoId } = req.query;

    console.log(publicacaoId);

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


module.exports = router;