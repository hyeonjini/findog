CREATE TABLE price_history (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_product_id UUID         NOT NULL REFERENCES tracked_products(id) ON DELETE CASCADE,
    platform           VARCHAR(100) NOT NULL,
    price_amount       NUMERIC(12, 2) NOT NULL,
    currency           VARCHAR(10)  NOT NULL DEFAULT 'KRW',
    product_url        TEXT,
    in_stock           BOOLEAN      NOT NULL DEFAULT TRUE,
    checked_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_product_checked
    ON price_history (tracked_product_id, checked_at DESC);

CREATE INDEX idx_price_history_product_platform
    ON price_history (tracked_product_id, platform, checked_at DESC);

CREATE INDEX idx_price_history_checked_brin
    ON price_history USING BRIN (checked_at);
