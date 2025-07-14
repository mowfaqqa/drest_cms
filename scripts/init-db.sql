-- Initialize database with required extensions and settings
-- This script runs when the PostgreSQL container starts for the first time

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Set timezone
SET timezone = 'Africa/Dakar';

-- Create additional indexes for better performance (these will be created after Prisma migrations)
-- But we can set up some basic configuration here

-- Configure PostgreSQL for better performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET temp_file_limit = '2GB';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Create a function for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function for generating slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    unaccent(trim(input_text)),
                    '[^a-zA-Z0-9\s\-_]', '', 'g'
                ),
                '\s+', '-', 'g'
            ),
            '\-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function for full-text search
CREATE OR REPLACE FUNCTION search_products(search_term TEXT)
RETURNS TABLE(
    id TEXT,
    name TEXT,
    description TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        ts_rank(
            to_tsvector('french', coalesce(p.name, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.short_description, '')),
            plainto_tsquery('french', search_term)
        ) as rank
    FROM products p
    WHERE 
        p.is_active = true
        AND (
            to_tsvector('french', coalesce(p.name, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.short_description, ''))
            @@ plainto_tsquery('french', search_term)
            OR p.name ILIKE '%' || search_term || '%'
            OR p.description ILIKE '%' || search_term || '%'
        )
    ORDER BY rank DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pg_trgm, unaccent';
    RAISE NOTICE 'Helper functions created: update_updated_at_column, generate_slug, search_products';
END $$;