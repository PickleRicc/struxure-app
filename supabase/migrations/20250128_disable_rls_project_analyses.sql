-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own analyses" ON project_analyses;
DROP POLICY IF EXISTS "Users can insert their own analyses" ON project_analyses;

-- Disable RLS
ALTER TABLE project_analyses DISABLE ROW LEVEL SECURITY;
