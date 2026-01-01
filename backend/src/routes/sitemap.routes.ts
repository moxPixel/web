import { Router, Request, Response } from 'express';
import Training from '../models/Training';
import { logger } from '../logger/logger';

const router = Router();

/**
 * GET /sitemap.xml
 * Génère dynamiquement le sitemap XML avec toutes les formations publiées
 */
router.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const baseUrl = 'https://www.unlock-formation.fr';
    const currentDate = new Date().toISOString().split('T')[0];

    // Récupérer toutes les formations publiées
    const trainings = await Training.findAll({
      where: { status: 'published' },
      attributes: ['slug', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
    });

    // Pages statiques
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/approche', priority: '0.8', changefreq: 'monthly' },
      { url: '/alternance', priority: '0.9', changefreq: 'monthly' },
      { url: '/projet-formation', priority: '0.8', changefreq: 'monthly' },
      { url: '/trainings', priority: '0.9', changefreq: 'weekly' },
      { url: '/contact', priority: '0.7', changefreq: 'monthly' },
      { url: '/cgu', priority: '0.3', changefreq: 'yearly' },
      { url: '/cgv', priority: '0.3', changefreq: 'yearly' },
      { url: '/faq', priority: '0.6', changefreq: 'monthly' },
      { url: '/orientation', priority: '0.7', changefreq: 'monthly' },
    ];

    // Construire le XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

    // Ajouter les pages statiques
    // Note: keep lastmod dynamic rather than hardcoding a fixed date.
    for (const page of staticPages) {
      const lastmod = currentDate;
      xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Ajouter les formations
    for (const training of trainings) {
      const lastmod = training.updatedAt
        ? new Date(training.updatedAt).toISOString().split('T')[0]
        : currentDate;
      xml += `  <url>
    <loc>${baseUrl}/trainings/${training.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
    res.status(200).send(xml);

    logger.info(`Sitemap generated with ${staticPages.length} static pages and ${trainings.length} trainings`);
  } catch (error: any) {
    logger.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * GET /robots.txt
 * Robots policy + sitemap URL.
 */
router.get('/robots.txt', (_req: Request, res: Response) => {
  const baseUrl = 'https://www.unlock-formation.fr';
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /backoffice',
    'Disallow: /profile',
    'Disallow: /login',
    'Disallow: /forgot-password',
    'Disallow: /reset-password',
    'Disallow: /api/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ];
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(lines.join('\n'));
});

export default router;
