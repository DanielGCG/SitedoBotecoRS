const express = require('express');
const { TwitterApi } = require('twitter-api-v2');
const { getStorage, ref, getDownloadURL, uploadBytes, getBytes } = require('firebase/storage');
const multer = require('multer');
const gifFrames = require('gif-frames');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gifencoder');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

// Configuração do Twitter API
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function enviarLog(text, userIp, currentDate) {
  try {
    const bucket = getStorage();
    const logRef = ref(bucket, 'logs/logs.txt');

    let existingLog = '';
    try {
      const existingLogBytes = await getBytes(logRef);
      existingLog = new TextDecoder().decode(existingLogBytes);
    } catch (error) {
      if (error.code !== 'storage/object-not-found') throw error;
    }

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

    const newLogContent = existingLog + "\n------//------//------\n" + `Data: ${formattedDate} | IP: ${userIp} | Texto: ${text}\n`;
    const logBuffer = new TextEncoder().encode(newLogContent);
    await uploadBytes(logRef, logBuffer);
    console.log('Log enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar log:', error);
  }
}

// Outras rotas (tweet + senha) continuam iguais
router.post('/tweet-media', upload.single('media'), async (req, res) => {
  const { text, userIp } = req.body;
  const media = req.file;
  const currentDate = new Date().toISOString();

  try {
    let mediaId;
    if (media) {
      mediaId = await twitterClient.v1.uploadMedia(media.buffer, { mimeType: media.mimetype });
    }

    const tweetOptions = { text };
    if (mediaId) tweetOptions.media = { media_ids: [mediaId] };

    const tweet = await twitterClient.v2.tweet(tweetOptions);

    await enviarLog(text + (media ? ' (com mídia)' : ''), userIp, currentDate);

    res.json({ success: true, message: 'Tweet enviado com sucesso!', tweet });
  } catch (error) {
    console.error('Erro ao postar tweet:', error);
    await enviarLog(text + (media ? ' (erro ao enviar cutucada com mídia)' : ' (erro ao enviar)'), userIp, currentDate);
    res.status(500).json({ success: false, message: 'Erro ao postar o tweet: ' + error.message });
  }
});

router.post('/verify-senha-cutucar', (req, res) => {
  const { senha } = req.body;
  const predefinedPassword = process.env.SENHACUTUCAR;
  if (senha === predefinedPassword) {
    res.json({ success: true, message: 'Senha correta!' });
  } else {
    res.json({ success: false, message: 'Senha incorreta!' });
  }
});

module.exports = router;
