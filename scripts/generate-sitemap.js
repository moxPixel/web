#!/usr/bin/env node

/**
 * Script de génération automatique du sitemap.xml
 * 
 * Usage: node scripts/generate-sitemap.js
 * 
 * Ce script lit les routes depuis app.routes.ts et génère un sitemap.xml
 * dans public/sitemap.xml
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.unlock-formation.fr';
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap.xml');

// Routes publiques indexables (extrait de app.routes.ts)
// Format: { path: string, changefreq?: string, priority?: number, lastmod?: string }
const PUBLIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/about', changefreq: 'monthly', priority: 0.8 },
  { path: '/alternance', changefreq: 'monthly', priority: 0.9 },
  { path: '/projet-formation', changefreq: 'monthly', priority: 0.8 },
  { path: '/approche', changefreq: 'monthly', priority: 0.8 },
  { path: '/recrutement', changefreq: 'monthly', priority: 0.7 },
  { path: '/trainings', changefreq: 'weekly', priority: 0.9 },
  { path: '/orientation', changefreq: 'monthly', priority: 0.8 },
  { path: '/contact', changefreq: 'monthly', priority: 0.7 },
  { path: '/cgu', changefreq: 'yearly', priority: 0.3 },
  { path: '/cgv', changefreq: 'yearly', priority: 0.3 },
  { path: '/faq', changefreq: 'monthly', priority: 0.6 },
];

// Routes dynamiques (trainings) - à enrichir depuis l'API si nécessaire
// Pour l'instant, on génère uniquement les routes statiques
// TODO: Si vous avez une API, vous pouvez enrichir ce script pour inclure
// les formations dynamiques : /trainings/:slug

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

  PUBLIC_ROUTES.forEach(route => {
    const url = `${BASE_URL}${route.path}`;
    const changefreq = route.changefreq || 'monthly';
    const priority = route.priority || 0.5;
    const lastmod = route.lastmod || today;

    xml += `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
  });

  xml += `</urlset>`;

  // Écrire le fichier
  fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
  console.log(`✅ Sitemap généré: ${OUTPUT_FILE}`);
  console.log(`   ${PUBLIC_ROUTES.length} URLs incluses`);
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Exécuter
generateSitemap();

