#!/bin/bash

# Script de configuration pour MAMP sur Mac
# Crée le fichier .env avec les paramètres MAMP

cat > .env << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=4000

# Database Configuration (MAMP sur Mac)
DB_HOST=localhost
DB_PORT=8889
DB_NAME=webunlock
DB_USER=root
DB_PASSWORD=root
DB_DIALECT=mysql

# Sequelize Configuration
DB_SYNC=true
DB_FORCE_SYNC=false
DB_ALTER_SYNC=false

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
JWT_SECRET=unlock-secret-key-change-in-production-2024
API_KEY=unlock-api-key-change-in-production-2024

# Admin (change in production!)
ADMIN_EMAIL=admin@unlock.fr
ADMIN_PASSWORD=Admin123!@#

# CORS
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:4000
EOF

echo "✅ Fichier .env créé avec la configuration MAMP"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Créez la base de données 'webunlock' dans phpMyAdmin (http://localhost:8888/phpMyAdmin)"
echo "2. Ou exécutez : /Applications/MAMP/Library/bin/mysql -uroot -proot -P8889 -e \"CREATE DATABASE webunlock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
echo "3. Lancez : npm run dev"
echo "4. Initialisez les données : npm run db:seed"


