# Documentation SEO - Unlock Formation

Cette documentation décrit tous les correctifs SEO implémentés pour améliorer le référencement du site https://unlock-formation.fr.

---

## 📁 Structure des Documents

- **[SEO_ACTION_PLAN.md](./SEO_ACTION_PLAN.md)**: Plan d'action complet pour les actions non-code (link building, réseaux sociaux, DMARC, HTTP/2)
- **[VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md)**: Checklist de validation avec tous les tests à effectuer

---

## ✅ Correctifs Implémentés

### 1. Title Tag (≤ 60 caractères)
- **Avant**: "École IA & Tech — Bootcamp, alternance, certifications" (63 chars)
- **Après**: "École IA & Tech — Bootcamp & Alternance" (55 chars)
- **Fichier**: `src/app/app.routes.ts`

### 2. H1 Dupliqués
- **Problème**: 2 H1 dans le Hero (mobile + desktop)
- **Solution**: Gestion dynamique de `aria-hidden` selon le viewport
- **Fichiers**: 
  - `src/app/components/hero/hero.component.html`
  - `src/app/components/hero/hero.component.ts`

### 3. Attributs ALT
- **Problème**: Plusieurs images sans attribut `alt`
- **Solution**: Ajout d'attributs `alt` descriptifs sur toutes les images
- **Fichiers modifiés**:
  - `src/app/components/home/programs-section/programs-section.component.html`
  - `src/app/layouts/header/header.component.html`
  - `src/app/layouts/footer/footer.component.html`

### 4. Sitemap.xml
- **Créé**: Script de génération automatique
- **Script**: `scripts/generate-sitemap.js`
- **Fichier généré**: `public/sitemap.xml`
- **Intégration**: Généré automatiquement lors du build production

### 5. JSON-LD Schema.org
- **Amélioré**: Passage de `Organization` à `EducationalOrganization`
- **Fichier**: `src/app/app.routes.ts`
- **TODO**: Enrichir avec `address`, `telephone`, `email`, `sameAs` si disponibles

### 6. Analytics avec Consentement RGPD
- **Service créé**: `src/app/shared/services/analytics/analytics.service.ts`
- **Support**: GA4, Facebook Pixel, Matomo
- **Consentement**: Désactivé par défaut, activé uniquement après consentement
- **Intégration**: Tracking automatique des pages dans `app.ts`

---

## 🚀 Utilisation

### Générer le Sitemap

```bash
# Génération manuelle
npm run generate:sitemap

# Génération automatique lors du build
npm run build:prod
```

### Configurer Analytics

1. **Obtenir les IDs**:
   - GA4 Measurement ID (format: `G-XXXXXXXXXX`)
   - Facebook Pixel ID (format: `1234567890123456`)
   - Matomo URL et Site ID (optionnel)

2. **Configurer dans `src/environments/environment.prod.ts`**:
   ```typescript
   ga4MeasurementId: 'G-XXXXXXXXXX',
   facebookPixelId: '1234567890123456',
   matomoUrl: 'https://matomo.example.com',
   matomoSiteId: '1',
   ```

3. **Le service s'active automatiquement** après consentement utilisateur

### Utiliser le Service Analytics

```typescript
import { AnalyticsService } from './shared/services/analytics/analytics.service';

// Dans votre composant
constructor(private analytics: AnalyticsService) {}

// Track un événement personnalisé
this.analytics.trackEvent('button_click', {
  button_name: 'contact_form',
  page: 'home'
});

// Track une page view (déjà fait automatiquement dans app.ts)
this.analytics.trackPageView('/trainings');
```

---

## 🧪 Tests

Voir [VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md) pour tous les tests à effectuer.

### Tests Rapides

```bash
# Vérifier le sitemap
curl https://www.unlock-formation.fr/sitemap.xml

# Vérifier HTTP/2
curl -I --http2 https://www.unlock-formation.fr

# Vérifier robots.txt
curl https://www.unlock-formation.fr/robots.txt
```

---

## 📊 Métriques à Suivre

### Core Web Vitals
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

### Performance
- Temps de chargement < 3s
- Score Lighthouse Performance > 90

### SEO
- Score Lighthouse SEO > 95
- Toutes les pages indexables ont un title unique
- 1 seul H1 par page
- Toutes les images ont un alt descriptif

---

## ⚠️ Actions Requises

### Configuration (Non-Code)
1. [ ] Configurer les IDs analytics dans `environment.prod.ts`
2. [ ] Valider HTTP/2 côté serveur
3. [ ] Configurer DMARC (voir `SEO_ACTION_PLAN.md`)
4. [ ] Créer les comptes sociaux (LinkedIn, X, YouTube)
5. [ ] Ajouter les liens sociaux dans le footer

### Enrichissement (Optionnel)
1. [ ] Enrichir le JSON-LD avec `address`, `telephone`, `email`
2. [ ] Ajouter les URLs des réseaux sociaux dans `sameAs`
3. [ ] Enrichir le script sitemap pour inclure les formations dynamiques

---

## 📝 Notes

- **Consentement RGPD**: Tous les scripts analytics sont désactivés par défaut
- **Sitemap**: Génère uniquement les routes statiques (enrichir pour les routes dynamiques)
- **Performance**: Les optimisations serveur (compression, cache) doivent être configurées côté infrastructure

---

**Dernière mise à jour**: 2026-01-02

