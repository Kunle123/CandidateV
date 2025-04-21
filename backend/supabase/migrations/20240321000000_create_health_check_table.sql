-- Create health check table
CREATE TABLE IF NOT EXISTS health_check (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text NOT NULL DEFAULT 'healthy',
  message text
);

-- Insert initial record
INSERT INTO health_check (status, message)
VALUES ('healthy', 'Initial health check record');

-- Enable RLS
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous read access
CREATE POLICY "Allow anonymous read access"
  ON health_check
  FOR SELECT
  TO anon
  USING (true); 