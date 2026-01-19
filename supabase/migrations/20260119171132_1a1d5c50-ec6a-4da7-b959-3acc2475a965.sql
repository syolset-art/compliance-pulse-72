-- Create table for storing selected compliance frameworks
CREATE TABLE public.selected_frameworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_id TEXT NOT NULL,
  framework_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'privacy', 'security', 'ai', 'other'
  is_mandatory BOOLEAN DEFAULT false,
  is_recommended BOOLEAN DEFAULT false,
  is_selected BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.selected_frameworks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth)
CREATE POLICY "Allow all operations on selected_frameworks" 
ON public.selected_frameworks 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_selected_frameworks_updated_at
BEFORE UPDATE ON public.selected_frameworks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();