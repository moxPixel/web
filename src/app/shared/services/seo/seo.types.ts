export type SeoRobots = 'index,follow' | 'noindex,nofollow' | 'noindex,follow' | 'index,nofollow';

export type SeoRouteData = {
  title?: string;
  description?: string;
  image?: string; // absolute or "/assets/.."
  canonicalPath?: string; // e.g. "/trainings"
  robots?: SeoRobots;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, any> | Array<Record<string, any>> | null;
};


