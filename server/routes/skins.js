const express = require('express');

const { ref, listAll, getBlob, getDownloadURL } = require('firebase/storage');
const { storageFirebase } = require('../config/firebase');

const router = express.Router();

// Listagem de todos os arquivos
router.get('/list', async (req, res) => {
  try {
    const skinsRef = ref(storageFirebase, `skins`);
    const result = await listAll(skinsRef);

    const skins = await Promise.all(
      result.items.map(async (skinRef) => {
        const url = await getDownloadURL(skinRef);
        return { name: skinRef.name, url };
      })
    );

    res.json({ success: true, skins });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: 'Erro!' });
  }
});

// Obtêm uma única skin
router.get('/', async (req, res) => {
  const id = req.query.id ? req.query.id.trim() : null;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: 'Parâmetro id faltando!' });
  }

  let skinRef;
  try {
    skinRef = ref(storageFirebase, `skins/${id}`);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: 'Erro!' });
  }

  try {
    res.json({
      success: true,
      skin: { name: skinRef.name, url: await getDownloadURL(skinRef) }
    });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: `Não foi possível obter ${id}` });
  }
});

module.exports = router;
