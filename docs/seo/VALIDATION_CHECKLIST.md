# Checklist de Validation SEO - Unlock Formation

**Date**: 2026-01-02  
**Objectif**: Valider tous les correctifs SEO implémentés

---

## ✅ Correctifs Code Implémentés

### 1. Title Tag
- [x] **Corrigé**: Title réduit de 63 à 55 caractères
  - Avant: "École IA & Tech — Bootcamp, alternance, certifications" (63 chars)
  - Après: "École IA & Tech — Bootcamp & Alternance" (55 chars)
  - **Fichier**: `src/app/app.routes.ts` ligne 56

### 2. H1 Dupliqués
- [x] **Corrigé**: Gestion dynamique de aria-hidden sur les H1 mobile/desktop
  - Un seul H1 visible à la fois selon le viewport
  - aria-hidden géré dynamiquement pour éviter les H1 dupliqués pour les bots
  - **Fichiers**: 
    - `src/app/components/hero/hero.component.html` (lignes 34-46)
    - `src/app/components/hero/hero.component.ts` (méthode `setH1AriaHidden()`)

### 3. Attributs ALT
- [x] **Corrigé**: Ajout d'attributs ALT descriptifs sur toutes les images
  - `src/app/components/home/programs-section/programs-section.component.html` (ligne 121)
  - `src/app/layouts/header/header.component.html` (lignes 5, 69)
  - `src/app/layouts/footer/footer.component.html` (ligne 11)
  - Toutes les images ont maintenant un alt descriptif

### 4. Sitemap.xml
- [x] **Créé**: Script de génération automatique
  - Script: `scripts/generate-sitemap.js`
  - Fichier généré: `public/sitemap.xml`
  - Intégré au build: `npm run build:prod` génère automatiquement le sitemap
  - **12 URLs** incluses dans le sitemap

### 5. Robots.txt
- [x] **Vérifié**: robots.txt existe et référence le sitemap
  - Fichier: `public/robots.txt`
  - Ligne 11: `Sitemap: https://www.unlock-formation.fr/sitemap.xml`

### 6. JSON-LD Schema.org
- [x] **Amélioré**: Passage de Organization à EducationalOrganization
  - Type: `EducationalOrganization` (plus approprié pour une école)
  - Champs: name, url, logo, description
  - TODO: Ajouter address, telephone, email, sameAs si disponibles
  - **Fichier**: `src/app/app.routes.ts` lignes 61-67

### 7. Analytics avec Consentement RGPD
- [x] **Créé**: Service Analytics complet avec consentement
  - Service: `src/app/shared/services/analytics/analytics.service.ts`
  - Support: GA4, Facebook Pixel, Matomo
  - Consentement: Désactivé par défaut, activé uniquement après consentement
  - Intégré dans `app.ts` pour tracking automatique des pages
  - **TODO**: Configurer les IDs dans `environment.prod.ts`

### 8. OpenGraph et Twitter Cards
- [x] **Vérifié**: Déjà implémentés dans `SeoService`
  - OpenGraph: Titre, description, image, type, URL
  - Twitter Cards: summary_large_image avec titre, description, image
  - Gérés dynamiquement par route dans `app.routes.ts`

---

## 🔍 Tests de Validation

### Test 1: Vérifier le Title
```bash
# Vérifier que le title est ≤ 60 caractères
curl -s https://www.unlock-formation.fr | grep -o '<title>.*</title>'
# Attendu: <title>École IA & Tech — Bootcamp & Alternance • Unlock</title>
```

### Test 2: Vérifier les H1
```bash
# Compter les H1 sur la page d'accueil
curl -s https://www.unlock-formation.fr | grep -o '<h1' | wc -l
# Attendu: 1 (ou 2 avec aria-hidden="true" sur l'un d'eux)
```

### Test 3: Vérifier le Sitemap
```bash
# Vérifier que le sitemap est accessible
curl -I https://www.unlock-formation.fr/sitemap.xml
# Attendu: HTTP/2 200

# Vérifier le contenu
curl -s https://www.unlock-formation.fr/sitemap.xml | head -20
```

### Test 4: Vérifier Robots.txt
```bash
# Vérifier que robots.txt référence le sitemap
curl -s https://www.unlock-formation.fr/robots.txt | grep -i sitemap
# Attendu: Sitemap: https://www.unlock-formation.fr/sitemap.xml
```

### Test 5: Vérifier les Attributs ALT
```bash
# Compter les images sans alt
curl -s https://www.unlock-formation.fr | grep -o '<img[^>]*>' | grep -v 'alt=' | wc -l
# Attendu: 0 (toutes les images doivent avoir un alt)
```

### Test 6: Vérifier JSON-LD
```bash
# Extraire le JSON-LD
curl -s https://www.unlock-formation.fr | grep -o '<script id="ui-jsonld"[^>]*>.*</script>'
# Valider avec: https://search.google.com/test/rich-results
```

### Test 7: Vérifier HTTP/2
```bash
# Vérifier que HTTP/2 est activé
curl -I --http2 https://www.unlock-formation.fr 2>&1 | head -1
# Attendu: HTTP/2 200
```

### Test 8: Vérifier les Headers de Compression
```bash
# Vérifier gzip/brotli
curl -H "Accept-Encoding: gzip, br" -I https://www.unlock-formation.fr | grep -i "content-encoding"
# Attendu: content-encoding: gzip ou br
```

### Test 9: Lighthouse Audit
1. Ouvrir Chrome DevTools (F12)
2. Onglet **Lighthouse**
3. Sélectionner: **Performance**, **SEO**, **Accessibility**
4. Cliquer sur **Generate report**
5. **Objectifs**:
   - Performance: > 90
   - SEO: > 95
   - Accessibility: > 90

### Test 10: Rich Results Test
1. Aller sur https://search.google.com/test/rich-results
2. Entrer: `https://www.unlock-formation.fr`
3. Vérifier que le JSON-LD EducationalOrganization est détecté
4. Vérifier qu'aucune erreur n'est présente

---

## 📊 Métriques à Suivre

### Core Web Vitals
- [ ] **LCP** (Largest Contentful Paint): < 2.5s
- [ ] **FID** (First Input Delay): < 100ms
- [ ] **CLS** (Cumulative Layout Shift): < 0.1

### Performance
- [ ] Temps de chargement: < 3s
- [ ] Taille totale de la page: < 2MB
- [ ] Score Lighthouse Performance: > 90

### SEO
- [ ] Score Lighthouse SEO: > 95
- [ ] Toutes les pages indexables ont un title unique
- [ ] Toutes les pages indexables ont une meta description
- [ ] 1 seul H1 par page
- [ ] Toutes les images ont un alt descriptif

### Analytics
- [ ] GA4 configuré et fonctionnel (après consentement)
- [ ] Facebook Pixel configuré et fonctionnel (après consentement)
- [ ] Tracking des pages fonctionne correctement

---

## 🚀 Commandes de Build et Déploiement

### Build Production
```bash
# Build avec génération automatique du sitemap
npm run build:prod

# Vérifier que le sitemap a été généré
ls -lh public/sitemap.xml
```

### Validation Locale
```bash
# Démarrer le serveur de développement
npm start

# Dans un autre terminal, tester le sitemap
curl http://localhost:4200/sitemap.xml
```

### Déploiement
1. Build: `npm run build:prod`
2. Vérifier que `public/sitemap.xml` existe
3. Déployer le dossier `dist/unlock-web/browser/`
4. Vérifier que le sitemap est accessible: `https://www.unlock-formation.fr/sitemap.xml`

---

## ⚠️ Actions Requises (Non-Code)

### Configuration Analytics
1. [ ] Obtenir le **GA4 Measurement ID** (format: `G-XXXXXXXXXX`)
2. [ ] Obtenir le **Facebook Pixel ID** (format: `1234567890123456`)
3. [ ] Configurer dans `src/environments/environment.prod.ts`:
   ```typescript
   ga4MeasurementId: 'G-XXXXXXXXXX',
   facebookPixelId: '1234567890123456',
   ```

### Configuration DNS (DMARC)
1. [ ] Vérifier que SPF est configuré
2. [ ] Vérifier que DKIM est configuré
3. [ ] Ajouter l'enregistrement DMARC (voir `SEO_ACTION_PLAN.md`)

### Configuration Serveur (HTTP/2)
1. [ ] Vérifier que HTTP/2 est activé sur le serveur
2. [ ] Configurer les headers de compression (gzip/brotli)
3. [ ] Configurer les cache headers pour les assets statiques

### Réseaux Sociaux
1. [ ] Créer le compte **LinkedIn** (page entreprise)
2. [ ] Créer le compte **X (Twitter)**
3. [ ] Créer la chaîne **YouTube**
4. [ ] Ajouter les liens dans le footer (voir `SEO_ACTION_PLAN.md`)

---

## 📝 Notes Finales

1. **Consentement RGPD**: Tous les scripts analytics sont désactivés par défaut. Ils ne s'activent qu'après consentement utilisateur via le composant `CookieConsentComponent`.

2. **Sitemap Dynamique**: Le script génère uniquement les routes statiques. Pour inclure les formations dynamiques (`/trainings/:slug`), enrichir `scripts/generate-sitemap.js` pour interroger l'API.

3. **JSON-LD**: Le schéma EducationalOrganization est basique. Enrichir avec `address`, `telephone`, `email`, `sameAs` si ces informations sont disponibles sur le site.

4. **Performance**: Les optimisations de performance (compression, cache headers) doivent être configurées côté serveur (Nginx/Apache/Vercel).

---

## ✅ Checklist Finale

- [x] Title ≤ 60 caractères
- [x] 1 seul H1 par page (avec aria-hidden)
- [x] Attributs ALT sur toutes les images
- [x] Sitemap.xml généré automatiquement
- [x] Robots.txt référence le sitemap
- [x] JSON-LD EducationalOrganization implémenté
- [x] Analytics avec consentement RGPD
- [x] OpenGraph et Twitter Cards configurés
- [ ] GA4 ID configuré (action requise)
- [ ] Facebook Pixel ID configuré (action requise)
- [ ] HTTP/2 validé côté serveur (action requise)
- [ ] DMARC configuré (action requise)
- [ ] Comptes sociaux créés (action requise)

---

**Dernière mise à jour**: 2026-01-02  
**Prochaine revue**: Après déploiement en production

