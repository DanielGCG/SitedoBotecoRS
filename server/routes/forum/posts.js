const express = require('express');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database'); // Certifique-se de importar corretamente
const { database } = require('../../config/firebase');
const router = express.Router();


router.post('/discussaocomment', async (req, res) => {
  const { userTag, userTagCreator, categoriaId, discussaoId, text, media, mediaType = null } = req.body;

  // Validação dos dados recebidos
  if (!userTag || !userTagCreator || (!text && !media)) {
    return res.status(400).json({ error: 'O conteúdo precisa de userTag, userTagCreator e (texto ou midia).' });
  }

  try {
    /* postId */

    await set(dbRef(database, `forum/publicacoes/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}/${lastPostIdAcrescentado}`), {
      userTag,
      postId,
      categoriaId,
      discussaoId,
      text,
      media,
      mediaType,
      time: Date.now(),
    });

    /* Headers/Discussoes/categoriaId/discussaoId */

    let currentPostAmount = await get(dbRef(database, `forum/publicacoes/headers/users/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}/postAmount`));
    currentPostAmount = parseInt(currentPostAmount.val(), 10) || 0;

    await update(dbRef(database, `forum/publicacoes/headers/users/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}`), {
      ultimoUpdate: Date.now(),
      postAmount: currentPostAmount + 1,
    });

    await update(dbRef(database, `forum/publicacoes/headers/discussoes/${categoriaId}/${discussaoId}`), {
      ultimoUpdate: Date.now(),
      postAmount: currentPostAmount + 1,
    });

    // Retorna sucesso se tudo ocorreu bem
    res.status(201).json({ message: 'Post criado com sucesso e tempo da discussão atualizado.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


router.post('/discussaoeditpost', async (req, res) => {
  const { userTag, userTagCreator, categoriaId, discussaoId, text, media, mediaType = null } = req.body;

  // Validação dos dados recebidos
  if (!userTag || !userTagCreator || (!text && !media)) {
    return res.status(400).json({ error: 'O conteúdo precisa de userTag, userTagCreator e (texto ou midia).' });
  }

  try {
    /* LastPostID */

    let lastPostId = await get(dbRef(database, `forum/publicacoes/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}/lastPostId`));
    lastPostId = parseInt(lastPostId.val(), 10) || 0;

    // Declaração fora do bloco condicional
    let lastPostIdAcrescentado;

    if (lastPostId === "" || lastPostId === null) {
      lastPostIdAcrescentado = 0; // Inicializa em 0 se estiver vazio ou null
    } else {
      lastPostIdAcrescentado = lastPostId + 1; // Incrementa caso contrário
    }

    const postId = lastPostIdAcrescentado;

    // Atualiza o lastPostId no Firebase
    await set(dbRef(database, `forum/publicacoes/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}/lastPostId`), lastPostIdAcrescentado);

    /* postId */

    await set(dbRef(database, `forum/publicacoes/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}/${lastPostIdAcrescentado}`), {
      userTag,
      postId,
      categoriaId,
      discussaoId,
      text,
      media,
      mediaType,
      time: Date.now(),
    });

    /* Headers/Discussoes/categoriaId/discussaoId */

    let currentPostAmount = await get(dbRef(database, `forum/publicacoes/headers/users/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}/postAmount`));
    currentPostAmount = parseInt(currentPostAmount.val(), 10) || 0;

    await update(dbRef(database, `forum/publicacoes/headers/users/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}`), {
      ultimoUpdate: Date.now(),
      postAmount: currentPostAmount + 1,
    });

    await update(dbRef(database, `forum/publicacoes/headers/discussoes/${categoriaId}/${discussaoId}`), {
      ultimoUpdate: Date.now(),
      postAmount: currentPostAmount + 1,
    });

    // Retorna sucesso se tudo ocorreu bem
    res.status(201).json({ message: 'Post criado com sucesso e tempo da discussão atualizado.' });
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
      const uuid = crypto.randomUUID();
    /* Constantes pertinentes a uma nova discussão */
      const postAmount = 0;
      const type = "discussao";
      const publicacaoId = uuid

    // Referência para o nó da discussão
    const discussaoRef = dbRef(database, `forum/publicacoes/${uuid}`);

    // Dados da discussão
    const discussaoData = {
      type,
      categoriaId,
      userId,
      publicacaoId,
      discussaoTitle,
      postAmount,
      ultimoUpdate: Date.now(),
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

    res.status(201).json({ message: 'Discussão criada com sucesso e associada ao usuário.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/criarpost', async (req, res) => {
  const { userId, text, media } = req.body;

  // Validação dos dados de entrada
  if (!userId ) {
    return res.status(400).json({ error: 'O conteúdo precisa de userId.' });
  }

  try {
    /* Gera um UUID para a chave do nó */
      const uuid = crypto.randomUUID();
    /* Constantes pertinentes a criação de um post */
      const likeAmount = 0;
      const commentAmount = 0;
      const type = "post";
      const publicacaoId = uuid;

    // Referência para o nó do post
    const postRef = dbRef(database, `forum/publicacoes/${uuid}`);

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
      await set(userRef, { postAmount: 1 });
    }

    res.status(201).json({ message: 'Discussão criada com sucesso e associada ao usuário.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;