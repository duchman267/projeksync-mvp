-- ProjekSync MVP Database Setup Script
-- Run this script in your Supabase SQL Editor to set up the complete database

-- First, run the schema
\i schema.sql

-- Then, apply the RLS policies
\i rls-policies.sql

-- Insert some sample data for testing (optional)
-- This will be useful for testing the database connections

-- Note: You'll need to replace the user_id values with actual user IDs from your Supabase Auth
-- These are just examples and won't work until you have real authenticated users

-- Sample user profile (replace with actual user ID)
-- INSERT INTO user_profiles (id, full_name, business_name) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'John Doe', 'Doe Freelancing');

-- Sample client (replace with actual user ID)
-- INSERT INTO clients (user_id, name, email, phone, address) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Acme Corporation', 'contact@acme.com', '+1-555-0123', '123 Business St, City, State 12345');

-- Sample project (replace with actual user ID and client ID)
-- INSERT INTO projects (user_id, client_id, name, description, start_date, deadline, status) 
-- VALUES ('00000000-0000-0000-0000-000000000000', (SELECT id FROM clients LIMIT 1), 'Website Redesign', 'Complete redesign of company website', '2024-01-01', '2024-03-01', 'active');

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;