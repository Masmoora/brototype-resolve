-- Clean up and rebuild database schema for BroDesk

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add priority field to complaints if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='complaints' AND column_name='priority') THEN
    ALTER TABLE public.complaints ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Add file_url to complaints for file uploads
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='complaints' AND column_name='file_url') THEN
    ALTER TABLE public.complaints ADD COLUMN file_url TEXT;
  END IF;
END $$;

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON public.categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Update profiles RLS to allow admins to update any profile
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Academic', 'Academic related issues'),
  ('Infrastructure', 'Infrastructure and facilities'),
  ('Administrative', 'Administrative processes'),
  ('Technical', 'Technical and IT issues'),
  ('Hostel', 'Hostel related complaints'),
  ('Mess', 'Mess and food related issues'),
  ('Other', 'Other miscellaneous issues')
ON CONFLICT (name) DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON public.complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON public.complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Update complaints RLS to allow staff to update assigned complaints
DROP POLICY IF EXISTS "Staff can update assigned complaints" ON public.complaints;
CREATE POLICY "Staff can update assigned complaints"
  ON public.complaints FOR UPDATE
  USING (
    (has_role(auth.uid(), 'staff') AND auth.uid() = assigned_to) OR 
    has_role(auth.uid(), 'admin')
  );