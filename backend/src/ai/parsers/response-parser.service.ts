import { FieldAssistantAction, FieldAssistantOutput } from '../ai-field-assistant.types';
import { logger } from '../../logger/logger';

/**
 * Service pour parser et valider les réponses de l'IA
 */
export class ResponseParserService {
  /**
   * Parser la réponse selon l'action
   */
  parseResponse(
    original: string,
    aiResponse: string,
    action: FieldAssistantAction
  ): FieldAssistantOutput {
    try {
      switch (action) {
        case 'correct':
          return this.parseCorrectResponse(original, aiResponse);
        
        case 'suggest':
          return this.parseSuggestResponse(original, aiResponse);
        
        case 'improve':
        case 'complete':
          return this.parseSimpleResponse(original, aiResponse);
        
        default:
          return this.parseSimpleResponse(original, aiResponse);
      }
    } catch (error: any) {
      logger.error('Error parsing AI response:', error);
      // Fallback : retourner l'original si le parsing échoue
      return {
        original,
        improved: original,
        explanation: 'Erreur lors du parsing de la réponse IA'
      };
    }
  }

  /**
   * Parser une réponse de correction
   */
  private parseCorrectResponse(original: string, aiResponse: string): FieldAssistantOutput {
    let cleaned = aiResponse.trim();
    
    if (cleaned.includes('AUCUNE_CORRECTION') || cleaned.toLowerCase().includes('aucune correction')) {
      return {
        original,
        improved: original,
        explanation: 'Aucune correction nécessaire. Le texte est correct.'
      };
    }

    if (cleaned.includes('| CORRECTIONS:')) {
      const [corrected, explanations] = cleaned.split('| CORRECTIONS:');
      let improvedText = corrected.trim();
      
      // Supprimer les guillemets
      improvedText = improvedText.replace(/^["'"«]|["'"»]$/g, '').trim();
      
      // Supprimer le contexte entre crochets
      improvedText = improvedText.replace(/["']?\s*\[[\s\S]*?\]\s*$/g, '').trim();
      
      // Supprimer à nouveau les guillemets
      improvedText = improvedText.replace(/^["'"«]|["'"»]$/g, '').trim();
      
      return {
        original,
        improved: this.sanitizeText(improvedText),
        explanation: explanations?.trim() || 'Corrections appliquées'
      };
    }

    // Supprimer les guillemets
    cleaned = cleaned.replace(/^["'"«]|["'"»]$/g, '').trim();
    
    // Supprimer le contexte entre crochets
    cleaned = cleaned.replace(/["']?\s*\[[\s\S]*?\]\s*$/g, '').trim();
    
    // Supprimer à nouveau les guillemets
    cleaned = cleaned.replace(/^["'"«]|["'"»]$/g, '').trim();

    return {
      original,
      improved: this.sanitizeText(cleaned),
      explanation: 'Corrections appliquées'
    };
  }

  /**
   * Parser une réponse de suggestions
   */
  private parseSuggestResponse(original: string, aiResponse: string): FieldAssistantOutput {
    const cleaned = aiResponse.trim();
    
    // Méthode 1 : Format numéroté "1. ... 2. ... 3. ..."
    const numberedMatches = cleaned.match(/^\d+\.\s*(.+)$/gm);
    if (numberedMatches && numberedMatches.length >= 2) {
      const suggestions = numberedMatches
        .map(match => match.replace(/^\d+\.\s*/, '').trim())
        .filter(s => s.length > 0)
        .slice(0, 3);
      
      if (suggestions.length > 0) {
        return {
          original,
          improved: suggestions[0],
          suggestions,
          explanation: `${suggestions.length} suggestions générées`
        };
      }
    }

    // Méthode 2 : Format avec tirets ou puces
    const bulletMatches = cleaned.match(/^[-•*]\s*(.+)$/gm);
    if (bulletMatches && bulletMatches.length >= 2) {
      const suggestions = bulletMatches
        .map(match => match.replace(/^[-•*]\s*/, '').trim())
        .filter(s => s.length > 0)
        .slice(0, 3);
      
      if (suggestions.length > 0) {
        return {
          original,
          improved: suggestions[0],
          suggestions,
          explanation: `${suggestions.length} suggestions générées`
        };
      }
    }

    // Méthode 3 : Lignes séparées
    const lines = cleaned.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^(suggestion|alternative|option)/i));
    
    if (lines.length >= 2) {
      const suggestions = lines.slice(0, 3);
      return {
        original,
        improved: suggestions[0],
        suggestions,
        explanation: `${suggestions.length} suggestions générées`
      };
    }

    // Fallback : traiter comme une seule amélioration
    return {
      original,
      improved: this.sanitizeText(cleaned),
      explanation: 'Une suggestion générée'
    };
  }

  /**
   * Parser une réponse simple (améliorer/compléter)
   */
  private parseSimpleResponse(original: string, aiResponse: string): FieldAssistantOutput {
    let cleaned = aiResponse.trim();
    
    // Supprimer AGRESSIVEMENT tous les préfixes possibles (plusieurs passes)
    for (let i = 0; i < 3; i++) {
      cleaned = cleaned
        // Préfixes avec "CHAMP"
        .replace(/^CHAMP\s*[:\-–—]\s*/gi, '')
        .replace(/^CHAMP\s+:/gi, '')
        // Préfixes avec "CONTENU"
        .replace(/^CONTENU\s+(AMÉLIORÉ|AMELIORE|ACTUEL|CORRIGÉ|CORRIGE)\s*[:\-–—]\s*/gi, '')
        .replace(/^CONTENU\s*[:\-–—]\s*/gi, '')
        // Autres préfixes
        .replace(/^RÉSULTAT\s*[:\-–—]\s*/gi, '')
        .replace(/^RESULTAT\s*[:\-–—]\s*/gi, '')
        .replace(/^TEXTE\s*[:\-–—]\s*/gi, '')
        .replace(/^AMÉLIORATION\s*[:\-–—]\s*/gi, '')
        .replace(/^SUGGESTION\s*[:\-–—]\s*/gi, '')
        // Ligne complète type "CHAMP : Sujet du module"
        .replace(/^CHAMP\s*[:\-–—]\s*.+?\n/gi, '')
        // Double ligne type "CHAMP : xyz\nCONTENU : abc"
        .replace(/^CHAMP\s*[:\-–—]\s*.+?\nCONTENU\s*[:\-–—]\s*/gi, '')
        .trim();
    }
    
    // Supprimer les guillemets entourants
    cleaned = cleaned.replace(/^["'"«]|["'"»]$/g, '').trim();
    
    // Supprimer le contexte entre crochets (s'il est à la fin ou seul sur une ligne)
    // Ex: "texte" [contexte - information - etc]
    cleaned = cleaned.replace(/["']?\s*\[[\s\S]*?\]\s*$/g, '').trim();
    
    // Si après nettoyage il reste des préfixes, tout supprimer jusqu'au dernier ":"
    if (/^[A-ZÉÈÊËÀ\s]+\s*[:]\s*/i.test(cleaned)) {
      const lastColonIndex = cleaned.indexOf(':');
      if (lastColonIndex !== -1 && lastColonIndex < 100) {
        // Seulement si le ":" est dans les 100 premiers caractères (probablement un préfixe)
        cleaned = cleaned.substring(lastColonIndex + 1).trim();
      }
    }
    
    // Supprimer à nouveau les guillemets qui auraient pu rester après suppression du contexte
    cleaned = cleaned.replace(/^["'"«]|["'"»]$/g, '').trim();
    
    cleaned = this.sanitizeText(cleaned);
    
    return {
      original,
      improved: cleaned || original,
      explanation: cleaned && cleaned !== original ? 'Contenu amélioré' : 'Aucune modification'
    };
  }

  /**
   * Nettoyer le texte (supprimer markdown, HTML, etc.)
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
      .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^\*]+)\*/g, '$1') // Remove italic
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .trim();
  }

  /**
   * Valider la qualité de la réponse
   */
  validateResponseQuality(result: FieldAssistantOutput, original: string): boolean {
    // Vérifier que le résultat amélioré n'est pas vide
    if (!result.improved || result.improved.trim().length === 0) {
      return false;
    }

    // Pour les suggestions, vérifier qu'il y en a au moins 2
    if (result.suggestions && result.suggestions.length < 2) {
      return false;
    }

    // Vérifier que le résultat n'est pas identique à l'original (sauf pour "correct" si aucune correction)
    if (result.improved === original && result.explanation !== 'Aucune correction nécessaire. Le texte est correct.') {
      return false;
    }

    return true;
  }
}

export default new ResponseParserService();

