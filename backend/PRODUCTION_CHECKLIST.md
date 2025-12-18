# ✅ Checklist Production - Backend Unlock

## 🔒 Sécurité - CRITIQUE

### Variables d'Environnement

- [ ] `NODE_ENV=production` (obligatoire)
- [ ] `JWT_SECRET` changé (min 32 caractères, générer avec `openssl rand -base64 32`)
- [ ] `API_KEY` changé (min 32 caractères, générer avec `openssl rand -base64 32`)
- [ ] `ADMIN_PASSWORD` changé (mot de passe fort)
- [ ] `DB_PASSWORD` changé (pas "root")
- [ ] `SMTP_PASSWORD` changé si nécessaire

### Base de Données - PROTECTION ABSOLUE

- [ ] `DB_SYNC=false` (obligatoire en production)
- [ ] `DB_FORCE_SYNC=false` (obligatoire en production)
- [ ] `DB_ALTER_SYNC=false` (obligatoire en production)
- [ ] Utilisateur BDD dédié créé (pas root)
- [ ] Base de données avec charset `utf8mb4`
- [ ] Backups automatiques configurés

### CORS

- [ ] `ALLOWED_ORIGINS` configuré avec les domaines réels (pas localhost)
- [ ] Format: `https://www.unlock-technologies.fr,https://unlock-technologies.fr`

## 🚀 Configuration PM2

- [ ] PM2 installé globalement: `npm install -g pm2`
- [ ] `ecosystem.config.js` configuré
- [ ] Scripts npm ajoutés dans `package.json`
- [ ] PM2 sauvegardé: `pm2 save`
- [ ] Démarrage auto configuré: `pm2 startup`

## 📦 Build et Déploiement

- [ ] `npm run build` exécuté avec succès
- [ ] Dossier `dist/` créé
- [ ] Fichier `.env` créé depuis `.env.production.example`
- [ ] Vérification: `npm run check:production`

## 🔍 Vérifications Post-Déploiement

- [ ] Health check: `curl http://localhost:4000/health`
- [ ] Logs PM2: `pm2 logs unlock-backend`
- [ ] Monitoring: `pm2 monit`
- [ ] Pas d'erreurs dans les logs
- [ ] Base de données accessible
- [ ] Uploads fonctionnels

## 📝 Commandes Utiles

```bash
# Vérifier la config avant déploiement
npm run check:production

# Build
npm run build

# Démarrer avec PM2
npm run start:pm2

# Voir les logs
npm run logs:pm2

# Redémarrer
npm run restart:pm2

# Recharger (zero downtime)
npm run reload:pm2

# Monitoring
npm run monit:pm2
```

## ⚠️ RAPPEL CRITIQUE

**La base de données NE SE SYNCHRONISERA JAMAIS automatiquement en production.**

- Le code vérifie `NODE_ENV=production` et bloque toute sync
- Utiliser les migrations: `npm run db:migrate`
- Le script `db:sync` est aussi protégé en production

