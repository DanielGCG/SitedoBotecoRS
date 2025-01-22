const express = require('express');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database'); // Certifique-se de importar corretamente
const { database } = require('../../config/firebase');
const router = express.Router();


router.post('/posts', async (req, res) => {
  const { userTag, categoria, discussao, text, media = null } = req.body;

  // Validação dos dados recebidos
  if (!userTag || (!text && !media)) {
    return res.status(400).json({ error: 'O conteúdo precisa de userTag e (texto ou midia).' });
  }

  try {
    // Referência para o nó 'posts' no Firebase Realtime Database
    const postsRef = dbRef(database, `forum/${categoria}/${discussao}`);

    // Adiciona um novo post com o conteúdo e timestamp
    await push(postsRef, {
      userTag,
      categoria,
      discussao,
      text,
      media,
      timestamp: Date.now(),
    });

    // Referência para o nó da discussão
    const discussaoRef = dbRef(database, `forum/${categoria}/headerDiscussoes/${discussao}`);

    // Incremento seguro do `postAmount`
    const discussaoSnapshot = await get(discussaoRef);
    if (discussaoSnapshot.exists()) {
      const currentPostAmount = discussaoSnapshot.val().postAmount || 0;
      await update(discussaoRef, {
        ultimoUpdate: Date.now(),
        postAmount: currentPostAmount + 1,
      });
    } else {
      // Inicializa o valor caso a discussão não exista (cenário improvável)
      await set(discussaoRef, {
        ultimoUpdate: Date.now(),
        postAmount: 1,
      });
    }

    // Retorna sucesso se tudo ocorreu bem
    res.status(201).json({ message: 'Post criado com sucesso e tempo da discussão atualizado.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/criardiscussao', async (req, res) => {
  const { userTag, categoria, discussao } = req.body;

  const postAmount = 0;

  // Validação dos dados de entrada
  if (!userTag || !categoria || !discussao) {
    return res.status(400).json({ error: 'O conteúdo precisa de autor, categoria e discussão.' });
  }

  // Referência para o nó da discussão
  const discussaoRef = dbRef(database, `forum/${categoria}/headerDiscussoes/${discussao}`);

  // Referência para o nó do usuário
  const userRef = dbRef(database, `users/${userTag}`);

  // Dados da discussão
  const discussaoData = {
    userTag,
    categoria,
    discussao,
    postAmount,
    ultimoUpdate: Date.now(),
  };

  try {
    // Criação da nova discussão
    await set(discussaoRef, discussaoData);

    // Incremento seguro do `discussaoAmount`
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      // Incrementa o valor existente
      console.log(userSnapshot.val().discussaoAmount);
      await update(userRef, { discussaoAmount: (userSnapshot.val().discussaoAmount || 0) + 1 });
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
  const { userTag, categoria, discussao } = req.body;

  // Validação dos dados de entrada
  if (!userTag || !categoria || !discussao) {
    return res.status(400).json({ error: 'O conteúdo precisa de autor, categoria e discussão.' });
  }

  // Referência para o nó da discussão
  const discussaoHeaderRef = dbRef(database, `forum/${categoria}/headerDiscussoes/${discussao}`);

  // Referência para a discussao em si
  const discussaoRef = dbRef(database, `forum/${categoria}/${discussao}`);

  // Referência para o nó do usuário
  const userRef = dbRef(database, `users/${userTag}`);

  try {
    // Remoção de uma discussão
    await remove(discussaoHeaderRef);
    await remove(discussaoRef);

    // Decremento seguro do `discussaoAmount`
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      // Decrementa o valor existente
      console.log(userSnapshot.val().discussaoAmount);
      await update(userRef, { discussaoAmount: (userSnapshot.val().discussaoAmount || 0) - 1 });
    } else {
      // Inicializa o valor se o nó não existir
      await set(userRef, { discussaoAmount: 1 });
    }

    res.status(201).json({ message: 'Discussão removida com sucesso e desassociada ao usuário.' });
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;