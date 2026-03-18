-- Seed admin demo account (admin@test.com / admin)
-- Idempotent: ON CONFLICT DO NOTHING
INSERT INTO users (id, email, hashed_password, is_active, created_at)
VALUES (
    gen_random_uuid(),
    'admin@test.com',
    '$2b$12$b7DE.8zzB3M7gc/zWi9zQevIF0VMBo6KNEObzNEIdAtSgqmhnFtum',
    TRUE,
    NOW()
)
ON CONFLICT (email) DO NOTHING;
