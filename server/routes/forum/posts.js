const express = require('express');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database'); // Certifique-se de importar corretamente
const { database } = require('../../config/firebase');
const router = express.Router();


router.post('/discussaopost', async (req, res) => {
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

router.post('/criardiscussao', async (req, res) => {
  const { userTag, categoriaId, discussaoId } = req.body;

  // Validação dos dados de entrada
  if (!userTag || !categoriaId) {
    return res.status(400).json({ error: 'O conteúdo precisa de userTag e categoriaId.' });
  }

  try {
    const postAmount = 0;
    const type = "discussao";

    // Referência para o nó da discussão
    const discussaoHeaderRef = dbRef(database, `forum/publicacoes/headers/discussoes/${categoriaId}/${discussaoId}`);

    const dicussaoHeaderInUsersRef = dbRef(database, `forum/publicacoes/headers/users/${userTag}/discussoes/${categoriaId}/${discussaoId}`);

    // Referência para o nó do usuário
    const userRef = dbRef(database, `/forum/usuarios/${userTag}`)

    // Dados da discussão
    const discussaoData = {
      type,
      userTag,
      categoriaId,
      discussaoId,
      postAmount,
      ultimoUpdate: Date.now(),
    };

    // Criação da nova header de discussão
    await set(discussaoHeaderRef, discussaoData);

    // Criação da nova header de discussão em headers/usuarios
    await set(dicussaoHeaderInUsersRef, discussaoData);

    // Incremento seguro de discussaoAmount no usuário
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      // Incrementa o valor existente
      const currentAmount = parseInt(userSnapshot.val().discussaoAmount, 10) || 0;
      await update(userRef, { discussaoAmount: currentAmount + 1 });
    } else {
      // Inicializa o valor se o nó não existir
      await set(userRef, { discussaoAmount: 1 });
    }

    res.status(201).json({ message: 'Discussão criada com sucesso e associada ao usuário.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/criarpost', async (req, res) => {
  const { userTag, text, media } = req.body;

  // Validação dos dados de entrada
  if (!userTag ) {
    return res.status(400).json({ error: 'O conteúdo precisa de userTag.' });
  }

  try {
    const likeAmount = 0;
    const commentAmount = 0;
    const commentList = [];
    const type = "post";

    // Referência para o nó da discussão
    const postHeaderRef = dbRef(database, `forum/publicacoes/headers/posts/${userTag}`);

    const postHeaderInUsersRef = dbRef(database, `forum/publicacoes/headers/users/${userTag}/posts`);

    // Referência para o nó do usuário
    const userRef = dbRef(database, `/forum/usuarios/${userTag}`)

    // Dados da discussão
    const postData = {
      type,
      userTag,
      text,
      media,
      likeAmount,
      commentAmount,
      commentList,
      ultimoUpdate: Date.now(),
    };

    // Criação da nova header de discussão
    await set(postHeaderRef, postData);

    // Criação da nova header de discussão em headers/usuarios
    await set(postHeaderInUsersRef, postData);

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