const express = require('express');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const { ref: dbRef, set, get } = require('firebase/database');
const { auth, database } = require('../../config/firebase');
const router = express.Router();


// Rota de login
router.post('/login', async (req, res) => {
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
router.post('/register', async (req, res) => {
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