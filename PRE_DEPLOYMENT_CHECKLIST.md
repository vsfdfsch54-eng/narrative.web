# Pre-Deployment Checklist for Vercel

## ✅ Code Quality
- [x] No linter errors
- [x] All TypeScript types are correct
- [x] No console.log statements in production code (only console.error for debugging)
- [x] All mock/fake data removed
- [x] All API routes properly handle errors

## ✅ Environment Variables
Make sure these are set in Vercel:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (SECRET)

## ✅ Database Setup
- [ ] Run migration `001_initial_schema.sql` in Supabase SQL editor
- [ ] Run migration `002_add_updated_at_to_users.sql` if needed
- [ ] Verify all tables are created: `users`, `vibes`, `topics`, `chat_matches`, `messages`, `calendar_events`, `feedback`
- [ ] Verify RLS policies are enabled and working
- [ ] Test that users can insert their own records

## ✅ Authentication
- [ ] Email/Password auth is enabled in Supabase dashboard
- [ ] Email confirmation settings configured (if using)
- [ ] Test signup flow works
- [ ] Test login flow works
- [ ] Test onboarding redirect works

## ✅ API Routes
All API routes should be tested:
- [ ] `/api/users` - GET and PUT work
- [ ] `/api/vibes` - POST and GET work
- [ ] `/api/topics` - GET work
- [ ] `/api/matches` - POST, GET, PATCH work
- [ ] `/api/messages` - POST and GET work
- [ ] `/api/chats` - GET work
- [ ] `/api/calendar` - POST and GET work
- [ ] `/api/feedback` - POST work

## ✅ Pages
Test all pages:
- [ ] `/` - Home page loads
- [ ] `/login` - Login works
- [ ] `/signup` - Signup works
- [ ] `/onboarding` - Onboarding works
- [ ] `/vibe` - Vibe selection works
- [ ] `/connect` - Shows empty state (no matches yet)
- [ ] `/chat` - Shows empty state
- [ ] `/chat/[id]` - Chat page loads
- [ ] `/profile` - Profile page loads
- [ ] `/calendar` - Calendar page loads
- [ ] `/feedback` - Feedback page loads
- [ ] `/conversations` - Conversations page loads

## ✅ Features
- [ ] User can sign up
- [ ] User can set their name in onboarding
- [ ] User can select vibe and topic
- [ ] User can view their profile
- [ ] User can edit their profile name
- [ ] Calendar shows empty state (no events)
- [ ] All empty states display correctly
- [ ] Bottom navigation works on all pages
- [ ] Back buttons work correctly

## ✅ Security
- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] Service role key is never exposed to client
- [ ] RLS policies prevent unauthorized access
- [ ] All API routes validate input
- [ ] No sensitive data in client-side code

## ✅ Performance
- [ ] Images optimized (if any)
- [ ] No unnecessary re-renders
- [ ] API calls are efficient
- [ ] Loading states are shown

## ✅ Build
- [ ] `npm run build` completes successfully
- [ ] No build errors or warnings
- [ ] All imports resolve correctly
- [ ] TypeScript compilation succeeds

## ✅ Vercel Configuration
- [ ] Framework preset: Next.js
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next` (default)
- [ ] Install command: `npm install`
- [ ] Node.js version: 18+ (auto-detected)

## ✅ Post-Deployment Testing
After deploying to Vercel:
- [ ] Visit deployed URL
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test onboarding
- [ ] Test vibe/topic selection
- [ ] Test profile page
- [ ] Test calendar page
- [ ] Check browser console for errors
- [ ] Check Vercel function logs for errors

## 📝 Notes
- All mock data has been removed
- Empty states are properly implemented
- Database-driven throughout
- Ready for real users

