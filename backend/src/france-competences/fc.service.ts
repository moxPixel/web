import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../logger/logger';
import { RncpCertification } from './fc.types';

/**
 * Service robuste pour récupérer les données RNCP depuis France Compétences
 * 
 * Utilise plusieurs méthodes en fallback pour garantir la robustesse :
 * 1. Scraping HTML avec cheerio (méthode principale)
 * 2. Retry automatique en cas d'échec
 * 3. Cache simple en mémoire pour éviter les appels répétés
 * 
 * Documentation: https://www.francecompetences.fr/recherche/rncp/
 */
class FranceCompetencesService {
  private apiClient: AxiosInstance;
  private readonly baseUrl = 'https://www.francecompetences.fr';
  private readonly cache: Map<string, { data: RncpCertification; timestamp: number }> = new Map();
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 heures

  constructor() {
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      maxRedirects: 5,
    });
  }

  /**
   * Rechercher une certification RNCP par code avec retry et cache
   */
  async findByCode(rncpCode: string): Promise<RncpCertification | null> {
    try {
      logger.info(`Searching RNCP certification: ${rncpCode}`);
      
      // Nettoyer le code
      const code = rncpCode.replace(/^RNCP/i, '').trim();
      const cacheKey = `rncp-${code}`;

      // Vérifier le cache
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        logger.debug(`Using cached RNCP data for: ${rncpCode}`);
        return cached.data;
      }

      // Récupérer avec retry
      const certification = await this.fetchWithRetry(code, 3);
      
      if (!certification) {
        logger.warn(`No data found for RNCP code: ${rncpCode}`);
        return null;
      }

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: certification,
        timestamp: Date.now(),
      });

      logger.info(`✅ RNCP data retrieved: ${certification.title}`);
      return certification;
    } catch (error: any) {
      logger.error(`Error fetching RNCP data for ${rncpCode}:`, error.message);
      return null;
    }
  }

  /**
   * Récupérer avec retry automatique
   */
  private async fetchWithRetry(code: string, maxRetries: number): Promise<RncpCertification | null> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const certification = await this.fetchFromWebsite(code);
        if (certification) {
          return certification;
        }
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // Délai progressif : 1s, 2s, 3s
          logger.debug(`Retry ${attempt}/${maxRetries} for RNCP ${code} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    if (lastError) {
      logger.error(`Failed to fetch RNCP ${code} after ${maxRetries} attempts:`, lastError.message);
    }
    return null;
  }

  /**
   * Récupérer depuis le site web avec parsing HTML robuste (cheerio)
   */
  private async fetchFromWebsite(code: string): Promise<RncpCertification | null> {
    try {
      const url = `/recherche/rncp/${code}/`;
      
      const response = await this.apiClient.get(url, {
        responseType: 'text',
        validateStatus: (status) => status < 500, // Accepter 404 mais pas les erreurs serveur
      });

      if (response.status === 404) {
        logger.info(`RNCP code not found: ${code}`);
        return null;
      }

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = response.data as string;
      const $ = cheerio.load(html);

      // Extraire le titre - plusieurs sélecteurs possibles
      let title = $('h1').first().text().trim() ||
                  $('.entry-title').first().text().trim() ||
                  $('title').text().replace(/ - France compétences.*$/i, '').trim() ||
                  $('[itemprop="name"]').first().text().trim();

      if (!title || title.length < 5) {
        // Essayer de trouver dans les métadonnées JSON-LD
        const jsonLd = $('script[type="application/ld+json"]').first().html();
        if (jsonLd) {
          try {
            const data = JSON.parse(jsonLd);
            if (data['@graph']) {
              const webpage = data['@graph'].find((item: any) => item['@type'] === 'WebPage');
              if (webpage?.name) {
                title = webpage.name;
              }
            }
          } catch (e) {
            // Ignorer les erreurs de parsing JSON
          }
        }
      }

      if (!title || title.length < 5) {
        logger.debug(`Could not extract valid title from RNCP ${code} page`);
        return null;
      }

      // Extraire le niveau - chercher dans plusieurs endroits
      let level: string | undefined;
      const levelText = $('.niveau, .level, [data-niveau]').first().text() ||
                        $('*:contains("Niveau")').first().text();
      
      if (levelText) {
        const levelMatch = levelText.match(/niveau\s*(\d+)/i);
        if (levelMatch) {
          level = `Niveau ${levelMatch[1]}`;
        }
      }

      // Extraire la durée - chercher dans plusieurs formats
      let durationHours: number | undefined;
      const durationText = $('.duree, .duration, [data-duree]').first().text() ||
                           $('*:contains("heures")').first().text() ||
                           $('*:contains("h")').first().text();
      
      if (durationText) {
        const hoursMatch = durationText.match(/(\d+)\s*(?:heures?|h)/i);
        if (hoursMatch) {
          durationHours = parseInt(hoursMatch[1], 10);
        } else {
          // Essayer de convertir depuis jours ou mois
          const daysMatch = durationText.match(/(\d+)\s*jours?/i);
          if (daysMatch) {
            durationHours = parseInt(daysMatch[1], 10) * 7; // 1 jour ≈ 7h
          } else {
            const monthsMatch = durationText.match(/(\d+)\s*mois/i);
            if (monthsMatch) {
              durationHours = parseInt(monthsMatch[1], 10) * 35; // 1 mois ≈ 35h
            }
          }
        }
      }

      // Extraire les compétences si disponibles
      const competencies: string[] = [];
      $('.competences, .competencies, [data-competences]').each((_, el) => {
        const text = $(el).text().trim();
        if (text) {
          // Séparer par virgule, point-virgule ou saut de ligne
          const items = text.split(/[,;]\s*|\n/).map(s => s.trim()).filter(s => s.length > 3);
          competencies.push(...items);
        }
      });

      // Extraire les activités si disponibles
      const activities: string[] = [];
      $('.activites, .activities, [data-activites]').each((_, el) => {
        const text = $(el).text().trim();
        if (text) {
          const items = text.split(/[,;]\s*|\n/).map(s => s.trim()).filter(s => s.length > 3);
          activities.push(...items);
        }
      });

      return {
        code: `RNCP${code}`,
        title: title,
        level,
        durationHours,
        competencies: competencies.length > 0 ? competencies : undefined,
        activities: activities.length > 0 ? activities : undefined,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info(`RNCP code not found: ${code}`);
        return null;
      }
      throw error; // Re-throw pour le retry
    }
  }

  /**
   * Rechercher une certification RNCP par titre
   * Note: Nécessite de scraper la page de recherche, complexe à implémenter
   */
  async findByTitle(rncpTitle: string): Promise<RncpCertification | null> {
    logger.debug(`Title search not yet implemented. Use RNCP code instead.`);
    return null;
  }

  /**
   * Helper pour sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Vider le cache (utile pour les tests ou refresh manuel)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('RNCP cache cleared');
  }
}

export default new FranceCompetencesService();
