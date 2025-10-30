-- Create songs table
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    key TEXT, -- original key (e.g., 'C', 'Am', 'G#')
    content TEXT NOT NULL, -- ChordPro format content
    public BOOLEAN DEFAULT true, -- whether the song is publicly visible
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create setlists table
CREATE TABLE IF NOT EXISTS public.setlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create setlist_songs junction table
CREATE TABLE IF NOT EXISTS public.setlist_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    UNIQUE(setlist_id, position),
    UNIQUE(setlist_id, song_id)
);

-- Create indexes for better performance
CREATE INDEX idx_songs_created_by ON public.songs(created_by);
CREATE INDEX idx_songs_public ON public.songs(public);
CREATE INDEX idx_setlists_created_by ON public.setlists(created_by);
CREATE INDEX idx_setlist_songs_setlist ON public.setlist_songs(setlist_id);
CREATE INDEX idx_setlist_songs_song ON public.setlist_songs(song_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON public.songs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_setlists_updated_at BEFORE UPDATE ON public.setlists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for songs
-- Public songs are readable by everyone
CREATE POLICY "Public songs are viewable by everyone"
    ON public.songs FOR SELECT
    USING (public = true);

-- Authenticated users can view their own private songs
CREATE POLICY "Users can view their own private songs"
    ON public.songs FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

-- Only the creator can insert songs
CREATE POLICY "Users can insert their own songs"
    ON public.songs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Only the creator can update their songs
CREATE POLICY "Users can update their own songs"
    ON public.songs FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Only the creator can delete their songs
CREATE POLICY "Users can delete their own songs"
    ON public.songs FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create RLS policies for setlists
-- Users can only view their own setlists
CREATE POLICY "Users can view their own setlists"
    ON public.setlists FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

-- Users can insert their own setlists
CREATE POLICY "Users can insert their own setlists"
    ON public.setlists FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Users can update their own setlists
CREATE POLICY "Users can update their own setlists"
    ON public.setlists FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Users can delete their own setlists
CREATE POLICY "Users can delete their own setlists"
    ON public.setlists FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create RLS policies for setlist_songs
-- Users can view setlist_songs for their own setlists
CREATE POLICY "Users can view their own setlist songs"
    ON public.setlist_songs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.setlists
            WHERE setlists.id = setlist_songs.setlist_id
            AND setlists.created_by = auth.uid()
        )
    );

-- Users can insert setlist_songs for their own setlists
CREATE POLICY "Users can insert songs to their own setlists"
    ON public.setlist_songs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.setlists
            WHERE setlists.id = setlist_id
            AND setlists.created_by = auth.uid()
        )
    );

-- Users can update setlist_songs for their own setlists
CREATE POLICY "Users can update songs in their own setlists"
    ON public.setlist_songs FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.setlists
            WHERE setlists.id = setlist_songs.setlist_id
            AND setlists.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.setlists
            WHERE setlists.id = setlist_id
            AND setlists.created_by = auth.uid()
        )
    );

-- Users can delete setlist_songs from their own setlists
CREATE POLICY "Users can delete songs from their own setlists"
    ON public.setlist_songs FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.setlists
            WHERE setlists.id = setlist_songs.setlist_id
            AND setlists.created_by = auth.uid()
        )
    );