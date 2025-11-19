# Vercel Deployment Guide for Narrative

## Prerequisites

1. **Supabase Setup**
   - Create a Supabase project at https://supabase.com
   - Run the database migrations from `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
   - Get your project URL and API keys from Supabase dashboard

2. **GitHub Repository**
   - Push your code to a GitHub repository
   - Make sure all changes are committed

## Deployment Steps

### Option 1: Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

3. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   
   **Important**: 
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to expose (public)
   - `SUPABASE_SERVICE_ROLE_KEY` is SECRET - never commit to git or expose publicly
   - Add these for all environments: Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployed URL

### Option 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy to production
vercel --prod
```

## Post-Deployment Checklist

### 1. Database Setup
- [ ] Run migrations in Supabase SQL editor
- [ ] Verify tables are created: `users`, `vibes`, `topics`, `chat_matches`, `messages`, `calendar_events`, `feedback`
- [ ] Check RLS policies are enabled

### 2. Authentication Setup
- [ ] Enable Email/Password auth in Supabase dashboard
- [ ] Configure email templates (optional)
- [ ] Test signup flow

### 3. Test Application Flow
- [ ] Sign up a new user
- [ ] Complete onboarding (set name)
- [ ] Select vibe and topic
- [ ] Check empty states (no matches, no friends, etc.)
- [ ] Verify profile page loads user name from database
- [ ] Test profile name editing

### 4. Environment Variables Verification
- [ ] Verify all environment variables are set in Vercel
- [ ] Check that `NEXT_PUBLIC_*` variables are accessible in browser
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is only used server-side

## Troubleshooting

### Build Errors
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Verify RLS policies allow necessary operations

### Authentication Issues
- Check Supabase Auth is enabled
- Verify email/password provider is enabled
- Check email confirmation settings (if enabled)

### API Route Errors
- Check server logs in Vercel dashboard
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check API route logs for specific errors

## Environment Variables Reference

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe to expose) | Supabase Dashboard → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (SECRET) | Supabase Dashboard → Settings → API → service_role key |

## Important Notes

1. **Never commit secrets**: The `.env.local` file should be in `.gitignore`
2. **RLS Policies**: Make sure Row Level Security policies are set up correctly in Supabase
3. **CORS**: Supabase handles CORS automatically, but verify if you have issues
4. **Database Migrations**: Run migrations in Supabase SQL editor, not through Vercel

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check Supabase logs
3. Verify environment variables are set correctly
4. Test API routes locally first

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure analytics (optional)
3. Set up error monitoring (Sentry, etc.)
4. Configure CI/CD for automatic deployments

