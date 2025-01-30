const express = require('express');
const { ref: dbRef, update, get } = require('firebase/database'); // Certifique-se de importar funções corretamente
const { database } = require('../../config/firebase');
const router = express.Router();

router.post('/getuser', async (req, res) => {
  const { userTag } = req.body;

  try{
    const userTagRef = dbRef(database, `forum/usuarios/${userTag}`);
    const userTagInfo = get(userTagRef);

    res.body = { userTagInfo: userTagInfo };
  }catch (error) {
    console.error('Erro ao pegar o perfil no Firebase:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Atualiza o perfil do usuário
router.post('/update-profile', async (req, res) => {
  const { userTag, bannerImage, biography, exibitionName, profileImage, pronouns, socialMediaLinks } = req.body;

  // Validação dos dados recebidos
  if (!userTag) {
    return res.status(400).json({ error: 'O campo userTag é obrigatório para atualizar o perfil.' });
  }

  try {
    // Referência para o nó do usuário no Firebase Realtime Database
    const userRef = dbRef(database, `forum/usuarios/${userTag}`);

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

// Adiciona Follow em usuário
router.post('/followuser', async (req, res) => {
  try {
    const { userTagRequester, userTag } = req.body;

    // Referência ao UserTag no banco de dados
    const UserTagRef = dbRef(database, `forum/usuarios/${userTag}`);

    // Obtem os dados do usuário
    const snapshotUserTag = await get(UserTagRef);

    if (snapshotUserTag.exists()) {
      const UserTagData = snapshotUserTag.val();

      // Acessar
      let UserTagfriendAmount = UserTagData.friendAmount || 0;
      let UserTagfriendList = UserTagData.friendList || [];
      let UserTagfollowersAmount = UserTagData.followersAmount || 0;
      let UserTagfollowersList = UserTagData.followersList || [];
      let UserTagfollowingList = UserTagData.followingList || [];

      // Referência ao userTagRequester no banco de dados
      const userTagRequesterRef = dbRef(database, `forum/usuarios/${userTagRequester}`);

      // Obtem os dados do usuário
      const snapshotUserTagRequester = await get(userTagRequesterRef);

      if (!snapshotUserTagRequester.exists()) {
        return res.status(404).json({ error: 'Usuário solicitante não encontrado.' });
      }

      const UserTagRequesterData = snapshotUserTagRequester.val();

      // Acessar
      let UserTagRequesterfriendAmount = UserTagRequesterData.friendAmount || 0;
      let UserTagRequesterfriendList = UserTagRequesterData.friendList || [];
      let UserTagRequesterfollowingAmount = UserTagRequesterData.followingAmount || 0;
      let UserTagRequesterfollowingList = UserTagRequesterData.followingList || [];

      // Adiciona userTag no following de userTagRequester e adiciona userTagRequester no followers de userTag
      if (!UserTagRequesterfollowingList.includes(userTag)) {
        UserTagRequesterfollowingList.push(userTag);
        UserTagRequesterfollowingAmount++;
      }

      if (!UserTagfollowersList.includes(userTagRequester)) {
        UserTagfollowersList.push(userTagRequester);
        UserTagfollowersAmount++;
      }

      // Agora vamos processar a amizade
      if (UserTagRequesterfollowingList.includes(userTag) && UserTagfollowingList.includes(userTagRequester)) {
        if (!UserTagRequesterfriendList.includes(userTag)) {
          UserTagRequesterfriendList.push(userTag);
          UserTagRequesterfriendAmount++;
        }
      
        if (!UserTagfriendList.includes(userTagRequester)) {
          UserTagfriendList.push(userTagRequester);
          UserTagfriendAmount++;
        }
      }      

      // Atualiza os dados no banco de dados
      await update(UserTagRef, {
        friendAmount: UserTagfriendAmount,
        friendList: UserTagfriendList,
        followersAmount: UserTagfollowersAmount,
        followersList: UserTagfollowersList,
      });

      await update(userTagRequesterRef, {
        friendAmount: UserTagRequesterfriendAmount,
        friendList: UserTagRequesterfriendList,
        followingAmount: UserTagRequesterfollowingAmount,
        followingList: UserTagRequesterfollowingList,
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
    const { userTagRequester, userTag } = req.body;

    // Referência ao UserTag no banco de dados
    const UserTagRef = dbRef(database, `forum/usuarios/${userTag}`);

    // Obtem os dados do usuário
    const snapshotUserTag = await get(UserTagRef);

    if (snapshotUserTag.exists()) {
      const UserTagData = snapshotUserTag.val();

      // Acessar dados do usuário
      let UserTagfriendList = UserTagData.friendList || [];
      let UserTagfollowersList = UserTagData.followersList || [];

      // Referência ao userTagRequester no banco de dados
      const userTagRequesterRef = dbRef(database, `forum/usuarios/${userTagRequester}`);
      const snapshotUserTagRequester = await get(userTagRequesterRef);

      if (!snapshotUserTagRequester.exists()) {
        return res.status(404).json({ error: 'Usuário solicitante não encontrado.' });
      }

      const UserTagRequesterData = snapshotUserTagRequester.val();

      let UserTagRequesterfriendList = UserTagRequesterData.friendList || [];
      let UserTagRequesterfollowingList = UserTagRequesterData.followingList || [];

      // Função utilitária para remoção segura
      const removeFromList = (list, item) => {
        const index = list.indexOf(item);
        if (index !== -1) list.splice(index, 1);
      };

      // 1. Remove userTag de following do requester
      removeFromList(UserTagRequesterfollowingList, userTag);

      // 2. Remove userTagRequester de followers do target
      removeFromList(UserTagfollowersList, userTagRequester);

      // 3. Remove amizade se existirem
      if (UserTagRequesterfriendList.includes(userTag) && UserTagfriendList.includes(userTagRequester)) {
        removeFromList(UserTagRequesterfriendList, userTag);
        removeFromList(UserTagfriendList, userTagRequester);
      }

      // Atualiza os dados no banco de dados
      await update(UserTagRef, {
        friendList: UserTagfriendList,
        followersList: UserTagfollowersList,
        friendAmount: UserTagfriendList.length,
        followersAmount: UserTagfollowersList.length,
      });

      await update(userTagRequesterRef, {
        friendList: UserTagRequesterfriendList,
        followingList: UserTagRequesterfollowingList,
        friendAmount: UserTagRequesterfriendList.length,
        followingAmount: UserTagRequesterfollowingList.length,
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
