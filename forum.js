require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cors = require('cors');
const multer = require('multer');
const { TwitterApi } = require('twitter-api-v2');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const { getDatabase, ref: dbRef, set, get, onValue, push, update, remove } = require('firebase/database');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do multer para fazer upload de imagens
const storage = multer.memoryStorage(); // Armazenar os arquivos na memória
const upload = multer({ storage });

// Configuração CORS
app.use(cors());

// Middleware para entender o corpo da requisição como JSON
app.use(express.json());

// Adicionando o middleware cookie-parser
app.use(cookieParser());

// Middleware para redirecionar para o domínio correto
app.use((req, res, next) => {
  if (req.headers.host === 'boteco.live') {
    return res.redirect(301, `https://www.boteco.live${req.url}`);
  }
  next();
});

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Serve arquivos estáticos
app.use(express.static('public'));

// Configuração do Firebase API
const firebaseConfig = {
  apiKey: process.env.FB_APIKEY,
  authDomain: process.env.FB_AUTHDOMAIN,
  projectId: process.env.FB_PROJECTID,
  storageBucket: process.env.FB_STORAGEBUCKET,
  messagingSenderId: process.env.FB_MESSAGINGSENDERID,
  appId: process.env.FB_APPID
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const storageFirebase = getStorage(firebaseApp);
const database = getDatabase(firebaseApp);


app.post('/update-profile', async (req, res) => {
  const { userTag, bannerImage, biography, exibitionName, profileImage, pronouns, socialMediaLinks } = req.body;

  // Validação dos dados recebidos
  if (!userTag) {
    return res.status(400).json({ error: 'O campo userTag é obrigatório para atualizar o perfil.' });
  }

  try {
    // Referência para o nó do usuário no Firebase Realtime Database
    const userRef = dbRef(database, `users/${userTag}`);

    // Dados atualizados do perfil
    const updatedProfileData = {
      bannerImage: bannerImage || null,
      biography: biography || null,
      exibitionName: exibitionName || null,
      profileImage: profileImage || null,
      pronouns: pronouns || null,
      socialMediaLinks: socialMediaLinks || null,
    };

    // Atualiza os dados no Firebase
    await update(userRef, updatedProfileData);

    // Retorna sucesso
    res.status(200).json({ success: true, message: 'Perfil atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar o perfil no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/posts', async (req, res) => {
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

app.post('/criardiscussao', async (req, res) => {
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

app.post('/removerdiscussao', async (req, res) => {
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

app.get('/stream-posts', (req, res) => {
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

app.get('/stream-discussoes', (req, res) => {
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

app.get('/stream-user', (req, res) => {
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

// Rota de login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user.emailVerified) {
      // Buscar o usuário pelo email no banco de dados
      const usersRef = dbRef(database, 'users'); // Referência para todos os usuários
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        let userTag = null;

        // Percorrer todos os usuários e procurar pelo email correspondente
        snapshot.forEach((userData) => {
          const userInfo = userData.val();
          if (userInfo.email === email) {
            userTag = userInfo.userTag; // Encontrou o userTag correspondente
          }
        });

        if (userTag) {
          res.status(200).json({
            message: 'Login efetuado com sucesso.',
            success: true,
            userTag: userTag,  // Retorne o userTag encontrado
          });
        } else {
          res.status(400).json({ error: 'Usuário não encontrado.' });
        }
      } else {
        res.status(400).json({ error: 'Nenhum usuário registrado.' });
      }
    } else {
      res.status(400).json({ error: 'Por favor, verifique seu e-mail antes de continuar.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota de cadastro de usuário
app.post('/register', async (req, res) => {
  const { exibitionName, userTag, email, password } = req.body;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Enviar e-mail de verificação
    await sendEmailVerification(user);

    // Criar um novo usuário no Realtime Database
    const userRef = dbRef(database, `users/${userTag}`);
    await set(userRef, {
      exibitionName: exibitionName,
      userTag: userTag,
      email: user.email,
      biography: '',
      pronouns: '',
      bannerImage: '/pages/forum/img/banner.png',
      profileImage: '/pages/forum/img/semfoto.png',
      socialMediaLinks: '',
      followersList: '',
      followersAmount: 0,
      followingList: '',
      followingAmount: 0,
      friendList: '',
      friendAmount: 0,
      discussaoList: '',
      discussaoAmount: 0,
      postList: '',
      postAmount: 0,
      pinList: '',
      pinAmount: 0,
      cargo: 0,
      timedOut: '',
      lastTimeOut: '',
      createdAt: new Date().toISOString(),
      // Outros dados do usuário podem ser adicionados aqui
    });

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso. Um e-mail de verificação foi enviado.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para verificar se o e-mail foi verificado
app.post('/verify-email', async (req, res) => {
  const { idToken } = req.body;
  try {
    const userCredential = await auth.verifyIdToken(idToken);
    const user = userCredential.user;

    if (user.emailVerified) {
      res.status(200).json({ message: 'Email verificado com sucesso.' });
    } else {
      res.status(400).json({ error: 'O e-mail ainda não foi verificado.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Função para enviar o log para o Firebase Storage
async function enviarLog(text, userIp, currentDate) {
  try {
    // Verifica se o IP é no formato IPv6 e, se for, converte para IPv4
    const fullIp = userIp.includes('::ffff:') ? userIp.split('::ffff:')[1] : userIp;

    // Formata a data para o formato legível
    const dateObject = new Date(currentDate);
    const formattedDate = dateObject.toLocaleString('pt-BR', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Cria um arquivo de log com os dados
    const logData = `Data: ${formattedDate} | IP: ${fullIp} \nTexto: ${text}\n`;

    // Inicializa o Firebase Storage
    const storage = getStorage();
    const logRef = ref(storage, '/logs/logs.txt');  // Define a referência ao arquivo logs.txt

    let existingLog = '';

    try {
      // Tenta baixar o conteúdo atual do arquivo logs.txt
      const existingLogBytes = await getBytes(logRef);
      existingLog = new TextDecoder().decode(existingLogBytes);  // Decodifica o ArrayBuffer para string
    } catch (error) {
      // Se o arquivo não existir, um erro será lançado, e o arquivo será criado a seguir
      if (error.code === 'storage/object-not-found') {
        console.warn('Arquivo logs.txt não encontrado, criando um novo arquivo...');
      } else {
        // Lança qualquer outro erro
        throw error;
      }
    }

    // Adiciona o novo log ao conteúdo existente (se houver)
    const newLogContent = existingLog + "\n------//------//------\n" + logData;

    // Envia o novo conteúdo para o Firebase Storage (sem sobrescrever, apenas atualiza)
    const logBuffer = new TextEncoder().encode(newLogContent);
    await uploadBytes(logRef, logBuffer);

    console.log('Log enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar log para o Firebase:', error);
  }
}


// Rota principal
app.use('/', require('./server/routes/main'));


// Inicia o servidor
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});