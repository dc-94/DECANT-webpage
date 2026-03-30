import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVI66kdvx9dPNvR3UJ_AJ1WU1pVh83XO4",
  authDomain: "web-decant.firebaseapp.com",
  projectId: "web-decant",
  storageBucket: "web-decant.firebasestorage.app",
  messagingSenderId: "214647417526",
  appId: "1:214647417526:web:b0a8cf839855e62d731417"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

//  servicios que usaremos en otras partes de la web
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);