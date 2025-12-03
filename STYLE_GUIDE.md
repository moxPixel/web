# 🎨 Guide de Style - Classes CSS Réutilisables

Ce document liste toutes les classes CSS réutilisables disponibles dans le projet.

---

## 📦 Classes Globales (`styles.css` - `@layer components`)

### 🎯 Boutons (`.btn`)

#### Base
```html
<button class="btn">Bouton</button>
```

#### Tailles
- `.btn-sm` - Petit (px-4 h-10 text-sm)
- `.btn-md` - Moyen (px-6 py-3 text-base) - **Par défaut**
- `.btn-lg` - Grand (px-8 h-12 text-base)

#### Variantes
- `.btn-primary` - Bouton primaire (violet)
- `.btn-secondary` - Bouton secondaire (noir/blanc)
- `.btn-outline` - Bouton avec bordure
- `.btn-secondary-border` - Bouton secondaire avec bordure (pour hero)

#### Exemples
```html
<!-- Bouton primaire large -->
<button class="btn btn-lg btn-primary">Cliquer</button>

<!-- Bouton secondaire avec bordure -->
<a routerLink="/contact" class="btn btn-lg btn-secondary-border">
  Contact
</a>

<!-- Bouton outline -->
<button class="btn btn-md btn-outline">Annuler</button>
```

#### Dark Mode
Toutes les variantes supportent automatiquement le dark mode via la classe `.dark` sur `html`.

---

### 🏷️ Badges (`.badge`)

#### Base
```html
<span class="badge">Badge</span>
```

#### Variantes de couleur
- `.badge-green` - Badge vert (par défaut)
- `.badge-yellow` - Badge jaune
- `.badge-cyan` - Badge cyan

#### Exemples
```html
<!-- Badge vert -->
<span class="badge badge-green mb-5 inline-block">Formation</span>

<!-- Badge jaune -->
<span class="badge badge-yellow">Nouveau</span>
```

#### Dark Mode
Les badges changent automatiquement de couleur en dark mode.

---

### 🪟 Glassmorphism Cards (`.glassmorphism-content-card`)

#### Base
```html
<div class="glassmorphism-content-card">
  Contenu avec effet glassmorphism
</div>
```

#### Variantes de blur
- `.glassmorphism-blur-sm` - Blur léger (8px)
- `.glassmorphism-blur-md` - Blur moyen (20px)
- `.glassmorphism-blur-lg` - Blur fort (25px) - **Par défaut**

#### Exemples
```html
<!-- Card glassmorphism standard -->
<div class="glassmorphism-content-card">
  <h2>Titre</h2>
  <p>Contenu...</p>
</div>

<!-- Card avec blur personnalisé -->
<div class="glassmorphism-content-card glassmorphism-blur-sm">
  Contenu léger
</div>
```

---

## 🛠️ Utilitaires TypeScript

### GSAP Helpers (`src/app/utils/gsap-helpers.ts`)

#### Animer des boutons
```typescript
import { GsapHelpers } from '../../utils/gsap-helpers';

const buttons = document.querySelectorAll('.btn');
GsapHelpers.animateButtons(buttons, {
  delay: 1.0,
  stagger: 0.15,
  duration: 1.1
});
```

#### Animer un seul bouton
```typescript
GsapHelpers.animateButton(buttonElement, 0.5);
```

#### Animation de pulse
```typescript
GsapHelpers.animatePulse(element, {
  scale: 1.1,
  duration: 1.5,
  repeat: -1 // infini
});
```

#### Fade-in simple
```typescript
GsapHelpers.fadeIn(element, {
  delay: 0.3,
  duration: 0.6,
  y: 20
});
```

---

### Ripple Utils (`src/app/utils/ripple.util.ts`)

#### Obtenir la couleur de ripple
```typescript
import { getRippleColor, getRippleColorAuto, RIPPLE_COLORS } from '../../utils/ripple.util';

// Avec détection automatique
const color = getRippleColorAuto();

// Manuel
const color = getRippleColor(true); // dark mode

// Constantes disponibles
RIPPLE_COLORS.light  // 'rgba(0, 0, 0, 0.1)'
RIPPLE_COLORS.dark   // 'rgba(255, 255, 255, 0.3)'
RIPPLE_COLORS.primary // 'rgba(134, 79, 254, 0.2)'
```

#### Utilisation dans les templates
```html
<a 
  matRipple 
  [matRippleColor]="getRippleColorAuto()"
  class="btn btn-primary"
>
  Bouton
</a>
```

---

## 🧩 Composants Réutilisables

### ButtonComponent (`src/app/components/ui/button/button.component.ts`)

```html
<!-- Bouton simple -->
<app-button variant="primary" size="lg">
  Cliquer
</app-button>

<!-- Bouton avec routerLink -->
<app-button 
  variant="secondary" 
  size="md"
  routerLink="/contact"
  [fullWidth]="true"
>
  Contact
</app-button>

<!-- Bouton avec événement -->
<app-button 
  variant="outline"
  (onClick)="handleClick($event)"
>
  Action
</app-button>
```

#### Props disponibles
- `variant`: `'primary' | 'secondary' | 'outline' | 'secondary-border'`
- `size`: `'sm' | 'md' | 'lg'`
- `routerLink`: `string` (optionnel) - Transforme en lien
- `type`: `'button' | 'submit' | 'reset'`
- `ripple`: `boolean` - Active/désactive le ripple
- `disabled`: `boolean`
- `fullWidth`: `boolean`
- `ariaLabel`: `string`

---

### BadgeComponent (`src/app/components/ui/badge/badge.component.ts`)

```html
<!-- Badge simple -->
<app-badge variant="green">Formation</app-badge>

<!-- Badge avec classes supplémentaires -->
<app-badge variant="yellow" class="mb-5 inline-block">
  Nouveau
</app-badge>
```

#### Props disponibles
- `variant`: `'green' | 'yellow' | 'cyan'`
- `class`: `string` - Classes CSS supplémentaires

---

## 📝 Bonnes Pratiques

### ✅ À FAIRE
- Utiliser les classes globales `.btn`, `.badge` depuis `styles.css`
- Utiliser les composants `ButtonComponent` et `BadgeComponent` pour les nouveaux développements
- Utiliser `GsapHelpers` pour les animations GSAP communes
- Utiliser `getRippleColorAuto()` pour les ripples Material

### ❌ À ÉVITER
- Redéfinir les classes `.btn*` ou `.badge*` dans les composants
- Dupliquer le code GSAP d'animation de boutons
- Hardcoder les couleurs de ripple dans les templates
- Créer de nouvelles classes CSS pour des patterns déjà existants

---

## 🔄 Migration

Pour migrer un composant existant :

1. **Boutons** : Remplacer les classes inline par `ButtonComponent` ou utiliser les classes globales
2. **Badges** : Remplacer `<span class="badge">` par `<app-badge>`
3. **Animations GSAP** : Utiliser `GsapHelpers.animateButtons()` au lieu du code inline
4. **Ripples** : Utiliser `getRippleColorAuto()` au lieu de valeurs hardcodées

---

**Dernière mise à jour** : Après refactorisation complète

