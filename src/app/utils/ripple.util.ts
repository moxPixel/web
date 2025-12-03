/**
 * Utilitaires pour les couleurs de ripple Material Design
 * Centralise les couleurs pour éviter la duplication
 */

export const RIPPLE_COLORS = {
  /** Ripple clair pour fond clair */
  light: 'rgba(0, 0, 0, 0.1)',
  /** Ripple sombre pour fond sombre */
  dark: 'rgba(255, 255, 255, 0.3)',
  /** Ripple avec couleur primaire */
  primary: 'rgba(134, 79, 254, 0.2)',
} as const;

/**
 * Obtient la couleur de ripple appropriée selon le thème
 * @param isDarkMode - Si le mode sombre est activé
 * @returns La couleur de ripple appropriée
 */
export function getRippleColor(isDarkMode: boolean = false): string {
  return isDarkMode ? RIPPLE_COLORS.dark : RIPPLE_COLORS.light;
}

/**
 * Obtient la couleur de ripple selon le contexte (vérifie automatiquement le dark mode)
 * @returns La couleur de ripple appropriée
 */
export function getRippleColorAuto(): string {
  if (typeof window === 'undefined') {
    return RIPPLE_COLORS.light;
  }

  const isDark = document.documentElement.classList.contains('dark');
  return getRippleColor(isDark);
}

