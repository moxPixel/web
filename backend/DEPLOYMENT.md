# 🚀 Guide de Déploiement - Backend Unlock

## Prérequis pour Debian

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installer MySQL/MariaDB
sudo apt install -y mysql-server

# Installer PM2 globalement
sudo npm install -g pm2

# Installer les dépendances du projet
cd /path/to/backend
npm install
```

## Configuration de la Base de Données

```bash
# Créer la base de données
sudo mysql -u root -p
```

```sql
CREATE DATABASE unlock_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'unlock_user'@'localhost' IDENTIFIED BY 'VOTRE_MOT_DE_PASSE_FORT';
GRANT ALL PRIVILEGES ON unlock_production.* TO 'unlock_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Configuration des Variables d'Environnement

```bash
# Copier le fichier d'exemple
cp .env.production.example .env

# Éditer avec vos valeurs réelles
nano .env
```

**⚠️ IMPORTANT:**
- Changer `JWT_SECRET` (générer avec: `openssl rand -base64 32`)
- Changer `API_KEY` (générer avec: `openssl rand -base64 32`)
- Changer `ADMIN_PASSWORD` (mot de passe fort)
- Configurer `ALLOWED_ORIGINS` avec vos domaines réels
- Vérifier que `DB_SYNC=false`, `DB_FORCE_SYNC=false`, `DB_ALTER_SYNC=false`

## Build et Migration de la Base de Données

```bash
# Build du projet
npm run build

# Créer les tables (UNIQUEMENT la première fois, via migrations)
npm run db:migrate

# OU si vous préférez sync (DÉVELOPPEMENT UNIQUEMENT)
# npm run db:sync
```

## Démarrage avec PM2

```bash
# Démarrer l'application
npm run start:pm2

# Vérifier le statut
pm2 status

# Voir les logs
npm run logs:pm2

# Monitoring en temps réel
npm run monit:pm2

# Sauvegarder la configuration PM2
pm2 save

# Configurer le démarrage automatique au boot
pm2 startup
# Suivre les instructions affichées
```

## Commandes PM2 Utiles

```bash
# Redémarrer l'application
npm run restart:pm2

# Arrêter l'application
npm run stop:pm2

# Voir les logs en temps réel
pm2 logs unlock-backend

# Voir les logs des 100 dernières lignes
pm2 logs unlock-backend --lines 100

# Monitoring
pm2 monit

# Redémarrer après un crash
pm2 resurrect

# Informations détaillées
pm2 describe unlock-backend

# Redémarrer avec zéro downtime (reload)
pm2 reload unlock-backend
```

## Sécurité - Checklist Production

- [ ] `JWT_SECRET` changé (min 32 caractères)
- [ ] `API_KEY` changé (min 32 caractères)
- [ ] `ADMIN_PASSWORD` changé
- [ ] `DB_SYNC=false` en production
- [ ] `DB_FORCE_SYNC=false` en production
- [ ] `DB_ALTER_SYNC=false` en production
- [ ] `ALLOWED_ORIGINS` configuré avec les domaines réels : `https://unlock-formation.fr,https://www.unlock-formation.fr`
- [ ] Base de données avec utilisateur dédié (pas root)
- [ ] Firewall configuré (UFW)
- [ ] SSL/TLS configuré (Nginx reverse proxy)
- [ ] Logs rotatifs configurés
- [ ] Backups automatiques de la BDD

## Configuration Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name api.unlock-technologies.fr;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.unlock-technologies.fr;

    ssl_certificate /etc/letsencrypt/live/api.unlock-technologies.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.unlock-technologies.fr/privkey.pem;

    # Proxy vers le backend Node.js
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Taille max upload
    client_max_body_size 10M;
}
```

## Monitoring et Logs

```bash
# Logs de l'application
tail -f logs/app.log

# Logs PM2
pm2 logs unlock-backend

# Logs d'erreur
tail -f logs/error.log

# Vérifier la santé de l'API
curl http://localhost:4000/health
```

## Mise à Jour

```bash
# Pull les dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install

# Rebuild
npm run build

# Redémarrer avec PM2 (zero downtime)
pm2 reload unlock-backend

# OU redémarrer complètement
pm2 restart unlock-backend
```

## Backup de la Base de Données

```bash
# Créer un script de backup automatique
sudo nano /usr/local/bin/unlock-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/unlock"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u unlock_user -p'VOTRE_MOT_DE_PASSE' unlock_production > $BACKUP_DIR/backup_$DATE.sql
# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/unlock-backup.sh

# Ajouter au crontab (backup quotidien à 2h du matin)
sudo crontab -e
# Ajouter: 0 2 * * * /usr/local/bin/unlock-backup.sh
```

## Troubleshooting

### L'application ne démarre pas
```bash
# Vérifier les logs
pm2 logs unlock-backend --err

# Vérifier les variables d'environnement
pm2 env 0
```

### Problème de connexion à la BDD
```bash
# Tester la connexion MySQL
mysql -u unlock_user -p unlock_production

# Vérifier que MySQL écoute
sudo netstat -tlnp | grep 3306
```

### Port déjà utilisé
```bash
# Vérifier quel processus utilise le port 4000
sudo lsof -i :4000

# Tuer le processus si nécessaire
sudo kill -9 <PID>
```

