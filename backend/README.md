# Unlock Backend API

API backend pour Unlock Technologies - Node.js + Express + Sequelize + MySQL

## 🚀 Démarrage Rapide

### Développement

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp env.example .env
# Éditer .env avec vos valeurs

# Démarrer en mode développement
npm run dev
```

### Production (PM2)

```bash
# Vérifier la configuration
npm run check:production

# Build
npm run build

# Démarrer avec PM2
npm run start:pm2

# Voir les logs
npm run logs:pm2
```

## 📋 Scripts Disponibles

- `npm run dev` - Démarrage en mode développement avec hot-reload
- `npm run build` - Compiler TypeScript vers JavaScript
- `npm run start` - Démarrer le serveur (après build)
- `npm run start:pm2` - Démarrer avec PM2 (production)
- `npm run stop:pm2` - Arrêter PM2
- `npm run restart:pm2` - Redémarrer PM2
- `npm run reload:pm2` - Recharger avec zero-downtime
- `npm run logs:pm2` - Voir les logs PM2
- `npm run monit:pm2` - Monitoring PM2
- `npm run check:production` - Vérifier la config avant déploiement
- `npm run db:sync` - Synchroniser la BDD (DEV UNIQUEMENT)
- `npm run db:migrate` - Exécuter les migrations
- `npm run db:seed` - Peupler la BDD avec des données de test

## 🔒 Sécurité Production

⚠️ **IMPORTANT**: En production, la synchronisation automatique de la BDD est **INTERDITE**.

- La BDD ne se synchronisera **JAMAIS** automatiquement en production
- Utiliser les migrations: `npm run db:migrate`
- Vérifier la config: `npm run check:production`

## 📖 Documentation

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour le guide complet de déploiement sur Debian.

## 🏗️ Architecture

- **Framework**: Express.js
- **ORM**: Sequelize
- **Base de données**: MySQL/MariaDB
- **Authentification**: JWT
- **Logging**: Winston
- **Process Manager**: PM2 (production)

## 📝 Variables d'Environnement

Voir `.env.production.example` pour la liste complète des variables.

**Critiques en production:**
- `JWT_SECRET` - Min 32 caractères
- `API_KEY` - Min 32 caractères
- `ADMIN_PASSWORD` - Mot de passe fort
- `DB_SYNC=false` - Toujours false en production
- `DB_FORCE_SYNC=false` - Toujours false en production
- `DB_ALTER_SYNC=false` - Toujours false en production

