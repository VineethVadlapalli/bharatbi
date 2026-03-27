-- BharatBI — PostgreSQL initialization script
-- This runs once when the local dev postgres container starts.
-- In production, use Supabase migrations instead.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    plan        TEXT NOT NULL DEFAULT 'free',  -- free | pro | business | enterprise
    llm_provider TEXT NOT NULL DEFAULT 'openai', -- openai | anthropic
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email       TEXT NOT NULL UNIQUE,
    role        TEXT NOT NULL DEFAULT 'analyst', -- admin | analyst | viewer
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data source connections
CREATE TABLE IF NOT EXISTS connections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL, -- mysql | postgresql | google_sheets | tally | zoho_crm | zoho_books
    credentials_enc TEXT,          -- AES-encrypted JSON blob
    status          TEXT NOT NULL DEFAULT 'pending', -- pending | syncing | ready | error
    last_synced_at  TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema metadata (enriched by LLM)
CREATE TABLE IF NOT EXISTS schema_metadata (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
    table_name    TEXT NOT NULL,
    column_name   TEXT,              -- NULL means this row describes the table itself
    data_type     TEXT,
    description   TEXT NOT NULL,     -- LLM-generated human-readable description
    vector_id     TEXT,              -- Qdrant point ID
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(connection_id, table_name, column_name)
);

-- Query history
CREATE TABLE IF NOT EXISTS queries (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
    question      TEXT NOT NULL,
    generated_sql TEXT,
    row_count     INTEGER,
    duration_ms   INTEGER,
    llm_provider  TEXT,
    llm_model     TEXT,
    status        TEXT NOT NULL DEFAULT 'success', -- success | error
    error_message TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved / pinned questions
CREATE TABLE IF NOT EXISTS saved_questions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
    query_id   UUID REFERENCES queries(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Encrypted LLM API keys (per org)
CREATE TABLE IF NOT EXISTS api_keys (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider    TEXT NOT NULL, -- openai | anthropic
    key_enc     TEXT NOT NULL, -- encrypted
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, provider)
);

-- Seed a default dev org and user for local development
INSERT INTO organizations (id, name, plan) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Dev Org', 'pro')
ON CONFLICT DO NOTHING;

INSERT INTO users (id, org_id, email, role) VALUES
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'dev@bharatbi.local', 'admin')
ON CONFLICT DO NOTHING;