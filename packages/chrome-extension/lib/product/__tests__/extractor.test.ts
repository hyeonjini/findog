import { beforeEach, describe, expect, it } from 'vitest';

import { extractProductData } from '../extractor';

const mockDocument = {
  title: '',
  querySelectorAll: () => [],
  querySelector: () => null,
};

const mockLocation = {
  href: '',
};

beforeEach(() => {
  Object.defineProperty(globalThis, 'document', {
    value: mockDocument,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: { location: mockLocation },
    writable: true,
    configurable: true,
  });
});

describe('extractProductData', () => {
  it('returns url and title from document', () => {
    mockDocument.title = 'Sony WH-1000XM5 Headphones';
    mockLocation.href = 'https://amazon.com/product/B09XS7JWHH';

    const result = extractProductData();

    expect(result.url).toBe('https://amazon.com/product/B09XS7JWHH');
    expect(result.title).toBe('Sony WH-1000XM5 Headphones');
  });

  it('source is dom-fallback when no OG or JSON-LD available', () => {
    mockDocument.title = 'Test Page';
    mockLocation.href = 'https://example.com/product';

    const result = extractProductData();

    expect(result.source).toBe('dom-fallback');
  });

  it('returns null title for empty document title', () => {
    mockDocument.title = '';
    mockLocation.href = 'https://example.com/product';

    const result = extractProductData();

    expect(result.title).toBeNull();
  });
});
