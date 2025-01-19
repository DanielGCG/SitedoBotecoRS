const { getDatabase, set } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.FB_APIKEY,
  authDomain: process.env.FB_AUTHDOMAIN,
  databaseURL: process.env.FB_DATABASEURL,
  projectId: process.env.FB_PROJECTID,
  storageBucket: process.env.FB_STORAGEBUCKET,
  messagingSenderId: process.env.FB_MESSAGINGSENDERID,
  appId: process.env.FB_APPID,
};

function writeUserData(userId, name, email, imageUrl) {
  const db = getDatabase(app);
  const reference = ref(db, 'users/' + userId);

  return set(reference, {
    username: name,
    email: email,
    profile_picture: imageUrl,
  });
}

module.exports = { writeUserData };