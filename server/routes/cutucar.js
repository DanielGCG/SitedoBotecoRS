const express = require('express');
const multer = require('multer');
const { TwitterApi } = require('twitter-api-v2');
const { getStorage, ref, getDownloadURL, uploadBytes, getBytes } = require('firebase/storage');
const router = express.Router();

// Configuração do upload de mídia
const upload = multer();

// Configuração do Twitter API
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
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

// Rota para postar no Twitter com mídia
router.post('/tweet-media', upload.single('media'), async (req, res) => {
  const { text, userIp } = req.body;
  const media = req.file;
  const currentDate = new Date().toISOString();

  // Verifica IP suspeito
  const fullIp = userIp.includes('::ffff:') ? userIp.split('::ffff:')[1] : userIp;
  if (fullIp === "0") {
    res.status(500).json({ success: false, message: 'Sossega o cu que eu sei quem é você.' });
    return;
  }

  try {
    let mediaId;

    // Upload da mídia para o Twitter, se houver
    if (media) {
      mediaId = await twitterClient.v1.uploadMedia(media.buffer, {
        mimeType: media.mimetype,
      });
    }

    // Publicação do tweet
    const tweetOptions = { text };
    if (mediaId) {
      tweetOptions.media = { media_ids: [mediaId] };
    }

    const tweet = await twitterClient.v2.tweet(tweetOptions);

    // Enviar log para o Firebase
    const logMessage = media ? `${text} \n(com mídia)` : text;
    await enviarLog(logMessage, userIp, currentDate);

    res.json({ success: true, message: 'Tweet enviado com sucesso!', tweet });
  } catch (error) {
    console.error('Erro ao postar tweet:', error);

    const logErrorMessage = media
      ? `${text} \n(erro ao enviar cutucada com mídia)`
      : `${text} \n(erro ao enviar)`;
    await enviarLog(logErrorMessage, userIp, currentDate);

    res.status(500).json({ success: false, message: `Erro ao postar o tweet: ${error.message}` });
  }
});

// Verificar senha para "cutucar"
router.post('/verify-senha-cutucar', (req, res) => {
  const { senha } = req.body;
  const predefinedPassword = process.env.SENHACUTUCAR;

  if (senha === predefinedPassword) {
    res.json({ success: true, message: 'Senha correta!' });
  } else {
    res.json({ success: false, message: 'Senha incorreta!' });
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

module.exports = router;