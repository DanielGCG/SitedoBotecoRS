const express = require('express');
const { ref: dbRef, onValue } = require('firebase/database');
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
    console.log('Conexão SSE fechada');
    listener(); // Remove o listener do Firebase
  });
});

router.get('/stream-discussoes', (req, res) => {
  const { categoriaId, userTag } = req.query; // Alterado de req.body para req.query
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
        console.log('Conexão SSE fechada');
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
        console.log('Conexão SSE fechada');
        listener(); // Remove o listener do Firebase
      });
    }
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
    console.log('Conexão SSE fechada');
    listener(); // Remove o listener do Firebase
  });
});

module.exports = router;
