-- Supabase Required Roles and Permissions
-- This script sets up the roles needed for Supabase services to work

-- Create roles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role BYPASSRLS NOLOGIN NOINHERIT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE ROLE supabase_auth_admin NOINHERIT LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
        CREATE ROLE supabase_admin NOINHERIT LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
    END IF;
END
$$;

-- Grant permissions
GRANT anon TO authenticator;
GRANT service_role TO authenticator;
GRANT anon TO postgres;
GRANT service_role TO postgres;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticator, service_role;

-- Grant permissions on existing tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticator, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticator, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticator, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticator, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticator, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticator, service_role;

