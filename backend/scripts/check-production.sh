#!/bin/bash

# Script de vérification de sécurité avant déploiement en production
# Usage: ./scripts/check-production.sh

set -e

echo "🔍 Vérification de la configuration production..."

ERRORS=0

# Vérifier que NODE_ENV est production
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  NODE_ENV n'est pas défini sur 'production'"
    echo "   Définir: export NODE_ENV=production"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant"
    echo "   Copier: cp .env.production.example .env"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Fichier .env trouvé"
fi

# Vérifier les secrets dans .env
if grep -q "change-me-in-production" .env 2>/dev/null; then
    echo "❌ Des secrets par défaut sont encore présents dans .env"
    echo "   Vérifier: JWT_SECRET, API_KEY"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Secrets personnalisés détectés"
fi

# Vérifier que DB_SYNC est false
if grep -q "DB_SYNC=true" .env 2>/dev/null; then
    echo "❌ DB_SYNC=true est DANGEREUX en production!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ DB_SYNC désactivé"
fi

# Vérifier que DB_FORCE_SYNC est false
if grep -q "DB_FORCE_SYNC=true" .env 2>/dev/null; then
    echo "❌ DB_FORCE_SYNC=true est DANGEREUX en production!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ DB_FORCE_SYNC désactivé"
fi

# Vérifier que le build existe
if [ ! -d "dist" ]; then
    echo "⚠️  Dossier dist/ manquant"
    echo "   Exécuter: npm run build"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Build trouvé"
fi

# Vérifier que PM2 est installé
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 n'est pas installé"
    echo "   Installer: npm install -g pm2"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ PM2 installé"
fi

# Résumé
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ Toutes les vérifications sont passées!"
    echo "   Vous pouvez démarrer avec: npm run start:pm2"
    exit 0
else
    echo "❌ $ERRORS erreur(s) trouvée(s)"
    echo "   Corriger les erreurs avant de déployer"
    exit 1
fi

