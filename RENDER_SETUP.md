# Configuration Render pour Persistent Disk

## 🎯 Problème
Les questionnaires disparaissent après un certain temps car Render utilise un système de fichiers éphémère.

## ✅ Solution: Persistent Disk (GRATUIT)

### Étape 1: Créer un Persistent Disk

1. Allez sur **https://dashboard.render.com**
2. Cliquez sur votre service `questionnaire-olcay-yasar`
3. Dans le menu de gauche, cliquez sur **"Disks"**
4. Cliquez sur **"Add Disk"**
5. Configurez:
   - **Name:** `questionnaires-storage`
   - **Mount Path:** `/data`
   - **Size:** 1 GB (gratuit)
6. Cliquez sur **"Create"**

### Étape 2: Ajouter la variable d'environnement

1. Toujours dans votre service, allez dans **"Environment"**
2. Cliquez sur **"Add Environment Variable"**
3. Ajoutez:
   - **Key:** `DATA_PATH`
   - **Value:** `/data`
4. Cliquez sur **"Save Changes"**

### Étape 3: Redéploiement automatique

Render va automatiquement redéployer votre application avec le Persistent Disk.

---

## 📊 Résultat

✅ Vos questionnaires seront sauvegardés dans `/data/questionnaires-data.json`  
✅ Les données persisteront même après un redémarrage  
✅ **1 GB de stockage = GRATUIT!**  

---

## 🔍 Vérification

Après le redéploiement, vérifiez les logs:
- Vous devriez voir: `Dossier de données: /data`
- Au lieu de: `Dossier de données: /opt/render/project/src/server`

---

## 💡 Notes

- Le Persistent Disk est attaché au service
- Les données sont sauvegardées automatiquement
- Backup recommandé: exportez vos questionnaires régulièrement
- Coût: 1 GB gratuit, puis ~$0.25/GB/mois

---

## ⚠️ Important

**NE PAS** supprimer le Persistent Disk sans avoir sauvegardé vos données!
