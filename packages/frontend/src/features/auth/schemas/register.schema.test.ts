import { registerSchema } from './register.schema';

describe('registerSchema', () => {
  it('accepts valid credentials', () => {
    const result = registerSchema.safeParse({
      email: 'new-user@example.com',
      password: 'super-secret-42',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'bad-email',
      password: 'super-secret-42',
    });

    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      email: 'new-user@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('rejects long password', () => {
    const result = registerSchema.safeParse({
      email: 'new-user@example.com',
      password: 'a'.repeat(73),
    });

    expect(result.success).toBe(false);
  });
});
