import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-mv5SFXajqleSIQK8nMDyP62tugWuBH8",
  authDomain: "wedding-checklist-55419.firebaseapp.com",
  projectId: "wedding-checklist-55419",
  storageBucket: "wedding-checklist-55419.appspot.com",
  messagingSenderId: "1010734419209",
  appId: "1:1010734419209:web:307411193fc3fc1bb557d8",
  measurementId: "G-0M1CHYLX97"
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };