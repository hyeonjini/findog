-- Seed admin demo account (admin@test.com / admin123)
-- Idempotent: ON CONFLICT DO NOTHING
INSERT INTO users (id, email, hashed_password, is_active, created_at)
VALUES (
    gen_random_uuid(),
    'admin@test.com',
    '$2b$12$sa8hF5CRBrDzjylmp8a84OnU6szty6slSy8G3us84SGUIanmwek2m',
    TRUE,
    NOW()
)
ON CONFLICT (email) DO NOTHING;
