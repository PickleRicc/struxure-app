-- Create project_analyses table
CREATE TABLE IF NOT EXISTS project_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'completed'
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_analyses_project_id ON project_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_analyses_user_id ON project_analyses(user_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_project_analyses_updated_at
    BEFORE UPDATE ON project_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
