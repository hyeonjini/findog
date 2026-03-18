import type { ProductData } from './types';

export function extractProductData(): ProductData {
  const jsonLdResult = extractFromJsonLd();
  if (jsonLdResult) {
    return jsonLdResult;
  }

  const openGraphResult = extractFromOpenGraph();
  if (openGraphResult) {
    return openGraphResult;
  }

  return extractFromDom();
}

function extractFromJsonLd(): ProductData | null {
  return null;
}

function extractFromOpenGraph(): ProductData | null {
  return null;
}

function extractFromDom(): ProductData {
  return {
    title: document.title.trim() || null,
    url: window.location.href,
    source: 'dom-fallback',
  };
}
