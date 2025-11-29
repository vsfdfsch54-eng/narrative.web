# Narrative V2.0 Release Checklist

## Pre-Release Requirements

### Database Setup
- [ ] Run migration `supabase/migrations/036_narrative_v2_schema.sql` in Supabase SQL Editor
- [ ] Verify all tables are created: `loops`, `loop_participants`, `loop_messages`, `events`, `event_participants`, `matchmaking_sessions`, `ai_signals`, `safety_flags`, `feedback`
- [ ] Verify RLS policies are active
- [ ] Test RLS policies with test users
- [ ] Verify indexes are created for performance

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set in production
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set in production
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set in production (SECRET)
- [ ] `OPENAI_API_KEY` - Set if using AI features
- [ ] `NEXT_PUBLIC_SITE_URL` - Set to production URL
- [ ] Verify all env vars are set in Vercel/deployment platform

### Build & Deployment
- [ ] Run `npm run build` successfully (no errors)
- [ ] Fix all TypeScript errors
- [ ] Fix all linting errors
- [ ] Test production build locally
- [ ] Deploy to staging/preview environment
- [ ] Verify deployment URL works

## Feature Testing

### Onboarding Flow
- [ ] Complete full 10-step onboarding flow
- [ ] Verify email/password creation works
- [ ] Verify nickname/profile setup saves
- [ ] Verify mood/intention/topic preferences save
- [ ] Verify permissions are saved
- [ ] Verify completion redirects to `/home-v2`
- [ ] Test with new user
- [ ] Test with existing V1 user (should redirect to onboarding)

### Matchmaking Flow
- [ ] Test mood selection
- [ ] Test intention selection
- [ ] Test topic selection
- [ ] Test finding match
- [ ] Test preview page
- [ ] Test ephemeral chat (verify it's NOT saved to DB)
- [ ] Test swipe right/left
- [ ] Test dual right swipe → messaging-only connection
- [ ] Verify matchmaking session is created in DB

### Loops System
- [ ] Create a new loop via modal
- [ ] Verify loop appears in loops list
- [ ] Open loop detail page
- [ ] Send a message in loop
- [ ] Verify message appears immediately (realtime)
- [ ] Test with multiple users in same loop
- [ ] Verify participants list shows correctly
- [ ] Test visibility layers (private, close-friends, etc.)
- [ ] Test growth enabled/disabled
- [ ] Verify loop messages persist after refresh

### Events System
- [ ] Create a new event via modal
- [ ] Verify event appears in events list
- [ ] Open event detail page
- [ ] Test RSVP functionality
- [ ] Test associating event with loop
- [ ] Verify event participants list
- [ ] Test visibility layers
- [ ] Test growth enabled/disabled
- [ ] Verify events are sorted (upcoming vs past)

### Profile V2
- [ ] View profile page
- [ ] Select mood of the day
- [ ] Verify mood saves to database
- [ ] View interests display
- [ ] View reputation emojis

### Home V2
- [ ] Verify home page loads
- [ ] Verify loops are displayed
- [ ] Verify events are displayed
- [ ] Test "Find Someone" button → goes to matchmaking
- [ ] Test mood quick selector

### Navigation
- [ ] Test all bottom nav tabs (Home, Match, Loops, Events, Profile)
- [ ] Verify routing guards work (redirects to onboarding if needed)
- [ ] Test back navigation
- [ ] Verify conditional navbar shows correctly

## API Testing

### Loops API
- [ ] `POST /api/loops` - Create loop
- [ ] `GET /api/loops?userId=UUID` - Get user loops
- [ ] `GET /api/loops/[id]?userId=UUID` - Get loop details
- [ ] `POST /api/loops/[id]/messages` - Send message
- [ ] `GET /api/loops/[id]/messages` - Get messages
- [ ] `POST /api/loops/[id]/participants` - Add participant
- [ ] `DELETE /api/loops/[id]/participants` - Remove participant
- [ ] `GET /api/loops/[id]/participants` - Get participants

### Events API
- [ ] `POST /api/events` - Create event
- [ ] `GET /api/events?userId=UUID` - Get user events
- [ ] `GET /api/events/[id]?userId=UUID` - Get event details
- [ ] `POST /api/events/[id]/participants` - Invite/update participant
- [ ] `GET /api/events/[id]/participants` - Get participants

### Matchmaking API
- [ ] `POST /api/matchmaking-v2/find` - Find matches
- [ ] `GET /api/matchmaking-v2/session/[sessionId]` - Get session
- [ ] `POST /api/matchmaking-v2/session/[sessionId]/swipe` - Record swipe
- [ ] `GET /api/matchmaking-v2/session/[sessionId]/swipe-status` - Check swipe status

### Onboarding API
- [ ] `POST /api/onboarding-v2/complete` - Complete onboarding

## Security & Performance

### Security
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test that users can't access loops they're not in
- [ ] Test that users can't access events they're not invited to
- [ ] Verify service role key is NOT exposed client-side
- [ ] Test CORS headers are set correctly
- [ ] Verify input validation on all forms
- [ ] Test SQL injection prevention (parameterized queries)

### Performance
- [ ] Test page load times (< 2s for initial load)
- [ ] Test API response times (< 500ms)
- [ ] Verify database queries are optimized (check indexes)
- [ ] Test with multiple concurrent users
- [ ] Verify realtime subscriptions don't cause memory leaks
- [ ] Test on slow network (3G simulation)

## Cross-Platform Testing

### Desktop
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari (iPhone)
- [ ] iOS Safari (iPad)
- [ ] Android Chrome
- [ ] Test touch interactions
- [ ] Test keyboard behavior
- [ ] Test viewport scaling

## Error Handling

### User-Facing Errors
- [ ] Test network errors (show user-friendly message)
- [ ] Test API errors (show user-friendly message)
- [ ] Test validation errors (show inline feedback)
- [ ] Test authentication errors (redirect to login)
- [ ] Test 404 errors (show not found page)

### Developer Errors
- [ ] Verify error logging works
- [ ] Check console for errors
- [ ] Verify error boundaries catch React errors
- [ ] Test error recovery (retry mechanisms)

## Documentation

### Code Documentation
- [ ] README.md is up to date
- [ ] API routes are documented
- [ ] Complex functions have comments
- [ ] Type definitions are complete

### User Documentation
- [ ] Onboarding flow is clear
- [ ] UI is intuitive (no user docs needed if intuitive)
- [ ] Error messages are helpful

## Final Checks

- [ ] All todos completed
- [ ] All build errors fixed
- [ ] All TypeScript errors fixed
- [ ] All linting errors fixed
- [ ] Code is formatted consistently
- [ ] No console.log statements in production code
- [ ] No hardcoded secrets or API keys
- [ ] Environment variables are documented
- [ ] Git repository is clean
- [ ] All changes are committed
- [ ] Version number is updated (if using semantic versioning)

## Post-Release Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up analytics (if applicable)
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Monitor user feedback
- [ ] Set up alerts for critical errors

## Rollback Plan

- [ ] Document rollback procedure
- [ ] Test rollback in staging
- [ ] Have previous version ready
- [ ] Document database migration rollback (if needed)

---

**Release Date:** _______________
**Released By:** _______________
**Version:** V2.0.0

