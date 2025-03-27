// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpNKtQxbIOHtM4lce6XI0Axp55jp9bIkw",
  authDomain: "smart-contract-a33d6.firebaseapp.com",
  projectId: "smart-contract-a33d6",
  storageBucket: "smart-contract-a33d6.firebasestorage.app",
  messagingSenderId: "252549192816",
  appId: "1:252549192816:web:29a3ccef83ede77385a8b5",
  measurementId: "G-SP46ZNXYJF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage }; 