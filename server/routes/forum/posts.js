const express = require('express');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database'); // Certifique-se de importar corretamente
const { database } = require('../../config/firebase');
const router = express.Router();

/* FINALIZADO */
router.post('/discussaocomment', async (req, res) => {
  const { userId, publicacaoId, text, media } = req.body;

  // Validação dos dados recebidos
  if (!userId || (!text && !media)) {
    return res.status(400).json({ error: 'O conteúdo precisa de userId e (texto ou midia).' });
  }

  try {
    /* Gera um UUID para a chave do nó */
      const discussaoCommentId = crypto.randomUUID();

    await set(dbRef(database, `forum/discussoesComments/${discussaoCommentId}`), {
      discussaoCommentId,
      publicacaoId,
      userId,
      text,
      media,
      time: Date.now(),
    });

    const publicacaoRef = dbRef(database, `forum/publicacoes/${publicacaoId}`)

    let publicacaoSnapshot = await get(dbRef(database, `forum/publicacoes/${publicacaoId}`));

    if (publicacaoSnapshot.exists()) {
      // Incrementa o valor existente
      const currentAmount = parseInt(publicacaoSnapshot.val().commentAmount, 10) || 0;
      await update(publicacaoRef, { commentAmount: currentAmount + 1 });
    } else {
      // Inicializa o valor se o nó não existir
      await update(publicacaoRef, { commentAmount: 1 });
    }

    // Retorna sucesso se tudo ocorreu bem
    res.status(201).json({ message: 'Comentario na discussao criado com sucesso e tempo da discussão atualizado.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro de envio do comentário da discussão ao servidor.' });
  }
});

/* EDITANDO */
router.post('/discussaoeditcomment', async (req, res) => {
  const { userId, discussaoCommentId, publicacaoId, text, media } = req.body;

  // Validação dos dados recebidos
  if (!userId || !discussaoCommentId || (!text && !media)) {
    return res.status(400).json({ error: 'O conteúdo precisa de userId, discussaoCommentId e (texto ou midia).' });
  }

  // Verificamos se o userId do solicitante bate com o do comentário
  const comentarioRef = dbRef(database, `/forum/discussoesComments/${discussaoCommentId}`);

  const snapComentario = await get(comentarioRef);

  if (!snapComentario.exists() || !(userId === snapComentario.val().userId)){
    return res.status(400).json({ error: 'Usuário autor do comentário não encontrado ou não bate com o do solicitante.' });
  }

  try {
    /* Constantes pertinentes a edição de um comentário de discussão */
      const edited = true;

    await update(dbRef(database, `forum/discussoesComments/${discussaoCommentId}`), {
      text,
      media,
      edited,
      time: Date.now(),
    });

    await update(dbRef(database, `forum/publicacoes/${publicacaoId}`), {
      time: Date.now(),
    });

    // Retorna sucesso se tudo ocorreu bem
    res.status(201).json({ message: 'Comentário da discussão editado e atualizado o time da discussão.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* FINALIZADO */
router.post('/criardiscussao', async (req, res) => {
  const { userId, categoriaId, discussaoTitle } = req.body;

  // Validação dos dados de entrada
  if (!userId || !categoriaId) {
    return res.status(400).json({ error: 'O conteúdo precisa de userId e categoriaId.' });
  }

  try {
    /* Gera um UUID para a chave do nó */
      const publicacaoId = crypto.randomUUID();
    /* Constantes pertinentes a uma nova discussão */
      const commentAmount = 0;
      const type = "discussao";

    // Referência para o nó da discussão
    const discussaoRef = dbRef(database, `forum/publicacoes/${publicacaoId}`);

    // Dados da discussão
    const discussaoData = {
      type,
      categoriaId,
      userId,
      publicacaoId,
      discussaoTitle,
      commentAmount,
      time: Date.now(),
    };

    // Criação da discussao
    await set(discussaoRef, discussaoData);

    // Referência para o nó do usuário
    const userRef = dbRef(database, `/forum/usuarios/${userId}`)

    // Incrementar valor de discussaoAmount do userId
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      // Incrementa o valor existente
      const currentAmount = parseInt(userSnapshot.val().discussaoAmount, 10) || 0;
      await update(userRef, { discussaoAmount: currentAmount + 1 });
    } else {
      // Inicializa o valor se o nó não existir
      await update(userRef, { discussaoAmount: 1 });
    }

    res.status(201).json({ message: 'Discussão criada com sucesso e associada ao usuário.', publicacaoId: publicacaoId });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* FINALIZADO */
router.post('/criarpost', async (req, res) => {
  const { userId, text, media } = req.body;

  // Validação dos dados de entrada
  if (!userId ) {
    return res.status(400).json({ error: 'O conteúdo precisa de userId.' });
  }

  try {
    /* Gera um UUID para a chave do nó */
      const publicacaoId = crypto.randomUUID();
    /* Constantes pertinentes a criação de um post */
      const likeAmount = 0;
      const commentAmount = 0;
      const type = "post";

    // Referência para o nó do post
    const postRef = dbRef(database, `forum/publicacoes/${publicacaoId}`);

    // Referência para o nó do usuário
    const userRef = dbRef(database, `/forum/usuarios/${userId}`)

    // Dados da discussão
    const postData = {
      type,
      userId,
      publicacaoId,
      text,
      media,
      likeAmount,
      commentAmount,
      ultimoUpdate: Date.now(),
    };

    // Criação do novo post
    await set(postRef, postData);

    // Incremento seguro de discussaoAmount no usuário
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      // Incrementa o valor existente
      const currentAmount = parseInt(userSnapshot.val().postAmount, 10) || 0;
      await update(userRef, { postAmount: currentAmount + 1 });
    } else {
      // Inicializa o valor se o nó não existir
      await update(userRef, { postAmount: 1 });
    }

    res.status(201).json({ message: 'Discussão criada com sucesso e associada ao usuário.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* FINALIZADO */
router.post('/postComment', async (req, res) => {
  const { userId, publicacaoId, text, media } = req.body;

  // Validação dos dados de entrada
  if (!userId ) {
    return res.status(400).json({ error: 'O conteúdo precisa de userId.' });
  }

  try {
    /* Gera um UUID para a chave do nó */
    const postCommentId = crypto.randomUUID();
    /* Constantes pertinentes a criação de um post */

    // Referência para o nó do do comentário do post
    const postCommentRef = dbRef(database, `forum/postsComments/${postCommentId}`);

    await set(postCommentRef, {
      publicacaoId,
      postCommentId,
      text,
      media,
      userId,
      time: Date.now(),
    });

    res.status(201).json({ message: 'Comentário de post criado com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;