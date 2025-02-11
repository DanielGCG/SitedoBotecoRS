const express = require('express');
const { ref: dbRef, onValue, get, limitToLast, query } = require('firebase/database');
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
  const { categoriaId, userTag } = req.query;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Se existe um userTag, filtra as discussões
  if (userTag) {

    const dicussaoHeaderInUsersRef = dbRef(database, `forum/publicacoes/headers/users/${userTag}/discussoes`);
    
    const listener = onValue(
      dicussaoHeaderInUsersRef,
      (snapshot) => {
        const discussoes = [];
        snapshot.forEach((childSnapshot) => {
          // Acessa o filho do filho, caso as discussões estejam aninhadas nesse nível
          const discussoesData = childSnapshot.val();
          if (discussoesData) {
            // Se existir outro nível de dados dentro de cada discussão, acessa diretamente
            Object.values(discussoesData).forEach((subDiscussoes) => {
              discussoes.push(subDiscussoes);
            });
          }
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
    } else {
    // Caso não seja necessário filtrar por userTag, busca por categoriaId específica
    if (categoriaId) {

      const discussoesRef = dbRef(database, `forum/publicacoes/headers/discussoes/${categoriaId}`);

      const listener = onValue(
        discussoesRef,
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
          res.write(`data: ${JSON.stringify({ error: 'Erro ao escutar posts' })}\n\n`);
        }
      );

      // Fechar conexão e remover o listener ao desconectar
      req.on('close', () => {
        listener(); // Remove o listener do Firebase
      });
    }
  }
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
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const resultado = new Map(); // Mapa para evitar duplicatas

  try {
    // Obtém a lista de todos os usuários
    const usersRef = dbRef(database, "forum/usuarios");
    const usersSnap = await get(usersRef);

    if (!usersSnap.exists()) {
      res.write(`data: ${JSON.stringify([])}\n\n`);
      return;
    }

    const allUsers = Object.keys(usersSnap.val()); // Lista com todas as userTags

    const processUserTag = async (userTag) => {
      const discussoesHeadersRef = query(dbRef(database, `forum/publicacoes/headers/users/${userTag}/discussoes`), limitToLast(10));
      const postsHeadersRef = query(dbRef(database, `forum/publicacoes/headers/users/${userTag}/posts`), limitToLast(10));
      const threadsHeadersRef = query(dbRef(database, `forum/publicacoes/headers/users/${userTag}/threads`), limitToLast(10));

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
          todasPublicacoes.push(...Object.values(discussoesSnap.val()));
        }
        if (postsSnap.exists()) {
          todasPublicacoes.push(...Object.values(postsSnap.val()));
        }
        if (threadsSnap.exists()) {
          todasPublicacoes.push(...Object.values(threadsSnap.val()));
        }

        // Ordenar pelo campo "ultimoUpdate" (do mais recente para o mais antigo)
        todasPublicacoes.sort((a, b) => b.ultimoUpdate - a.ultimoUpdate);

        // Atualizar o mapa de resultados sem duplicatas
        todasPublicacoes.forEach((pub) => resultado.set(pub.discussaoId, pub));

        // Enviar os dados para o cliente via SSE
        //res.write(`data: ${JSON.stringify(Array.from(resultado.values()))}\n\n`);

        // Criar listener para novas atualizações em tempo real
        [discussoesHeadersRef, postsHeadersRef, threadsHeadersRef].forEach(ref => {
          onValue(ref, (snapshot) => {
            if (snapshot.exists()) {
              const novasPublicacoes = Object.values(snapshot.val());

              novasPublicacoes.forEach((pub) => resultado.set(pub.discussaoId, pub));

              // Ordenar novamente antes de enviar ao cliente
              const listaOrdenada = Array.from(resultado.values()).sort((a, b) => b.ultimoUpdate - a.ultimoUpdate);
              
              res.write(`data: ${JSON.stringify(listaOrdenada)}\n\n`);
            }
          });
        });

      } catch (error) {
        console.error(`Erro ao buscar dados do usuário ${userTag}:`, error);
      }
    };
    // Processar todas as userTags
    await Promise.all(allUsers.map(processUserTag));

  } catch (error) {
    console.error("Erro ao buscar a lista de usuários:", error);
    res.status(500).json({ error: "Erro interno ao obter publicações." });
  }
});

router.get('/stream-user', (req, res) => {
  const { userTag } = req.query; // Obtém o userTag via query

  if (!userTag) {
    res.status(400).json({ error: 'userTag é obrigatório.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Referência para o nó 'users' no Firebase Realtime Database
  const userRef = dbRef(database, `forum/usuarios/${userTag}`);

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
