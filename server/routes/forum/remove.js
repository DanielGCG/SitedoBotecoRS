const express = require('express');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database'); // Certifique-se de importar corretamente
const { database } = require('../../config/firebase');
const router = express.Router();

router.post('/removerdiscussao', async (req, res) => {
    const { userTag, categoriaId, discussaoId } = req.body;
  
    // Validação dos dados de entrada
    if (!userTag || !categoriaId || !discussaoId) {
      return res.status(400).json({ error: 'O conteúdo precisa de userTag, categoriaId e discussaoId.' });
    }
  
    try {
      // Referências no Firebase
      const discussaoHeaderRef = dbRef(database, `forum/publicacoes/headers/discussoes/${categoriaId}/${discussaoId}`);
      const discussaoRef = dbRef(database, `forum/publicacoes/${userTag}/discussoes/${categoriaId}/${discussaoId}`);
      const userRef = dbRef(database, `/forum/usuarios/${userTag}`);
      const dicussaoHeaderInUsersRef = dbRef(database, `forum/publicacoes/headers/users/${userTag}/discussoes/${categoriaId}/${discussaoId}`);
  
      // Remoção da discussão
      await remove(discussaoHeaderRef);
      await remove(dicussaoHeaderInUsersRef);
      await remove(discussaoRef);
  
      // Atualização do discussaoAmount no usuário
      const userSnapshot = await get(userRef);
  
      if (userSnapshot.exists()) {
        const currentAmount = parseInt(userSnapshot.val().discussaoAmount, 10) || 0;
        const newAmount = Math.max(currentAmount - 1, 0); // Garante que não fique negativo
  
        await update(userRef, { discussaoAmount: newAmount });
      } else {
        // Inicializa o valor se o nó não existir (embora improvável)
        await set(userRef, { discussaoAmount: 0 });
      }
  
      res.status(200).json({ message: 'Discussão removida com sucesso e desassociada ao usuário.' });
    } catch (error) {
      console.error('Erro ao remover no Firebase:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
  
router.post('/removerdiscussaopost', async (req, res) => {
    const { postId, categoriaId, discussaoId, userTag, userTagCreator } = req.body;

    // Validação dos dados de entrada
    if (!postId || !categoriaId || !discussaoId || !userTag) {
        return res.status(400).json({ error: 'O conteúdo precisa de postId, categoriaId, discussaoId e userTag.' });
    }

    try {
        // Referências no Firebase
        const discussaoHeaderRef = dbRef(
        database,
        `forum/publicacoes/headers/discussoes/${categoriaId}/${discussaoId}`
        );
        const dicussaoHeaderInUsersRef = dbRef(
        database,
        `forum/publicacoes/headers/users/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}`
        );
        const discussaoPostRef = dbRef(
        database,
        `forum/publicacoes/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}/${postId}`
        );

        // Remoção do post
        await remove(discussaoPostRef);

        // Atualização do postAmount nas headers
        const userSnapshot = await get(dicussaoHeaderInUsersRef);

        if (userSnapshot.exists()) {
        const currentAmount = parseInt(userSnapshot.val().postAmount, 10) || 0;
        const newAmount = Math.max(currentAmount - 1, 0); // Garante que não fique negativo

        await update(discussaoHeaderRef, { postAmount: newAmount });
        await update(dicussaoHeaderInUsersRef, { postAmount: newAmount });
        }

        res.status(200).json({ message: 'DiscussaoPost removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover no Firebase:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


module.exports = router;