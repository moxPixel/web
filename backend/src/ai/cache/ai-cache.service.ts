import { logger } from '../../logger/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

/**
 * Service de cache pour les réponses IA
 * TODO: Migrer vers Redis pour la production
 */
export class AiCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SIZE = 1000; // Maximum 1000 entrées
  private readonly MAX_HITS = 10; // Maximum 10 hits avant expiration

  /**
   * Générer une clé de cache
   */
  generateKey(fieldName: string, fieldValue: string, action: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : '';
    const key = `${fieldName}:${fieldValue}:${action}:${contextStr}`;
    // Hash simple pour éviter les clés trop longues
    return this.hashString(key);
  }

  /**
   * Obtenir une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si le cache est expiré
    const age = Date.now() - entry.timestamp;
    if (age > this.DEFAULT_TTL) {
      this.cache.delete(key);
      logger.debug(`Cache expired for key: ${key.substring(0, 20)}...`);
      return null;
    }

    // Vérifier si le nombre de hits est dépassé
    if (entry.hits >= this.MAX_HITS) {
      this.cache.delete(key);
      logger.debug(`Cache max hits reached for key: ${key.substring(0, 20)}...`);
      return null;
    }

    // Incrémenter les hits
    entry.hits++;
    logger.debug(`Cache hit for key: ${key.substring(0, 20)}... (hits: ${entry.hits})`);
    
    return entry.data as T;
  }

  /**
   * Mettre une valeur en cache
   */
  set<T>(key: string, data: T, _ttl?: number): void {
    // Nettoyer le cache si nécessaire
    this.cleanupIfNeeded();

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });

    logger.debug(`Cache set for key: ${key.substring(0, 20)}...`);
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vider le cache
   */
  clear(): void {
    this.cache.clear();
    logger.info('AI cache cleared');
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      hitRate: entries.reduce((sum, e) => sum + e.hits, 0) / Math.max(entries.length, 1),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Nettoyer le cache si nécessaire
   */
  private cleanupIfNeeded(): void {
    if (this.cache.size < this.MAX_SIZE) {
      return;
    }

    // Supprimer les entrées les plus anciennes (FIFO)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = entries.slice(0, Math.floor(this.MAX_SIZE * 0.1)); // Supprimer 10% des plus anciennes
    toDelete.forEach(([key]) => this.cache.delete(key));
    
    logger.debug(`Cache cleanup: removed ${toDelete.length} entries`);
  }

  /**
   * Hash simple pour les clés
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `ai_${Math.abs(hash).toString(36)}`;
  }
}

export default new AiCacheService();

