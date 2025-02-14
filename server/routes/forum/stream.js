const express = require('express');
const { ref: dbRef, onValue, get, limitToLast, query, orderByChild, equalTo, off } = require('firebase/database');
const { database } = require('../../config/firebase');
const router = express.Router();

// Helper function to configure SSE response
const configureSSE = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
};

router.get('/stream-discussoesComments', (req, res) => {
  const { publicacaoId } = req.query;

  if (!publicacaoId) {
    res.status(400).json({ error: 'publicacaoId é obrigatória.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Referência para o nó 'discussaocomments' no Firebase Realtime Database
  const discussaoCommentsRef = dbRef(database, `forum/discussoesComments/`);
  const discussaoCommentsQuery = query(discussaoCommentsRef, orderByChild('publicacaoId'), equalTo(publicacaoId));

  // Escutando mudanças em tempo real no Firebase
  const listener = onValue(
    discussaoCommentsQuery,
    async (snapshot) => {
      const discussaoComments = [];

      for (const childSnapshot of Object.values(snapshot.val() || {})) {
        const discussaoComment = childSnapshot;

        try {
          const userRef = dbRef(database, `forum/usuarios/${discussaoComment.userId}`);
          const userSnapshot = await get(userRef);
          discussaoComment.userTag = userSnapshot.exists() ? userSnapshot.val().userTag : 'Desconhecido';
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
          discussaoComment.userTag = 'Erro ao buscar usuário';
        }

        discussaoComments.push(discussaoComment);
      }

      // Ordena os comentários pela propriedade 'time' (mais antigos primeiro)
      discussaoComments.sort((a, b) => a.time - b.time);

      // Envia os dados atualizados para o cliente
      res.write(`data: ${JSON.stringify(discussaoComments)}\n\n`);
    },
    (error) => {
      console.error('Erro ao escutar mudanças no Firebase:', error);
      res.write(`data: ${JSON.stringify({ error: 'Erro ao escutar discussaoComment' })}\n\n`);
    }
  );

  // Fechar conexão e remover o listener ao desconectar
  req.on('close', () => {
    off(discussaoCommentsRef, 'value', listener); // Remove o listener do Firebase
  });
});

router.get('/stream-discussoes', (req, res) => {
  const { categoriaId } = req.query;

  if (!categoriaId) {
    res.status(400).json({ error: 'categoriaId é obrigatório' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const discussoesRef = dbRef(database, 'forum/publicacoes');
  const discussaoQuery = query(discussoesRef, orderByChild('categoriaId'), equalTo(categoriaId));

  const listener = onValue(
    discussaoQuery,
    async (snapshot) => {
      const discussoes = [];

      for (const childSnapshot of Object.values(snapshot.val() || {})) {
        const discussao = childSnapshot;

        try {
          const userRef = dbRef(database, `forum/usuarios/${discussao.userId}`);
          const userSnapshot = await get(userRef);
          discussao.userTag = userSnapshot.exists() ? userSnapshot.val().userTag : 'Desconhecido';
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
          discussao.userTag = 'Erro ao buscar usuário';
        }

        discussoes.push(discussao);
      }

      res.write(`data: ${JSON.stringify(discussoes)}\n\n`);
    },
    (error) => {
      console.error('Erro ao escutar mudanças no Firebase:', error);
      res.write(`data: ${JSON.stringify({ error: 'Erro ao escutar discussoes' })}\n\n`);
    }
  );

  req.on('close', () => {
    listener(); // Remove o listener do Firebase
  });
});

router.get('/stream-publicacoes', async (req, res) => {
  let amount = req.query.amount || 20;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Query para obter as últimas 'amount' publicações
    const publicacoesQuery = query(dbRef(database, `forum/publicacoes`), limitToLast(Number(amount)));

    // Obtendo as publicações da base de dados
    const snapshot = await get(publicacoesQuery);

    if (snapshot.exists()) {
      const todasPublicacoes = snapshot.val();

      const usersCache = {};

      // Convertendo para um array e buscando os dados dos usuários de forma assíncrona
      const publicacoesArray = await Promise.all(
        Object.entries(todasPublicacoes).map(async ([id, publicacao]) => {
          try {
            // Busca os dados do usuário
            let userSnapshot;
            
            if (!usersCache[publicacao.userId]) {
              userSnapshot = await get(dbRef(database, `forum/usuarios/${publicacao.userId}`));

              if (!userSnapshot.exists()) {
                publicacao.userTag = "Usuário desconhecido";
                publicacao.profileImage = null;
                return;
              }

              usersCache[publicacao.userId] = userSnapshot.val();
            } else {
              userSnapshot = usersCache[publicacao.userId];
            }

            publicacao.userTag = userSnapshot.userTag;
            publicacao.profileImage = userSnapshot.profileImage;
          } catch (error) {
            console.error(`Erro ao buscar userTag para ${publicacao.userId}:`, error);
            publicacao.userTag = "Erro ao carregar usuário";
            publicacao.profileImage = null;
          }

          return publicacao;
        })
      );

      // Envia os dados já processados para o cliente
      res.write(`data: ${JSON.stringify(publicacoesArray)}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify([])}\n\n`); // Caso não existam publicações
    }

    // Criar listener para novas publicações em tempo real
    const publicacoesRef = dbRef(database, 'forum/publicacoes');
    const listener = onValue(publicacoesRef, async (snapshot) => {
      if (snapshot.exists()) {
        const novasPublicacoes = snapshot.val();

        // Convertendo em array e obtendo userTag
        const novasPublicacoesArray = await Promise.all(
          Object.entries(novasPublicacoes).map(async ([id, publicacao]) => {
            try {
              const userSnapshot = await get(dbRef(database, `forum/usuarios/${publicacao.userId}`));
              publicacao.userTag = userSnapshot.exists() ? userSnapshot.val().userTag : "Usuário desconhecido";
              publicacao.profileImage = userSnapshot.exists() ? userSnapshot.val().profileImage : null;
            } catch (error) {
              publicacao.userTag = "Erro ao carregar usuário";
              publicacao.profileImage = null;
            }
            return publicacao;
          })
        );

        res.write(`data: ${JSON.stringify(novasPublicacoesArray)}\n\n`);
      }
    });

    // Fechar conexão e remover o listener ao desconectar
    req.on('close', () => {
      off(publicacoesRef, "value", listener); // Remove o listener do Firebase
    });

  } catch (error) {
    console.error("Erro ao buscar a lista de publicações:", error);
    res.status(500).json({ error: "Erro interno ao obter publicações." });
  }
});

router.get('/stream-publicacoesbyuserid', async (req, res) => {
  let { userId, amount } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "O userId é obrigatório." });
  }

  amount = amount ? parseInt(amount, 10) : 20; // Define um valor padrão

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Query para obter as últimas 'amount' publicações do usuário
    const publicacoesQuery = query(
      dbRef(database, "forum/publicacoes"),
      orderByChild("userId"),
      equalTo(userId),
      limitToLast(amount)
    );

    // Obtendo as publicações iniciais
    const snapshot = await get(publicacoesQuery);
    
    if (snapshot.exists()) {
      const todasPublicacoes = Object.values(snapshot.val());
      res.write(`data: ${JSON.stringify(todasPublicacoes)}\n\n`);
    } else {
      res.write(`data: []\n\n`);
    }

    // Criar listener para novas publicações do usuário em tempo real
    const publicacoesRef = dbRef(database, "forum/publicacoes");
    const listener = onValue(publicacoesRef, (snap) => {
      if (snap.exists()) {
        const novasPublicacoes = Object.values(snap.val()).filter(pub => pub.userId === userId);
        res.write(`data: ${JSON.stringify(novasPublicacoes)}\n\n`);
      } else {
        res.write(`data: []\n\n`); // Envia um array vazio se não houver novas publicações
      }
    });

    // Remover o listener ao desconectar
    req.on("close", () => {
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
