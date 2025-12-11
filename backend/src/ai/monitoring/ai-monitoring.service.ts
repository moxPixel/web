import { logger } from '../../logger/logger';

interface AiRequestMetrics {
  fieldName: string;
  action: string;
  tokensUsed: number;
  latency: number;
  success: boolean;
  timestamp: number;
}

/**
 * Service de monitoring pour l'IA
 */
export class AiMonitoringService {
  private metrics: AiRequestMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Garder les 1000 dernières métriques

  /**
   * Enregistrer une métrique
   */
  recordMetric(metric: Omit<AiRequestMetrics, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    });

    // Limiter la taille du tableau
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Logger les erreurs
    if (!metric.success) {
      logger.warn(`AI request failed: ${metric.fieldName}/${metric.action} - ${metric.latency}ms`);
    }
  }

  /**
   * Obtenir les statistiques
   */
  getStats(timeWindow?: number): {
    totalRequests: number;
    successRate: number;
    averageLatency: number;
    totalTokens: number;
    requestsByAction: Record<string, number>;
    requestsByField: Record<string, number>;
    errorRate: number;
  } {
    const now = Date.now();
    const window = timeWindow || 24 * 60 * 60 * 1000; // 24h par défaut
    const relevantMetrics = this.metrics.filter(m => now - m.timestamp < window);

    const totalRequests = relevantMetrics.length;
    const successful = relevantMetrics.filter(m => m.success).length;
    const totalTokens = relevantMetrics.reduce((sum, m) => sum + m.tokensUsed, 0);
    const totalLatency = relevantMetrics.reduce((sum, m) => sum + m.latency, 0);

    const requestsByAction: Record<string, number> = {};
    const requestsByField: Record<string, number> = {};

    relevantMetrics.forEach(m => {
      requestsByAction[m.action] = (requestsByAction[m.action] || 0) + 1;
      requestsByField[m.fieldName] = (requestsByField[m.fieldName] || 0) + 1;
    });

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successful / totalRequests) * 100 : 0,
      averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      totalTokens,
      requestsByAction,
      requestsByField,
      errorRate: totalRequests > 0 ? ((totalRequests - successful) / totalRequests) * 100 : 0
    };
  }

  /**
   * Obtenir les métriques récentes
   */
  getRecentMetrics(limit: number = 100): AiRequestMetrics[] {
    return this.metrics.slice(-limit).reverse();
  }

  /**
   * Nettoyer les métriques anciennes
   */
  cleanup(olderThanDays: number = 7): void {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const before = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    const after = this.metrics.length;
    
    if (before !== after) {
      logger.info(`Cleaned up ${before - after} old metrics`);
    }
  }
}

export default new AiMonitoringService();

