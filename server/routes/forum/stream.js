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
  const { categoria, discussao } = req.query;

  if (!categoria || !discussao) {
    res.status(400).json({ error: 'Categoria e discussão são obrigatórias.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Referência para o nó 'posts' no Firebase Realtime Database
  const postsRef = dbRef(database, `forum/${categoria}/${discussao}`);

  // Escutando mudanças em tempo real no Firebase
  const listener = onValue(
    postsRef,
    (snapshot) => {
      const posts = [];
      snapshot.forEach((childSnapshot) => {
        posts.push(childSnapshot.val());
      });

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
  const { categoria, userTag } = req.query; // Alterado de req.body para req.query
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Referências para múltiplos caminhos (Destaques e outras categorias)
  const categoriasRef = [
    'forum/Destaques/headerDiscussoes',
    'forum/Computaria/headerDiscussoes',
    'forum/Fofoca/headerDiscussoes',
    'forum/BSMP/headerDiscussoes',
    'forum/RPG/headerDiscussoes',
  ];

  // Se existe um userTag, filtra as discussões
  if (userTag) {
    const discussoes = [];

    // Escuta de múltiplos caminhos
    categoriasRef.forEach((caminho, index) => {
      const discussoesRef = dbRef(database, caminho);

      const listener = onValue(
        discussoesRef,
        (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            const discussao = childSnapshot.val();

            // Verifica se a discussão pertence ao userTag
            if (discussao.userTag === userTag) {
              discussoes.push(discussao);
            }
          });

          // Se for a última categoria, envia os dados para o cliente
          if (index === categoriasRef.length - 1) {
            console.log(`data: ${JSON.stringify(discussoes)}\n\n`);
            res.write(`data: ${JSON.stringify(discussoes)}\n\n`);
          }
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
  } else {
    // Caso não seja necessário filtrar por userTag, busca por categoria específica
    if (categoria) {
      const discussoesRef = dbRef(database, `forum/${categoria}/headerDiscussoes`);

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
  const userRef = dbRef(database, `users/${userTag}`);

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
