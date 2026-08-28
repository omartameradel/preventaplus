import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAA-iRIXpM_xkN3btGyr7elW8mwiuDbTLo",
  authDomain: "wallet-tamer-adel.firebaseapp.com",
  projectId: "wallet-tamer-adel",
  storageBucket: "wallet-tamer-adel.firebasestorage.app",
  messagingSenderId: "51007948250",
  appId: "1:51007948250:web:e1f6eaaebb4202b8aface3",
  measurementId: "G-M9LTMX3LHV"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); 
export const googleProvider = new GoogleAuthProvider();
