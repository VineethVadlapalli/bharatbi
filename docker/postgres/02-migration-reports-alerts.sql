-- =============================================================================
-- BharatBI Migration: Scheduled Reports, Alerts, Teams
-- Run this AFTER the initial init.sql
-- =============================================================================

-- Scheduled Reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(200) NOT NULL,
    query_id UUID REFERENCES queries(id),
    connection_id UUID REFERENCES connections(id),
    cron_expression VARCHAR(50) NOT NULL,  -- "0 9 * * 1" = Monday 9am
    recipients JSONB DEFAULT '[]',  -- ["email1@example.com", "email2@example.com"]
    format VARCHAR(10) DEFAULT 'csv',  -- csv, pdf
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP,
    last_run_status VARCHAR(20),  -- success, error
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(200) NOT NULL,
    query_id UUID REFERENCES queries(id),
    connection_id UUID REFERENCES connections(id),
    condition VARCHAR(20) NOT NULL,  -- less_than, greater_than, equals, not_equals
    threshold NUMERIC(15,2) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    check_interval_minutes INTEGER DEFAULT 60,
    notify_emails JSONB DEFAULT '[]',
    notify_webhook TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    last_checked_at TIMESTAMP,
    last_triggered_at TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Team invitations (multi-user)
CREATE TABLE IF NOT EXISTS team_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'analyst',  -- admin, analyst, viewer
    invited_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, expired
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

-- Add role column to users if not exists
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
