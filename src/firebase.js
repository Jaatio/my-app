// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyCe-HSF6ZBU7Y2mviopL0QmjWzNc_UNG44",
  authDomain: "maapp-8d258.firebaseapp.com",
  databaseURL: "https://maapp-8d258-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "maapp-8d258",
  storageBucket: "maapp-8d258.firebasestorage.app",
  messagingSenderId: "152913597343",
  appId: "1:152913597343:web:f3397162c859af2d10e3aa",
  measurementId: "G-Y4G25C8NTX"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth(app);


export { auth, database };


