# Configuration Email sur Render

## 🎯 Problème
Les réponses sont sauvegardées mais l'email n'est pas envoyé.

## ✅ Solution: Vérifier les variables d'environnement

### Étape 1: Vérifier les variables sur Render

1. Allez sur **https://dashboard.render.com**
2. Cliquez sur votre service `questionnaire-olcay-yasar`
3. Allez dans **"Environment"**
4. Vérifiez que ces 3 variables existent:

   - **EMAIL_USER** = votre.email@gmail.com
   - **EMAIL_PASS** = votre mot de passe d'application Gmail
   - **EMAIL_TO** = email.destination@example.com

### Étape 2: Créer un mot de passe d'application Gmail

Si vous n'avez pas encore de mot de passe d'application:

1. Allez sur **https://myaccount.google.com/security**
2. Activez la **validation en 2 étapes** (obligatoire)
3. Cherchez **"Mots de passe des applications"**
4. Créez un nouveau mot de passe:
   - Nom: "Questionnaire Render"
   - Copiez le mot de passe généré (16 caractères)
5. Utilisez ce mot de passe dans `EMAIL_PASS` sur Render

### Étape 3: Mettre à jour sur Render

1. Dans **"Environment"** sur Render
2. Modifiez `EMAIL_PASS` avec le nouveau mot de passe d'application
3. Cliquez **"Save Changes"**
4. Render redéploie automatiquement

---

## 🔍 Vérification

Après le redéploiement:

1. Soumettez un questionnaire
2. Vérifiez les **logs** sur Render:
   - ✅ Vous devriez voir: `✅ Email envoyé pour la réponse #...`
   - ⚠️ Si erreur: `⚠️ Erreur envoi email (réponse sauvegardée): ...`

---

## 💡 Notes importantes

- **Les réponses sont TOUJOURS sauvegardées**, même si l'email échoue
- L'email est envoyé de façon asynchrone (ne bloque plus la soumission)
- Si l'email échoue, vous verrez quand même les statistiques

---

## 🔐 Sécurité

- **NE JAMAIS** utiliser votre mot de passe Gmail principal
- **TOUJOURS** utiliser un mot de passe d'application
- Le mot de passe d'application peut être révoqué à tout moment

---

## ⚠️ Problèmes courants

### Email non reçu mais pas d'erreur dans les logs
- Vérifiez vos **spams/courrier indésirable**
- Vérifiez que `EMAIL_TO` est correct

### Erreur "Invalid login"
- Vérifiez que la validation en 2 étapes est activée
- Créez un nouveau mot de passe d'application
- Vérifiez qu'il n'y a pas d'espaces dans `EMAIL_PASS`

### Erreur "Connection timeout"
- Render peut bloquer certains ports SMTP
- L'email sera réessayé automatiquement
