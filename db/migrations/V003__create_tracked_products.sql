CREATE TABLE IF NOT EXISTS tracked_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_platform VARCHAR(100),
  source_title VARCHAR(500) NOT NULL,
  source_image_url TEXT,
  source_price_amount NUMERIC(12,2),
  source_currency VARCHAR(10),
  normalized_query TEXT,
  product_fingerprint VARCHAR(255),
  monitoring_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
    monitoring_status IN ('active', 'paused', 'archived')
  ),
  restock_alert_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  lowest_price_tracking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_tracked_products_user_id_source_url UNIQUE(user_id, source_url)
);

CREATE INDEX idx_tracked_products_user_id ON tracked_products(user_id);
CREATE INDEX idx_tracked_products_monitoring_status ON tracked_products(monitoring_status);
