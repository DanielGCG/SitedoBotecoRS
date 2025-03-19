const express = require('express');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database'); // Certifique-se de importar corretamente
const { database } = require('../../config/firebase');
const router = express.Router();

/* FINALIZADA */
router.post('/removerdiscussao', async (req, res) => {
  const { userId, publicacaoId } = req.body;

  // Validação dos dados de entrada
  if (!userId || !publicacaoId) {
    return res.status(400).json({ error: 'O conteúdo precisa de userId e publicacaoId.' });
  }

  try {
    // Verificamos se o userId do solicitante bate com o da discussao
    const publicacaoRef = dbRef(database, `/forum/publicacoes/${publicacaoId}`);
    const snapPublicacao = await get(publicacaoRef);

    if (!snapPublicacao.exists()) {
      return res.status(400).json({ error: 'Publicação não encontrada.' });
    }

    const publicacaoData = snapPublicacao.val();
    if (userId !== publicacaoData.userId) {
      return res.status(400).json({ error: 'Usuário solicitante não é o autor da publicação.' });
    }

    const userRef = dbRef(database, `/forum/usuarios/${userId}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    // Remoção da discussão
    await remove(publicacaoRef);

    // Remoção de todos os comentários associados à discussão
    const discussaoCommentsRef = dbRef(database, `/forum/discussoesComments`);
    const snapDiscussaoComments = await get(discussaoCommentsRef);

    if (snapDiscussaoComments.exists()) {
      const updates = {};
      snapDiscussaoComments.forEach((childSnap) => {
        if (childSnap.val().publicacaoId === publicacaoId) {
          updates[childSnap.key] = null; // Marca para remoção
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(discussaoCommentsRef, updates);
      }
    }

    // Atualização do discussaoAmount no usuário
    const currentAmount = parseInt(userSnapshot.val().discussaoAmount, 10) || 0;
    const newAmount = Math.max(currentAmount - 1, 0); // Garante que não fique negativo
    await update(userRef, { discussaoAmount: newAmount });

    res.status(200).json({ message: 'Discussão e seus comentários removidos com sucesso e desassociados ao usuário.' });
  } catch (error) {
    console.error('Erro ao remover no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


/* FINALIZADA */
router.post('/removerdiscussaocomment', async (req, res) => {
    const { userId, publicacaoId, discussaoCommentId } = req.body;

    // Validação dos dados de entrada
    if (!userId || !publicacaoId || !discussaoCommentId) {
        return res.status(400).json({ error: 'O conteúdo precisa de userId, publicacaoId e discussaoCommentId.' });
    }

    try {
        // Verificamos se o userId do solicitante bate com o autor do comentário da discussao
        const discussaoCommentRef = dbRef(database, `/forum/discussoesComments/${discussaoCommentId}`);

        const snapDiscussaoComment = await get(discussaoCommentRef);

        if (!snapDiscussaoComment.exists() || !(userId === snapDiscussaoComment.val().userId)){
          return res.status(400).json({ error: 'Comentário da discussão não encontrada ou usuário solicitante não bate com usuário autor do comentário.' });
        }

        // Remoção do comentario
        await remove(discussaoCommentRef);

        // Atualização do commentAmount da discussao
        const publicacaoRef = dbRef(database, `forum/publicacoes/${publicacaoId}`);

        const snapPublicacao = await get(publicacaoRef);

        if (snapPublicacao.exists()) {
        const currentAmount = parseInt(snapPublicacao.val().commentAmount, 10) || 0;
        const newAmount = Math.max(currentAmount - 1, 0); // Garante que não fique negativo

        await update (publicacaoRef, { commentAmount: newAmount });
        }

        res.status(200).json({ message: 'Comentário da discussão removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover no Firebase:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

/* FINALIZADA */
router.post('/removerpost', async (req, res) => {
    const { userId, publicacaoId } = req.body;

    // Validação dos dados de entrada
    if (!userId || !publicacaoId ) {
      return res.status(400).json({ error: 'O conteúdo precisa de userId e publicacaoId.' });
    }

    try {
      // Verificamos se o userId do solicitante bate com o autor do post
      const postRef = dbRef(database, `/forum/publicacoes/${publicacaoId}`);

      const snapPost = await get(postRef);

      if (!snapPost.exists() || !(userId === snapPost.val().userId)){
        return res.status(400).json({ error: 'Post não existe ou usuário solicitante não bate com autor do post.' });
      }

      // Remoção do post
      await remove(postRef);

      const userRef = dbRef(database, `/forum/usuarios/${userId}`);

      // Atualização no perfil do usuário
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists()) {
        // Obtém o valor atual e garante que seja um número válido
        const currentAmount = parseInt(userSnapshot.val().postAmount, 10) || 0;
        
        // Garante que o valor não fique negativo
        const newAmount = Math.max(0, currentAmount - 1);

        await update(userRef, { postAmount: newAmount });
      } else {
        // Inicializa o valor se o nó não existir
        await update(userRef, { postAmount: 0 });
      }

      res.status(200).json({ message: 'Post removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover no Firebase:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

router.post('/removerpostcomment', async (req, res) => {
  const { userId, publicacaoId, postCommentId } = req.body;

  // Validação dos dados de entrada
  if (!userId || !publicacaoId || !postCommentId ) {
    return res.status(400).json({ error: 'O conteúdo precisa de userId, publicacaoId e postCommentId.' });
  }

  try {
    // Verificamos se o userId do solicitante bate com o autor do comentário do post
    const postCommentRef = dbRef(database, `/forum/postsComments/${postCommentId}`);

    const snapPostComment = await get(postCommentRef);

    if (!snapPostComment.exists() || !(userId === snapPostComment.val().userId)){
      return res.status(400).json({ error: 'Comentário do post não existe ou usuário solicitante não bate com autor do comentário.' });
    }

    // Remoção do comentário do post
    await remove(postCommentRef);
    
    // Atualização no post
    const publicacaoRef = dbRef(database, `forum/publicacoes/${publicacaoId}`)
    const snapPublicacao = await get(publicacaoRef);

    if (snapPublicacao.exists()) {
      // Obtém o valor atual e garante que seja um número válido
      const currentAmount = parseInt(snapPublicacao.val().commentAmount, 10) || 0;
      
      // Garante que o valor não fique negativo
      const newAmount = Math.max(0, currentAmount - 1);

      await update(publicacaoRef, { commentAmount: newAmount });
    } else {
      // Inicializa o valor se o nó não existir
      await update(publicacaoRef, { commentAmount: 0 });
    }

    res.status(200).json({ message: 'Comentário do post removido com sucesso.' });
  } catch (error) {
      console.error('Erro ao remover no Firebase:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;