const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const config = {
    apiKey: "AIzaSyAUQsGPjkNyPsqynBjFyTiRvY3ITUnUVmc",
    authDomain: "hyper-arcade.firebaseapp.com",
    databaseURL: "https://hyper-arcade-default-rtdb.firebaseio.com",
    projectId: "hyper-arcade",
    storageBucket: "hyper-arcade.appspot.com",
    messagingSenderId: "198052392550",
    appId: "1:198052392550:web:3cb87dfecc6233794f47a7"
  };

const app = initializeApp(config);
const db = getFirestore(app);
module.exports = {db};