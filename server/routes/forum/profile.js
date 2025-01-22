const express = require('express');
const { ref: dbRef, update } = require('firebase/database'); // Certifique-se de importar funções corretamente
const { database } = require('../../config/firebase');
const router = express.Router();

// Atualiza o perfil do usuário
router.post('/update-profile', async (req, res) => {
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

module.exports = router;
