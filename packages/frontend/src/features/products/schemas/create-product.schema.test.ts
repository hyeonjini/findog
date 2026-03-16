import { createProductSchema } from './create-product.schema';

describe('createProductSchema', () => {
  it('accepts valid source_url and source_title', () => {
    const result = createProductSchema.safeParse({
      source_url: 'https://amazon.com/product/123',
      source_title: 'Test Product',
    });

    expect(result.success).toBe(true);
  });

  it('rejects missing source_url', () => {
    const result = createProductSchema.safeParse({
      source_title: 'Test Product',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing source_title', () => {
    const result = createProductSchema.safeParse({
      source_url: 'https://amazon.com/product/123',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid URL format', () => {
    const result = createProductSchema.safeParse({
      source_url: 'not-a-valid-url',
      source_title: 'Test Product',
    });

    expect(result.success).toBe(false);
  });
});
