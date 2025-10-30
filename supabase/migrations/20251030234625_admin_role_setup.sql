-- Create a table to store user roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
-- Users can view their own role
CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Function to check if a user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = is_admin.user_id
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if the current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create additional admin policies for songs table
-- Admins can view all songs (including private)
CREATE POLICY "Admins can view all songs"
    ON public.songs FOR SELECT
    TO authenticated
    USING (public.is_current_user_admin());

-- Admins can update any song
CREATE POLICY "Admins can update any song"
    ON public.songs FOR UPDATE
    TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- Admins can delete any song
CREATE POLICY "Admins can delete any song"
    ON public.songs FOR DELETE
    TO authenticated
    USING (public.is_current_user_admin());

-- Function to automatically create a user role when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user function
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert an example admin user (you'll need to update this with your actual admin user ID after sign up)
-- IMPORTANT: Uncomment and update this line with your admin user's ID after they sign up
-- INSERT INTO public.user_roles (user_id, role) VALUES ('your-admin-user-id-here', 'admin') ON CONFLICT (user_id) DO UPDATE SET role = 'admin';