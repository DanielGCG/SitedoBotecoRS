console.log("Processando imagem do dia...");
require('dotenv').config();

const admin = require("firebase-admin");
const dayjs = require("dayjs");
const mime = require('mime-types'); // Biblioteca para detectar MIME
const { TwitterApi } = require('twitter-api-v2');

const serviceAccount = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

// Inicializar Firebase com Storage e Database
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "boteco-6fcfa.appspot.com",
  databaseURL: "https://boteco-6fcfa-default-rtdb.firebaseio.com"
});

const storage = admin.storage().bucket();

// Configuração da API do Twitter
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});
const rwClient = twitterClient.readWrite;

// Função para enviar tweet com texto e mídia
async function enviarTweetComImagem(texto, arquivo, mimeType) {
  try {
    console.log(`Enviando mídia para o Twitter...`);
    const mediaId = await rwClient.v1.uploadMedia(arquivo, { mimeType: 'image/png' });
    console.log(`Mídia enviada com sucesso. Media ID: ${mediaId}`);

    console.log(`Enviando tweet: ${texto}`);
    const tweetResponse = await rwClient.v2.tweet({
      text: texto,
      media: { media_ids: [mediaId] },
    });

    console.log(`Tweet enviado com sucesso: ${JSON.stringify(tweetResponse)}`);
    return tweetResponse;
  } catch (error) {
    console.error("Erro ao enviar tweet:", error.message);
    if (error.response) {
      console.error("Detalhes da resposta de erro:", error.response.data);
    }
    throw error;
  }
}

// Função para processar imagens do dia
async function processarImagemDoDia() {
  const pasta = "imagensdodia/";

  try {
    const [arquivos] = await storage.getFiles({ prefix: pasta });
    const imagens = arquivos.filter(arquivo => arquivo.name.endsWith(".gif") || arquivo.name.endsWith(".png"));

    if (imagens.length === 0) {
      console.log("Nenhuma imagem encontrada na pasta.");
      return;
    }

    imagens.sort((a, b) => {
      const nomeA = a.name.split("/").pop();
      const nomeB = b.name.split("/").pop();

      const dataA = new Date(nomeA.split("-").slice(0, 3).join("-"));
      const dataB = new Date(nomeB.split("-").slice(0, 3).join("-"));

      return dataA - dataB;
    });

    const agora = dayjs();

    for (let i = 0; i < imagens.length; i++) {
      const imagem = imagens[i];
      const nomeAtual = imagem.name.split("/").pop();

      if (nomeAtual.startsWith("imagemdodia-")) {
        const dataImagem = dayjs(nomeAtual.split("-")[1]);
        const horasDiferenca = agora.diff(dataImagem, "hour");

        if (horasDiferenca > 24 && imagens.length > 1) {
          console.log(`Removendo imagem mais antiga: ${imagem.name}`);
          await storage.file(imagem.name).delete();
        } else {
          console.log("A imagem atual ainda é válida como imagemdodia.");
          return;
        }
      }
    }

    const novaImagem = imagens[0];
    const nomeImagem = novaImagem.name.split("/").pop();
    const novoNome = `${pasta}imagemdodia-${nomeImagem}`;

    console.log(`Renomeando ${novaImagem.name} para ${novoNome}`);
    const [arquivo] = await storage.file(novaImagem.name).download();

    if (!Buffer.isBuffer(arquivo)) {
      throw new Error("O arquivo não foi carregado corretamente.");
    }

    const mimeType = 'image/png';
    console.log(`Forçando tipo MIME como: ${mimeType}`);

    const novoArquivo = storage.file(novoNome);
    await novoArquivo.save(arquivo);
    await novoArquivo.makePublic();

    console.log(`Nova imagem do dia: ${novoNome}`);
    await storage.file(novaImagem.name).delete();

    const nomeImagemLimpo = novoNome.split("/").pop().replace(/^imagemdodia-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(\.\d{3}Z)?-/, '').replace(/\.[^.]+$/, '');

    const textoDoTweet = `Imagem do dia!

${nomeImagemLimpo}


https://www.boteco.live
#ImagemDoDia`;
    console.log(`Texto do tweet: ${textoDoTweet}`);

    await enviarTweetComImagem(textoDoTweet, arquivo, mimeType);

  } catch (error) {
    console.error("Erro ao processar imagens do dia:", error.message);
    console.error("Stack trace:", error.stack);
    if (error.response) {
      console.error("Detalhes da resposta de erro:", error.response.data);
    }
  }
}

processarImagemDoDia();

module.exports = { processarImagemDoDia, enviarTweetComImagem };