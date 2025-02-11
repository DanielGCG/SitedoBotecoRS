const express = require('express');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const { ref: dbRef, set, get, query, orderByChild, equalTo } = require('firebase/database');
const { auth, database } = require('../../config/firebase');
const router = express.Router();

// Rota de login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user.emailVerified) {
      // Referência ao nó de usuários no banco de dados
      const usersRef = dbRef(database, 'forum/usuarios');

      // Criar consulta para buscar o usuário com o email correspondente
      const userQuery = query(usersRef, orderByChild('email'), equalTo(email));

      const snapshot = await get(userQuery);

      if (snapshot.exists()) {
        // O snapshot.val() retorna um objeto onde as chaves são os IDs dos usuários
        const userData = Object.values(snapshot.val())[0]; // Pegar o primeiro usuário encontrado

        res.status(200).json({
          message: 'Login efetuado com sucesso.',
          success: true,
          userId: userData.userId,
          userTag: userData.userTag,
        });
      } else {
        res.status(400).json({ error: 'Usuário não encontrado.' });
      }
    } else {
      res.status(400).json({ error: 'Por favor, verifique seu e-mail antes de continuar.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota de cadastro de usuário
router.post('/register', async (req, res) => {
  const { exibitionName, userTag, email, password } = req.body;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Enviar e-mail de verificação
    await sendEmailVerification(user);

    /* Gera um UUID para a userId */
    const userId = crypto.randomUUID();

    // Criar um novo usuário no Realtime Database
    const userRef = dbRef(database, `forum/usuarios/${userId}`);
    await set(userRef, {
      exibitionName: exibitionName,
      userTag: userTag,
      userId,
      email: user.email,
      biography: '',
      pronouns: '',
      bannerImage: '/pages/forum/img/banner.png',
      profileImage: '/pages/forum/img/semfoto.png',
      socialMediaLinks: '',
      followersList: [],
      followersAmount: 0,
      followingList: [],
      followingAmount: 0,
      friendList: [],
      friendAmount: 0,
      discussaoAmount: 0,
      postAmount: 0,
      pinList: [],
      pinAmount: 0,
      cargo: 0,
      timedOut: '',
      lastTimeOut: '',
      createdAt: new Date().toISOString(),
      // Outros dados do usuário podem ser adicionados aqui
    });

    res.status(201).json({
      message: 'Um e-mail de verificação foi enviado. Após verificar email, faça o login!'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para verificar se o e-mail foi verificado
router.post('/verify-email', async (req, res) => {
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

module.exports = router;