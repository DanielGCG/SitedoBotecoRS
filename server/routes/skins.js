const express = require('express');

const { ref, get, child, query, orderByChild, equalTo } = require('firebase/database');
const { database } = require('../config/firebase');

const router = express.Router();

router.get('/', async (req, res) => {
    const folder = req.query.folder ? req.query.folder.trim() : '';
    const senha = req.query.senha;

    try {
      const skinsRef = ref(database, "/skins");

      let parente = null;

      if (folder) {
        const folderSnapshot = await get(child(skinsRef, folder));
        const folderData = folderSnapshot.val();
        parente = folderData.parente;

        const isPasswordValid = (folderPassword, providedPassword) => {
          return folderPassword.toString() && folderPassword.toString() === providedPassword.toString();
        };

        if (folderData.password && !isPasswordValid(folderData.password, senha)) {
          return res.status(403).json({ success: false, message: "Pasta trancada e senha providenciada está incorreta", parente });
        }
      }

      const childrenSnapshot = await get(
        query(skinsRef, orderByChild("parente"), equalTo(folder))
      );

      if (childrenSnapshot.exists()) {
        const entidades = Object
          .entries(childrenSnapshot.val())
          .map(([id, { nome, tipo, password }]) => {
            return { id, nome, tipo, trancado: !!password };
          })
          .sort((a ,b) => (a.tipo === "pasta" ? -1 : 1));
        
        res.json({ success: true, data: { entidades, parente } });
      } else {
        res.status(400).json({ success: false, message: 'Pasta não existente' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Erro' });
    }
});

// Listagem de todos os arquivos
// router.get('/list', async (req, res) => {
//   try {
//     const skinsRef = ref(storageFirebase, `skins`);
//     const result = await listAll(skinsRef);

//     const skins = await Promise.all(
//       result.items.map(async (skinRef) => {
//         const url = await getDownloadURL(skinRef);
//         return { name: skinRef.name, url };
//       })
//     );

//     res.json({ success: true, skins });
//   } catch (err) {
//     console.log(err);
//     res
//       .status(500)
//       .json({ success: false, message: 'Erro!' });
//   }
// });

// Obtêm uma única skin
// router.get('/', async (req, res) => {
//   const id = req.query.id ? req.query.id.trim() : null;

//   if (!id) {
//     return res
//       .status(400)
//       .json({ success: false, message: 'Parâmetro id faltando!' });
//   }

//   let skinRef;
//   try {
//     skinRef = ref(storageFirebase, `skins/${id}`);
//   } catch (err) {
//     console.log(err);
//     res
//       .status(500)
//       .json({ success: false, message: 'Erro!' });
//   }

//   try {
//     res.json({
//       success: true,
//       skin: { name: skinRef.name, url: await getDownloadURL(skinRef) }
//     });
//   } catch (err) {
//     res
//       .status(400)
//       .json({ success: false, message: `Não foi possível obter ${id}` });
//   }
// });

module.exports = router;
