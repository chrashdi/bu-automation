# EOL Sentinel

A lightweight, internal dashboard designed for Private Equity IT auditing. It tracks the "End of Life" (EOL) status of software components across various portfolio products.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **External Data**: endoflife.date API
- **Authentication**: Supabase Auth (Email-based)

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gkbabipghxukunqossvb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

**To get your Supabase keys:**
1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/gkbabipghxukunqossvb
2. Navigate to Settings → API
3. Copy the `anon` `public` key and add it to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy the `service_role` `secret` key and add it to `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database Setup

Run the SQL migration file to create the necessary tables:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_create_tables.sql`
4. Click "Run" to execute the migration

### 3. Storage Bucket Setup

Create a public storage bucket for product logos:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `logos`
3. Set it to **Public** (allows reading images without signed URLs)

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication

The app uses Supabase Auth with email-based authentication. To create your first user:

1. Go to Authentication → Users in your Supabase dashboard
2. Click "Add user" → "Create new user"
3. Enter an email and password
4. Use these credentials to log in to the app

## Project Structure

```
eol-sentinel/
├── app/
│   ├── dashboard/      # Protected dashboard route
│   ├── login/          # Login page
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page (redirects to login/dashboard)
├── utils/
│   └── supabase/        # Supabase client utilities
├── middleware.ts        # Auth middleware for route protection
└── supabase/
    └── migrations/      # Database migration files
```

## Features

- ✅ Email-based authentication with Supabase Auth
- ✅ Protected dashboard routes
- ✅ Product management (coming soon)
- ✅ Component tracking with EOL date fetching (coming soon)
- ✅ Risk visualization (coming soon)

## Next Steps

1. Set up your environment variables
2. Run the database migration
3. Create a storage bucket for logos
4. Create your first user account
5. Start building the dashboard features!
