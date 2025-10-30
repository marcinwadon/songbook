# Songbook App - Technical Documentation

## Overview

A modern web application for managing song lyrics and chords, built with Next.js 16, Supabase, and designed for use on iPad and desktop displays with HDMI output capability for audience viewing.

## Tech Stack

### Core Technologies
- **Framework**: Next.js 16.0.1 with React 19.2
- **Language**: TypeScript
- **Bundler**: Turbopack (default in Next.js 16)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Hosting**: Vercel (free tier)
- **Development Environment**: Nix with direnv

### Key Libraries (To Be Added)
- **Chord Management**:
  - Tonal.js - for chord transposition
  - ChordSheetJS - for ChordPro format parsing
- **PWA**: next-pwa for Progressive Web App features

## Architecture

### Database Schema

#### Songs Table
```sql
- id (UUID, primary key)
- title (text)
- key (text) - original key
- content (text) - ChordPro format
- public (boolean) - visibility setting
- created_by (UUID) - user reference
- created_at/updated_at (timestamps)
```

#### Setlists Table
```sql
- id (UUID, primary key)
- name (text)
- created_by (UUID) - user reference
- created_at/updated_at (timestamps)
```

#### Setlist Songs (Junction Table)
```sql
- id (UUID, primary key)
- setlist_id (UUID)
- song_id (UUID)
- position (integer) - order in setlist
```

#### User Roles Table
```sql
- id (UUID, primary key)
- user_id (UUID)
- role (text) - 'user' or 'admin'
- created_at (timestamp)
```

### Security Model

#### Row Level Security (RLS)
- **Public Songs**: Viewable by everyone
- **Private Songs**: Only viewable by creator
- **Admin Access**: Full access to all songs
- **Setlists**: Private to creator

#### Authentication Flow
1. Email/password registration with Supabase Auth
2. Automatic user role assignment on signup
3. Session management via cookies
4. Middleware protection for routes

## Project Structure

```
/songbook
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── songs/            # Song pages
│   │   │   ├── [id]/         # Individual song view
│   │   │   └── page.tsx      # Song listing
│   │   ├── admin/            # Admin routes (to implement)
│   │   │   └── songs/
│   │   │       └── new/
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── auth/             # Auth components
│   │   ├── nav/              # Navigation
│   │   ├── songs/            # Song components (to implement)
│   │   └── ui/               # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/         # Supabase configuration
│   │   │   ├── client.ts     # Browser client
│   │   │   ├── server.ts     # Server client
│   │   │   └── middleware.ts # Auth middleware
│   │   └── chords/           # Chord utilities (to implement)
│   └── middleware.ts         # Next.js middleware
├── supabase/
│   └── migrations/           # Database migrations
├── flake.nix                 # Nix configuration
└── .envrc                    # direnv configuration
```

## Features Implemented

### ✅ Completed
1. **Project Setup**
   - Next.js 16 with TypeScript
   - Nix flake for development environment
   - Supabase integration

2. **Database**
   - Complete schema with migrations
   - Row Level Security policies
   - Admin role system

3. **Authentication**
   - Login/Register pages
   - Session management
   - Protected routes

4. **Basic UI**
   - Navigation with user/admin distinction
   - Song listing page
   - Responsive layout

### 🚧 To Implement

1. **Song Management**
   - Create/Edit/Delete songs (admin only)
   - ChordPro format editor
   - Real-time preview

2. **Chord Features**
   - ChordPro parser integration
   - Chord transposition
   - Chord highlighting above lyrics

3. **Presentation Mode**
   - Full-screen view
   - Large text for projector/TV display
   - Navigation between songs in setlist

4. **Setlist Management**
   - Create/manage setlists
   - Reorder songs
   - Quick navigation

5. **PWA Features**
   - Service worker for offline access
   - App manifest for installation
   - Cache management

6. **Search & Filter**
   - Search by title/lyrics
   - Filter by key
   - Recent songs

## Development Setup

### Prerequisites
- Nix package manager
- direnv installed and configured
- Supabase account

### Environment Variables
Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Getting Started
```bash
# Allow direnv to load the Nix environment
direnv allow

# Install dependencies
npm install

# Run database migrations (requires Supabase project)
npx supabase db push

# Start development server
npm run dev
```

### Making an Admin User
After a user registers, update their role in Supabase:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-id-here', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin';
```

## Deployment

### Vercel Deployment
1. Push to GitHub repository
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Vercel Free Tier Limits
- 100 GB bandwidth/month
- 100,000 serverless function invocations
- 10 seconds execution timeout
- Perfect for personal/small projects

## ChordPro Format

Songs are stored in ChordPro format:
```
{title: Song Title}
{key: C}

[C]This is a line with a [G]chord
[Am]Another line with [F]multiple [C]chords
```

This format allows:
- Clear chord positioning
- Easy transposition
- Standard across music apps
- Simple text storage

## Security Considerations

1. **Authentication**: All sensitive routes protected by middleware
2. **Database**: RLS policies ensure data isolation
3. **API**: Supabase handles API security
4. **Admin**: Separate role-based access control

## Performance Optimizations

1. **Next.js 16 Features**:
   - Turbopack for faster builds
   - React 19.2 with improved performance
   - Cache Components for selective caching

2. **Database**:
   - Indexes on frequently queried columns
   - Optimized RLS policies
   - Efficient query patterns

3. **Frontend**:
   - Server Components by default
   - Client Components only when needed
   - Optimistic updates planned

## Future Enhancements

1. **Features**:
   - Multiple chord notation systems
   - PDF export
   - Collaborative setlists
   - Song history/versions
   - Metronome integration

2. **Technical**:
   - Real-time collaboration
   - Advanced caching strategies
   - Analytics dashboard
   - Backup/restore functionality

## Troubleshooting

### Common Issues

1. **Nix environment not loading**:
   ```bash
   direnv reload
   direnv allow
   ```

2. **Supabase connection issues**:
   - Check environment variables
   - Verify Supabase project is running
   - Check network connectivity

3. **Authentication not working**:
   - Verify email confirmation settings in Supabase
   - Check middleware configuration
   - Ensure cookies are enabled

## Contributing

### Development Workflow
1. Create feature branch
2. Implement changes
3. Test locally
4. Create pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Conventional commits
- Component-based architecture

## License

This project is for personal use. Modify as needed for your requirements.

---

*Generated with Claude Code - A comprehensive songbook application for musicians*