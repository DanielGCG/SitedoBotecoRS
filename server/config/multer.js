const multer = require('multer');
const storage = multer.memoryStorage();

// Exporta o middleware do multer com o armazenamento configurado
module.exports = multer({ storage });
