const express = require('express');
const { ref: dbRef, onValue, get, limitToLast, query, orderByChild, equalTo } = require('firebase/database');
const { database } = require('../../config/firebase');
const router = express.Router();

// Helper function to configure SSE response
const configureSSE = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
};

router.get('/stream-posts', (req, res) => {
  const { categoriaId, userTagCreator, discussaoId } = req.query;

  if (!categoriaId || !discussaoId) {
    res.status(400).json({ error: 'categoriaId e discussão são obrigatórias.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Referência para o nó 'posts' no Firebase Realtime Database
  const postsRef = dbRef(database, `forum/publicacoes/${userTagCreator}/discussoes/${categoriaId}/${discussaoId}`);

  // Escutando mudanças em tempo real no Firebase
  const listener = onValue(
    postsRef,
    (snapshot) => {
      const posts = [];
      snapshot.forEach((childSnapshot) => {
        posts.push(childSnapshot.val());
      });
      // Tirar o lastPostId da lista para ser enviada
      posts.pop();
      // Envia os dados atualizados para o cliente
      res.write(`data: ${JSON.stringify(posts)}\n\n`);
    },
    (error) => {
      console.error('Erro ao escutar mudanças no Firebase:', error);
      res.write(`data: ${JSON.stringify({ error: 'Erro ao escutar posts' })}\n\n`);
    }
  );

  // Fechar conexão e remover o listener ao desconectar
  req.on('close', () => {
    listener(); // Remove o listener do Firebase
  });
});

router.get('/stream-discussoes', (req, res) => {
  const { categoriaId } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Referência ao Firebase para as publicações, com filtro pela categoriaId
  const discussoesRef = dbRef(database, `forum/publicacoes`);
  const discussaoQuery = query(discussoesRef, orderByChild('categoriaId'), equalTo(categoriaId));

  // Ouvir mudanças nas discussões com a query
  const listener = onValue(
    discussaoQuery,
    (snapshot) => {
      const discussoes = [];
      snapshot.forEach((childSnapshot) => {
        discussoes.push(childSnapshot.val());
      });

      // Envia os dados atualizados para o cliente
      res.write(`data: ${JSON.stringify(discussoes)}\n\n`);
    },
    (error) => {
      console.error('Erro ao escutar mudanças no Firebase:', error);
      res.write(`data: ${JSON.stringify({ error: 'Erro ao escutar discussoes' })}\n\n`);
    }
  );

  // Fechar conexão e remover o listener ao desconectar
  req.on('close', () => {
    listener(); // Remove o listener do Firebase
  });
});

router.get('/stream-seguindo', async (req, res) => {
  let { categoriaId, userTag } = req.query;

  if (!categoriaId || !userTag) {
    res.status(400).json({ error: 'categoriaId e/ou userTag faltando e são obrigatórios.' });
    return;
  }

  let followingList;
  
  // Vamos atrás do followingList com a userTag do usuário

  try{
    const userTagRef = debRef(database, `forum/usuarios/${userTag}/followingList`);

    followingList = get(userTagRef);
  }catch(error) {
    console.error("Erro ao buscar dados:", error);
  }

  // Garantir que followingList seja um array (caso venha como string da query)
  if (typeof followingList === "string") {
    followingList = followingList.split(",");
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const resultado = [];

  const processUserTag = async (followingList) => {
    const discussoesHeadersRef = query(dbRef(database, `forum/publicacoes/headers/${followingList}/discussoes`), limitToLast(10));
    const postsHeadersRef = query(dbRef(database, `forum/publicacoes/headers/${followingList}/posts`), limitToLast(10));
    const threadsHeadersRef = query(dbRef(database, `forum/publicacoes/headers/${followingList}/threads`), limitToLast(10));

    try {
      // Obtendo os dados das referências
      const [discussoesSnap, postsSnap, threadsSnap] = await Promise.all([
        get(discussoesHeadersRef),
        get(postsHeadersRef),
        get(threadsHeadersRef)
      ]);

      const todasPublicacoes = [];

      // Adicionando os dados aos vetores e marcando a origem
      if (discussoesSnap.exists()) {
        todasPublicacoes.push(...Object.values(discussoesSnap.val()).map(pub => ({ ...pub, tipo: 'discussoes' })));
      }
      if (postsSnap.exists()) {
        todasPublicacoes.push(...Object.values(postsSnap.val()).map(pub => ({ ...pub, tipo: 'posts' })));
      }
      if (threadsSnap.exists()) {
        todasPublicacoes.push(...Object.values(threadsSnap.val()).map(pub => ({ ...pub, tipo: 'threads' })));
      }

      // Ordenar pelo campo "ultimoUpdate" (do mais recente para o mais antigo)
      todasPublicacoes.sort((a, b) => b.ultimoUpdate - a.ultimoUpdate);

      // Atualizar o array resultado
      resultado.push(...todasPublicacoes);

      // Enviar os dados para o cliente via SSE
      res.write(`data: ${JSON.stringify(resultado)}\n\n`);

      // Criar listener para novas atualizações em tempo real
      [discussoesHeadersRef, postsHeadersRef, threadsHeadersRef].forEach(ref => {
        onValue(ref, (snapshot) => {
          if (snapshot.exists()) {
            const novasPublicacoes = Object.values(snapshot.val()).map(pub => ({ ...pub, tipo: ref.key }));
            
            // Atualizar e ordenar novamente
            resultado.push(...novasPublicacoes);
            resultado.sort((a, b) => b.ultimoUpdate - a.ultimoUpdate);

            res.write(`data: ${JSON.stringify(resultado)}\n\n`);
          }
        });
      });

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  // Processar cada item da lista de usuários
  await Promise.all(userTagList.map(processUserTag));
});

router.get('/stream-publicacoes', async (req, res) => {
  let { amount } = req.query;

  if (!amount) {
    amount = 20; // Valor padrão
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Query para obter as últimas 'amount' publicações
    const publicacoesQuery = query(dbRef(database, `forum/publicacoes`), limitToLast(amount));

    // Obtendo as publicações da base de dados
    const snapshot = await get(publicacoesQuery);

    if (snapshot.exists()) {
      // Envia as publicações iniciais
      const todasPublicacoes = snapshot.val();
      res.write(`data: ${JSON.stringify(todasPublicacoes)}\n\n`);
    }

    // Criar listener para novas publicações em tempo real
    const publicacoesRef = dbRef(database, 'forum/publicacoes');
    const listener = onValue(publicacoesRef, (snapshot) => {
      if (snapshot.exists()) {
        const novasPublicacoes = snapshot.val();
        res.write(`data: ${JSON.stringify(novasPublicacoes)}\n\n`);
      }
    });

    // Fechar conexão e remover o listener ao desconectar
    req.on('close', () => {
      listener(); // Remove o listener do Firebase
    });
  } catch (error) {
    console.error("Erro ao buscar a lista de publicações:", error);
    res.status(500).json({ error: "Erro interno ao obter publicações." });
  }
});

router.get('/stream-publicacoesbyuserid', async (req, res) => {
  let { userId, amount } = req.query;

  if (!amount) {
    amount = 20; // Valor padrão
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Query para obter as últimas 'amount' publicações
    const publicacoesQuery = query(dbRef(database, `forum/publicacoes`), orderByChild('userId'), equalTo(userId), limitToLast(amount));

    // Obtendo as publicações da base de dados
    const snapshot = await get(publicacoesQuery);

    if (snapshot.exists()) {
      // Envia as publicações iniciais
      const todasPublicacoes = snapshot.val();
      res.write(`data: ${JSON.stringify(todasPublicacoes)}\n\n`);
    }

    // Criar listener para novas publicações em tempo real
    const publicacoesRef = dbRef(database, 'forum/publicacoes');
    const listener = onValue(publicacoesRef, (snapshot) => {
      if (snapshot.exists()) {
        const novasPublicacoes = snapshot.val();
        res.write(`data: ${JSON.stringify(novasPublicacoes)}\n\n`);
      }
    });

    // Fechar conexão e remover o listener ao desconectar
    req.on('close', () => {
      listener(); // Remove o listener do Firebase
    });
  } catch (error) {
    console.error("Erro ao buscar a lista de publicações:", error);
    res.status(500).json({ error: "Erro interno ao obter publicações." });
  }
});

router.get('/stream-user', async (req, res) => { // Agora a rota é async
  let { userId, userTag } = req.query; // Obtém o userTag via query

  if (!userId && !userTag) {
    res.status(400).json({ error: 'userId ou userTag é obrigatório.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!userId && userTag) {
    // Referência ao nó de usuários no banco de dados
    const usersRef = dbRef(database, 'forum/usuarios');

    // Criar consulta para buscar o usuário com o userTag correspondente
    const userQuery = query(usersRef, orderByChild('userTag'), equalTo(userTag));

    try {
      // Obter os dados da consulta
      const snapshot = await get(userQuery);

      if (snapshot.exists()) {
        // Recuperamos o userId
        const userData = Object.values(snapshot.val())[0]; // Pega o primeiro usuário
        userId = userData.userId; // Atribui o userId encontrado
      } else {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }
    } catch (error) {
      console.error('Erro ao buscar o usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar o usuário.' });
      return;
    }
  }

  // Referência para o nó 'users' no Firebase Realtime Database
  const userRef = dbRef(database, `forum/usuarios/${userId}`);

  // Escutando mudanças em tempo real no Firebase
  const listener = onValue(
    userRef,
    (snapshot) => {
      const user = snapshot.val(); // Obtém os dados diretamente

      // Envia os dados atualizados para o cliente
      res.write(`data: ${JSON.stringify(user)}\n\n`);
    },
    (error) => {
      console.error('Erro ao escutar mudanças no Firebase:', error);
      res.write(`data: ${JSON.stringify({ error: 'Erro ao escutar usuário' })}\n\n`);
    }
  );

  // Fechar conexão e remover o listener ao desconectar
  req.on('close', () => {
    listener(); // Remove o listener do Firebase
  });
});

module.exports = router;
