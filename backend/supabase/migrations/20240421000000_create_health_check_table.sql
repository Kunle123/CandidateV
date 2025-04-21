-- Create health check table
CREATE TABLE IF NOT EXISTS public.health_check (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    status text NOT NULL DEFAULT 'healthy',
    message text,
    version text
);

-- Insert initial health check record
INSERT INTO public.health_check (status, message, version)
VALUES ('healthy', 'System initialized', '1.0.0');

-- Enable RLS
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow anonymous read access to health_check"
    ON public.health_check
    FOR SELECT
    TO anon
    USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_health_check_updated_at
    BEFORE UPDATE ON public.health_check
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at(); 