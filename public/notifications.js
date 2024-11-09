const admin = require('firebase-admin');
require('dotenv').config();

// Caminho para o arquivo JSON com as credenciais do Firebase
const serviceAccount = {
    type: 'service_account',
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: 'googleapis.com',
  };

// Inicializa o Firebase Admin SDK com as credenciais
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL,
    storageBucket: process.env.STORAGE_BUCKET,
  });

// Exemplo de envio de notificação para um dispositivo específico
const registrationToken = 'TOKEN_DO_DISPOSITIVO'; // Substitua com o token do dispositivo que você obteve

const message = {
    notification: {
        title: 'Notificação Teste',
        body: 'Aqui está a sua notificação!',
    },
    token: registrationToken,
};

// Envia a notificação
admin.messaging().send(message)
    .then((response) => {
        console.log('Mensagem enviada com sucesso:', response);
    })
    .catch((error) => {
        console.log('Erro ao enviar mensagem:', error);
    });
