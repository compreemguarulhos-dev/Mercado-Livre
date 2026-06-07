/**
 * Helper to dynamically resolve the Backend Proxy Server URL.
 * Enables client applications running on Vercel or other external domains
 * to successfully communicate with this secure full-stack backend module on Cloud Run.
 */
export function getApiBaseUrl(): string {
  const saved = localStorage.getItem('meli_backend_url');
  if (saved) {
    const trimmed = saved.trim();
    // Vercel only hosts our static frontend, so it cannot be used as a backend server proxy
    if (trimmed && !trimmed.includes('vercel.app')) {
      return trimmed;
    }
    // Clean invalid cached vercel backend pointers
    localStorage.removeItem('meli_backend_url');
  }

  const origin = window.location.origin;
  // If running on a known static-only frontend host, use the fallback backend.
  // Otherwise, if running locally, on Render, or any full-stack provider, use the current origin as the API base.
  const isStaticOnlyHost = origin.includes('vercel.app') || 
                           origin.includes('github.io') || 
                           origin.includes('netlify.app') || 
                           origin.includes('pages.dev');

  if (!isStaticOnlyHost) {
    return origin;
  }

  // Fallback to our running workspace Cloud Run service URL
  return 'https://ais-pre-evos2tczwiqldpq4hhrdmu-485888573949.us-east1.run.app';
}

/**
 * Normalizes and produces a fully qualified URL for any local proxy endpoint.
 */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Builds a direct Mercado Livre product URL in the official format requested by the user:
 * https://www.mercadolivre.com.br/{kebab-case-title}/p/{itemId}
 */
export function getMeliProductUrl(title: string, itemId: string, originalPermalink?: string): string {
  // If the original permalink is already structured as a direct product page on www.mercadolivre.com.br/something/p/...
  // we can use it to avoid losing any specific query parameters or routing.
  if (originalPermalink && 
      originalPermalink.includes("mercadolivre.com.br") && 
      originalPermalink.includes("/p/") && 
      !originalPermalink.includes("lista.mercadolivre.com.br")) {
    return originalPermalink;
  }

  // Clean the title: remove accents, normalize string, convert to lowercase kebab-case
  const cleanTitle = (title || "produto")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except spaces/hyphens
    .trim()
    .replace(/\s+/g, "-") // replace multiple consecutive spaces with a single hyphen
    .replace(/-+/g, "-"); // replace multiple consecutive hyphens with a single hyphen

  // Ensure Item ID is clean and capitalized (e.g. MLB2000086176)
  const cleanId = (itemId || "").toUpperCase().trim();

  return `https://www.mercadolivre.com.br/${cleanTitle}/p/${cleanId}`;
}
