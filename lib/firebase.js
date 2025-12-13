import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrkfrHIGnhNLI423RvDqHAgaZccJo39MU",
  authDomain: "assistant-immo-6cc42.firebaseapp.com",
  projectId: "assistant-immo-6cc42",
  storageBucket: "assistant-immo-6cc42.firebasestorage.app",
  messagingSenderId: "983711975424",
  appId: "1:983711975424:web:afebea40e99baaac88b0e5",
  measurementId: "G-2MYQ4R88LM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);