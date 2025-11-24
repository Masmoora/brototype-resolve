-- Add phone_number and approval_status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT,
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create index for faster queries on approval_status
CREATE INDEX idx_profiles_approval_status ON public.profiles(approval_status);