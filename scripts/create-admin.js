// Script pour créer un administrateur
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, updateDoc } = require('firebase/firestore');
const readline = require('readline');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCpNKtQxbIOHtM4lce6XI0Axp55jp9bIkw",
  authDomain: "smart-contract-a33d6.firebaseapp.com",
  projectId: "smart-contract-a33d6",
  storageBucket: "smart-contract-a33d6.firebasestorage.app",
  messagingSenderId: "252549192816",
  appId: "1:252549192816:web:29a3ccef83ede77385a8b5",
  measurementId: "G-SP46ZNXYJF"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Interface de ligne de commande
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour créer un administrateur
async function createAdmin() {
  console.log('=== Création d\'un compte administrateur ===');
  
  // Demander les informations
  rl.question('Email: ', async (email) => {
    rl.question('Mot de passe: ', async (password) => {
      rl.question('Nom d\'affichage: ', async (displayName) => {
        try {
          console.log('Création du compte administrateur...');
          
          // Essayer de créer un compte utilisateur
          let userCredential;
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Compte créé avec succès');
          } catch (error) {
            // Si l'utilisateur existe déjà, se connecter
            if (error.code === 'auth/email-already-in-use') {
              console.log('L\'utilisateur existe déjà, connexion...');
              userCredential = await signInWithEmailAndPassword(auth, email, password);
            } else {
              throw error;
            }
          }
          
          const user = userCredential.user;
          
          // Créer ou mettre à jour le document utilisateur dans Firestore
          const userData = {
            id: user.uid,
            email: user.email,
            displayName: displayName,
            createdAt: new Date(),
            contacts: [],
            pendingInvitations: [],
            isAdmin: true
          };
          
          // Vérifier si le document existe déjà
          try {
            await setDoc(doc(db, "users", user.uid), userData);
            console.log('Document utilisateur créé avec succès');
          } catch (error) {
            await updateDoc(doc(db, "users", user.uid), {
              displayName: displayName,
              isAdmin: true
            });
            console.log('Document utilisateur mis à jour avec succès');
          }
          
          console.log(`Compte administrateur créé pour ${email}`);
          
        } catch (error) {
          console.error('Erreur lors de la création du compte administrateur:', error);
        } finally {
          rl.close();
          process.exit(0);
        }
      });
    });
  });
}

// Exécuter la fonction
createAdmin(); 