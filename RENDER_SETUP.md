# Configuration Render avec PostgreSQL

## 🎯 Problème
Les questionnaires disparaissent après un certain temps car Render utilise un système de fichiers éphémère.

## ✅ Solution: PostgreSQL (100% GRATUIT)

### Étape 1: Créer une base de données PostgreSQL

1. Allez sur **https://dashboard.render.com**
2. Cliquez sur **"New +"** → **"PostgreSQL"**
3. Configurez:
   - **Name:** `questionnaires-db`
   - **Database:** `questionnaires`
   - **User:** (généré automatiquement)
   - **Region:** Même région que votre service web
   - **Plan:** **Free** (gratuit)
4. Cliquez sur **"Create Database"**

### Étape 2: Copier l'URL de connexion

1. Une fois la base créée, cliquez dessus
2. Trouvez **"Internal Database URL"** (ou "External Database URL")
3. Cliquez sur **"Copy"** pour copier l'URL complète
   - Format: `postgresql://user:password@host/database`

### Étape 3: Ajouter la variable d'environnement

1. Retournez à votre service web `questionnaire-olcay-yasar`
2. Allez dans **"Environment"**
3. Cliquez sur **"Add Environment Variable"**
4. Ajoutez:
   - **Key:** `DATABASE_URL`
   - **Value:** (collez l'URL PostgreSQL copiée)
5. Cliquez sur **"Save Changes"**

### Étape 4: Redéploiement automatique

Render va automatiquement redéployer votre application avec PostgreSQL.

---

## 📊 Résultat

✅ Vos questionnaires seront sauvegardés dans PostgreSQL  
✅ Les données persisteront **pour toujours**  
✅ **100% GRATUIT** (plan Free de Render)  
✅ Sauvegarde automatique par Render  

---

## 🔍 Vérification

Après le redéploiement, vérifiez les logs de votre service web:
- Vous devriez voir: `🐘 Utilisation de PostgreSQL`
- Et: `✅ Tables PostgreSQL créées`

Si vous voyez `📁 Utilisation de fichiers JSON locaux`, c'est que la variable `DATABASE_URL` n'est pas configurée.

---

## 💡 Notes

- **En local:** L'application utilise des fichiers JSON (pas besoin de PostgreSQL)
- **En production (Render):** L'application utilise PostgreSQL automatiquement
- La base PostgreSQL Free de Render inclut:
  - 256 MB de stockage
  - Sauvegardes automatiques (7 jours)
  - Connexions SSL sécurisées

---

## 🔄 Migration des données existantes

Si vous aviez déjà des questionnaires (qui ont disparu), vous devrez les recréer.
Les nouveaux questionnaires seront sauvegardés de façon permanente dans PostgreSQL.

---

## ⚠️ Important

- **NE PAS** supprimer la base PostgreSQL sans avoir exporté vos données!
- La base Free expire après 90 jours d'inactivité (mais se réactive automatiquement)
