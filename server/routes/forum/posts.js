const express = require('express');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database'); // Certifique-se de importar corretamente
const { database } = require('../../config/firebase');
const router = express.Router();


router.post('/discussaopost', async (req, res) => {
  const { userTag, categoriaId, discussaoId, text, media, mediaType = null } = req.body;

  // Validação dos dados recebidos
  if (!userTag || (!text && !media)) {
    return res.status(400).json({ error: 'O conteúdo precisa de userTag e (texto ou midia).' });
  }

  try {
    /* LastPostID */

    let lastPostId = await get(dbRef(database, `forum/publicacoes/${userTag}/discussoes/${categoriaId}/${discussaoId}/lastPostId`));
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
    await set(dbRef(database, `forum/publicacoes/${userTag}/discussoes/${categoriaId}/${discussaoId}/lastPostId`), lastPostIdAcrescentado);

    /* postId */

    await set(dbRef(database, `forum/publicacoes/${userTag}/discussoes/${categoriaId}/${discussaoId}/${lastPostIdAcrescentado}`), {
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

    let currentPostAmount = await get(dbRef(database, `forum/publicacoes/headers/users/${userTag}/discussoes/${categoriaId}/${discussaoId}/postAmount`));
    currentPostAmount = parseInt(currentPostAmount.val(), 10) || 0;

    await update(dbRef(database, `forum/publicacoes/headers/users/${userTag}/discussoes/${categoriaId}/${discussaoId}`), {
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

    // Referência para o nó da discussão
    const discussaoHeaderRef = dbRef(database, `forum/publicacoes/headers/discussoes/${categoriaId}/${discussaoId}`);

    const dicussaoHeaderInUsersRef = dbRef(database, `forum/publicacoes/headers/users/${userTag}/discussoes/${categoriaId}/${discussaoId}`);

    // Referência para o nó do usuário
    const userRef = dbRef(database, `/forum/usuarios/${userTag}`)

    // Dados da discussão
    const discussaoData = {
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

        // Criação da nova header de discussão
        await set(discussaoHeaderRef, discussaoData);

        // Criação da nova header de discussão em headers/usuarios
        await set(dicussaoHeaderInUsersRef, discussaoData);

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
  const { postId, categoriaId, discussaoId } = req.body;

  // Validação dos dados de entrada
  if (!userTag || !categoriaId || !discussaoId) {
    return res.status(400).json({ error: 'O conteúdo precisa de userTag, categoriaId e discussaoId.' });
  }

  try {
    // Referências no Firebase
    const discussaoHeaderRef = dbRef(database, `forum/publicacoes/headers/discussoes/${categoriaId}/${discussaoId}`);
    const discussaoPostRef = dbRef(database, `forum/publicacoes/${userTag}/discussoes/${categoriaId}/${discussaoId}/${postId}`);
    const dicussaoHeaderInUsersRef = dbRef(database, `forum/publicacoes/headers/users/${userTag}/discussoes/${categoriaId}/${discussaoId}`);

    // Remoção da discussão
    await remove(discussaoPostRef);
    
    await get(discussaoHeaderRef);

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

module.exports = router;