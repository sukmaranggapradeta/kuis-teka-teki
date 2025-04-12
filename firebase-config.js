// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-pZuM5kI3QSgCF5uC0MhnV_pzhLgPSyM",
  authDomain: "kuis-teka-teki.firebaseapp.com",
  projectId: "kuis-teka-teki",
  storageBucket: "kuis-teka-teki.firebasestorage.app",
  messagingSenderId: "778507806256",
  appId: "1:778507806256:web:59cfa534b81c8d48716ff5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
