import { updateProductSchema } from './update-product.schema';

describe('updateProductSchema', () => {
  it('accepts valid partial update with title', () => {
    const result = updateProductSchema.safeParse({
      source_title: 'Updated Title',
    });

    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = updateProductSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects empty string for source_title', () => {
    const result = updateProductSchema.safeParse({
      source_title: '',
    });

    expect(result.success).toBe(false);
  });
});
