# Application de Questionnaire Statistique

Application web complète pour créer et gérer des questionnaires à partir de fichiers Word, avec envoi automatique des réponses par email pour analyse statistique.

## 🚀 Fonctionnalités

- ✅ Upload de fichiers Word (.docx) pour créer des questionnaires
- ✅ Interface utilisateur moderne et responsive
- ✅ Envoi automatique des réponses par email
- ✅ Collecte de données à des fins statistiques
- ✅ Mode administrateur pour gérer les questionnaires
- ✅ Mode utilisateur pour répondre aux questionnaires

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn
- Un compte Gmail pour l'envoi d'emails

## 🔧 Installation

### 1. Installer les dépendances du serveur

```bash
npm install
```

### 2. Installer les dépendances du client

```bash
cd client
npm install
cd ..
```

### 3. Configuration de l'email

1. Copiez le fichier `.env.example` en `.env`:
```bash
copy .env.example .env
```

2. Éditez le fichier `.env` avec vos informations:
```env
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-application
EMAIL_TO=destinataire@example.com
PORT=3001
```

**Important pour Gmail:**
- Vous devez créer un "Mot de passe d'application" dans votre compte Google
- Allez sur: https://myaccount.google.com/apppasswords
- Créez un nouveau mot de passe d'application et utilisez-le dans `EMAIL_PASS`

## 🎯 Format du fichier Word

Votre fichier Word doit suivre ce format:

```
1. Quelle est votre tranche d'âge?
a) 18-25 ans
b) 26-35 ans
c) 36-45 ans
d) 46 ans et plus

2. Quel est votre niveau de satisfaction?
a) Très satisfait
b) Satisfait
c) Peu satisfait
d) Pas satisfait

3. À quelle fréquence utilisez-vous ce service?
a) Quotidiennement
b) Hebdomadairement
c) Mensuellement
d) Rarement
```

**Règles importantes:**
- Numérotez les questions avec `1.`, `2.`, etc.
- Les options doivent commencer par `a)`, `b)`, `c)`, `d)`
- Laissez une ligne vide entre chaque question
- **Note:** Il n'y a pas de bonnes ou mauvaises réponses, toutes les réponses sont collectées à des fins statistiques

## 🚀 Démarrage

### Mode développement (recommandé)

Lance le serveur backend et le client frontend simultanément:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Mode production

1. Build du client:
```bash
npm run build
```

2. Démarrage du serveur:
```bash
npm start
```

L'application sera accessible sur http://localhost:3001

## 📖 Utilisation

### Mode Administrateur

1. Cliquez sur "Mode Admin" dans la barre de navigation
2. Sélectionnez votre fichier Word (.docx)
3. Cliquez sur "Créer le questionnaire"
4. Le questionnaire est maintenant disponible pour les utilisateurs

### Mode Utilisateur

1. Assurez-vous qu'un questionnaire a été créé par l'administrateur
2. Remplissez votre nom et email
3. Répondez aux questions
4. Cliquez sur "Soumettre mes réponses"
5. Vos réponses seront envoyées par email à l'administrateur pour analyse statistique

## 📧 Format de l'email reçu

L'email contient:
- Nom et email du participant
- Date et heure de soumission
- Détail de chaque question avec la réponse donnée
- Format clair pour faciliter l'analyse statistique

## 🛠️ Technologies utilisées

### Backend
- Node.js
- Express
- Multer (upload de fichiers)
- Mammoth (lecture de fichiers Word)
- Nodemailer (envoi d'emails)

### Frontend
- React
- Vite
- TailwindCSS
- Lucide React (icônes)
- Axios

## 📁 Structure du projet

```
qcm-app/
├── client/                 # Application React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── App.jsx        # Composant principal
│   │   └── main.jsx       # Point d'entrée
│   └── package.json
├── server/
│   └── index.js           # Serveur Express
├── uploads/               # Dossier temporaire pour les fichiers
├── .env                   # Configuration (à créer)
├── .env.example          # Exemple de configuration
├── package.json
└── README.md
```

## 🔒 Sécurité

- Les fichiers Word uploadés sont supprimés après traitement
- Les mots de passe d'email sont stockés dans `.env` (non versionné)
- Validation des types de fichiers (uniquement .doc et .docx)

## 🐛 Dépannage

### L'email ne s'envoie pas
- Vérifiez que vous utilisez un mot de passe d'application Gmail
- Vérifiez que l'authentification à deux facteurs est activée sur votre compte Google
- Vérifiez les informations dans le fichier `.env`

### Le fichier Word n'est pas reconnu
- Assurez-vous que le fichier est au format .docx (pas .doc)
- Vérifiez que le format du fichier respecte les règles indiquées

### Le questionnaire ne s'affiche pas
- Vérifiez que vous avez bien uploadé un fichier en mode Admin
- Rechargez la page
- Vérifiez la console du navigateur pour les erreurs

## 📝 Licence

MIT

## 👨‍💻 Support

Pour toute question ou problème, veuillez créer une issue sur le repository.
