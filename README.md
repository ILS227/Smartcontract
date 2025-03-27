# Smart Contract App

Une application mobile développée avec Expo pour la gestion de contrats intelligents.

## Fonctionnalités

- Authentification utilisateur
- Création et gestion de contrats
- Interface utilisateur intuitive
- Support multi-plateformes (iOS, Android, Web)

## Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn
- Expo CLI
- Compte Firebase

## Installation

1. Cloner le repository
   ```bash
   git clone [URL_DU_REPO]
   cd SmartContract
   ```

2. Installer les dépendances
   ```bash
   npm install
   ```

3. Configurer Firebase
   - Créer un fichier `.env` à la racine du projet
   - Ajouter vos variables d'environnement Firebase :
     ```
     FIREBASE_API_KEY=votre_api_key
     FIREBASE_AUTH_DOMAIN=votre_auth_domain
     FIREBASE_PROJECT_ID=votre_project_id
     FIREBASE_STORAGE_BUCKET=votre_storage_bucket
     FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
     FIREBASE_APP_ID=votre_app_id
     ```

4. Démarrer l'application
   ```bash
   npx expo start
   ```

## Structure du Projet

```
SmartContract/
├── app/                    # Dossier principal de l'application
│   ├── (auth)/            # Routes d'authentification
│   ├── (tabs)/            # Routes principales
│   └── _layout.tsx        # Layout principal
├── components/            # Composants réutilisables
├── firebase/             # Configuration Firebase
├── models/               # Modèles de données
└── assets/              # Ressources statiques
```

## Technologies Utilisées

- Expo
- React Native
- Firebase
- TypeScript
- Expo Router

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
