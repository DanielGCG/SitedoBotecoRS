const express = require('express');
const { ref: dbRef, update, get, query, orderByChild, equalTo } = require('firebase/database'); // Certifique-se de importar funções corretamente
const { database } = require('../../config/firebase');
const router = express.Router();

router.post('/getuser', async (req, res) => {
  const { userId } = req.body;

  try {
    const userRef = dbRef(database, `forum/usuarios/${userId}`);
    const snapshot = await get(userRef);
    const userInfo = snapshot.val();

    res.json(userInfo);
  } catch (error) {
    console.error('Erro ao pegar o perfil no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/getuserwithusertag', async (req, res) => {
  const { userTag } = req.body;

  try {
    // Referência ao nó de usuários no banco de dados
    const usersRef = dbRef(database, 'forum/usuarios');

    // Criar consulta para buscar o usuário com o userTag correspondente
    const userQuery = query(usersRef, orderByChild('userTag'), equalTo('userTag'));

    // Obter os dados da consulta
    const snapshot = await get(userQuery);

    if (snapshot.exists()) {
      // O snapshot.val() retorna um objeto onde as chaves são os IDs dos usuários
      const userData = Object.values(snapshot.val())[0]; // Pegar o primeiro usuário encontrado

      res.status(200).json({
        message: 'Usuário encontrado com sucesso.',
        success: true,
        userData,  // Retorna os dados do usuário encontrado
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao pegar o perfil no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/getuserfriendlist', async (req, res) => {
  const { userId } = req.body;

  try {
    // Referência ao nó de usuários no banco de dados
    const usersRef = dbRef(database, `forum/usuarios/${userId}`);

    // Obter os dados da consulta
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      const listadeamigos = userData.friendList || []; // Verifica se a lista de amigos está vazia

      if (listadeamigos.length === 0) {
        return res.status(200).json({
          message: 'Usuário encontrado, mas a lista de amigos está vazia.',
          success: true,
          listadeamigosTag: [],
        });
      }

      let listadeamigosTag = [];

      await Promise.all(listadeamigos.map(async (friendId) => {
        const friendRef = dbRef(database, `forum/usuarios/${friendId}`);
        const friendData = await get(friendRef);

        if (friendData.exists()) {
          listadeamigosTag.push(friendData.val().userTag);
        }
      }));

      res.status(200).json({
        message: 'Usuário encontrado com sucesso.',
        success: true,
        listadeamigosTag,
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao pegar o perfil no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Atualiza o perfil do usuário
router.post('/update-profile', async (req, res) => {
  const { userId, userTag, bannerImage, biography, exibitionName, profileImage, pronouns, socialMediaLinks } = req.body;

  // Validação dos dados recebidos
  if (!userId) {
    return res.status(400).json({ error: 'O campo userId é obrigatório para atualizar o perfil.' });
  }

  try {
    // Referência para o nó do usuário no Firebase Realtime Database
    const userRef = dbRef(database, `forum/usuarios/${userId}`);

    // Dados atualizados do perfil
    const updatedProfileData = {
      userTag: userTag || null,
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

// Adiciona Follow em usuário
router.post('/followuser', async (req, res) => {
  try {
    const { userIdRequester, userId } = req.body;

    // Referência ao User no banco de dados
    const UserRef = dbRef(database, `forum/usuarios/${userId}`);

    // Obtem os dados do usuário
    const snapshotUser = await get(UserRef);

    if (snapshotUser.exists()) {
      const UserData = snapshotUser.val();

      // Acessar
      let UserUserTag = UserData.userTag || 0;
      let UserfriendAmount = UserData.friendAmount || 0;
      let UserfriendList = UserData.friendList || [];
      let UserfollowersAmount = UserData.followersAmount || 0;
      let UserfollowersList = UserData.followersList || [];
      let UserfollowingList = UserData.followingList || [];

      // Referência ao userIdRequester no banco de dados
      const userRequesterRef = dbRef(database, `forum/usuarios/${userIdRequester}`);

      // Obtem os dados do usuário
      const snapshotUserRequester = await get(userRequesterRef);

      if (!snapshotUserRequester.exists()) {
        return res.status(404).json({ error: 'Usuário solicitante não encontrado.' });
      }

      const UserRequesterData = snapshotUserRequester.val();

      // Acessar
      let UserRequesterUserTag = UserRequesterData.userTag || 0;
      let UserRequesterfriendAmount = UserRequesterData.friendAmount || 0;
      let UserRequesterfriendList = UserRequesterData.friendList || [];
      let UserRequesterfollowingAmount = UserRequesterData.followingAmount || 0;
      let UserRequesterfollowingList = UserRequesterData.followingList || [];

      // Adiciona userId no following de userIdRequester e adiciona userIdRequester no followers de userId
      if (!UserRequesterfollowingList.includes(userId)) {
        UserRequesterfollowingList.push(userId);
        UserRequesterfollowingAmount++;
      }

      if (!UserfollowersList.includes(userIdRequester)) {
        UserfollowersList.push(userIdRequester);
        UserfollowersAmount++;
      }

      // Agora vamos processar a amizade
      if (UserRequesterfollowingList.includes(userId) && UserfollowingList.includes(userIdRequester)) {
        if (!UserRequesterfriendList.includes(userId)) {
          UserRequesterfriendList.push(userId);
          UserRequesterfriendAmount++;
        }
      
        if (!UserfriendList.includes(userIdRequester)) {
          UserfriendList.push(userIdRequester);
          UserfriendAmount++;
        }
      }      

      // Atualiza os dados no banco de dados
      await update(UserRef, {
        userTag: UserUserTag,
        friendAmount: UserfriendAmount,
        friendList: UserfriendList,
        followersAmount: UserfollowersAmount,
        followersList: UserfollowersList,
      });

      await update(userRequesterRef, {
        userTag: UserRequesterUserTag,
        friendAmount: UserRequesterfriendAmount,
        friendList: UserRequesterfriendList,
        followingAmount: UserRequesterfollowingAmount,
        followingList: UserRequesterfollowingList,
      });

      res.status(200).json({ message: 'Seguido com sucesso.' });
    } else {
      res.status(404).json({ error: 'Usuário requerido não encontrado.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
});

// Remove Follow de usuário
router.post('/unfollowuser', async (req, res) => {
  try {
    const { userIdRequester, userId } = req.body;

    // Referência ao User no banco de dados
    const UserRef = dbRef(database, `forum/usuarios/${userId}`);

    // Obtem os dados do usuário
    const snapshotUser = await get(UserRef);

    if (snapshotUser.exists()) {
      const UserData = snapshotUser.val();

      // Acessar dados do usuário
      let UserfriendList = UserData.friendList || [];
      let UserfollowersList = UserData.followersList || [];

      // Referência ao userIdRequester no banco de dados
      const userRequesterRef = dbRef(database, `forum/usuarios/${userIdRequester}`);
      const snapshotUserRequester = await get(userRequesterRef);

      if (!snapshotUserRequester.exists()) {
        return res.status(404).json({ error: 'Usuário solicitante não encontrado.' });
      }

      const UserRequesterData = snapshotUserRequester.val();

      let UserRequesterfriendList = UserRequesterData.friendList || [];
      let UserRequesterfollowingList = UserRequesterData.followingList || [];

      // Função utilitária para remoção segura
      const removeFromList = (list, item) => {
        const index = list.indexOf(item);
        if (index !== -1) list.splice(index, 1);
      };

      // 1. Remove userId de following do requester
      removeFromList(UserRequesterfollowingList, userId);

      // 2. Remove userIdRequester de followers do target
      removeFromList(UserfollowersList, userIdRequester);

      // 3. Remove amizade se existirem
      if (UserRequesterfriendList.includes(userId) && UserfriendList.includes(userIdRequester)) {
        removeFromList(UserRequesterfriendList, userId);
        removeFromList(UserfriendList, userIdRequester);
      }

      // Atualiza os dados no banco de dados
      await update(UserRef, {
        friendList: UserfriendList,
        followersList: UserfollowersList,
        friendAmount: UserfriendList.length,
        followersAmount: UserfollowersList.length,
      });

      await update(userRequesterRef, {
        friendList: UserRequesterfriendList,
        followingList: UserRequesterfollowingList,
        friendAmount: UserRequesterfriendList.length,
        followingAmount: UserRequesterfollowingList.length,
      });

      res.status(200).json({ message: 'Unfollow realizado com sucesso.' });
    } else {
      res.status(404).json({ error: 'Usuário requerido não encontrado.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
});

module.exports = router;
