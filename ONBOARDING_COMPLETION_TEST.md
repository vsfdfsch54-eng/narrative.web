# Onboarding Completion Flow - Test Plan

## Test Scenario: Complete Onboarding and Navigate to Vibe

### Expected Flow
1. User completes all onboarding steps (email → password → name → questions → interests → confirmation)
2. User clicks "Start connecting" on confirmation step
3. System saves `onboarding_step = 'complete'` and `onboarding_completed = true` to database
4. System navigates to `/vibe` page
5. User sees vibe/topic selection page (no redirect back to onboarding)

### Test Steps

#### 1. Start Fresh Account Creation
- [ ] Go to `/` (welcome page)
- [ ] Click "Create an Account"
- [ ] Should navigate to `/onboarding?step=email`

#### 2. Complete Email Step
- [ ] Enter valid email address
- [ ] Click "Continue"
- [ ] Should navigate to password step

#### 3. Complete Password Step (Account Creation)
- [ ] Enter password (at least 6 characters)
- [ ] Confirm password matches
- [ ] Click "Continue"
- [ ] Account should be created in Supabase Auth
- [ ] Should navigate to name step
- [ ] Check browser console for any errors

#### 4. Complete Name Step
- [ ] Enter first name
- [ ] Enter last name
- [ ] Click "Continue"
- [ ] Should navigate to questions step

#### 5. Complete Questions Step
- [ ] Answer all 10 questions
- [ ] Click "Continue" after last question
- [ ] Should navigate to interests step

#### 6. Complete Interests Step
- [ ] Select at least one interest
- [ ] Click "Continue"
- [ ] Should navigate to confirmation step

#### 7. Complete Confirmation Step (CRITICAL TEST)
- [ ] Review information on confirmation page
- [ ] Click "Start connecting"
- [ ] **Check browser console for logs:**
  - Should see: `[OnboardingController] Saving completion to database...`
  - Should see: `[OnboardingController] ✅ Completion saved successfully`
  - Should see: `[OnboardingController] ✅ Save verified - onboarding is complete`
  - Should see: `[OnboardingController] Navigating to /vibe...`
- [ ] Should navigate to `/vibe` page
- [ ] Should NOT redirect back to onboarding
- [ ] Should NOT see welcome page

#### 8. Verify Database State
- [ ] Check Supabase database: `users` table
- [ ] Find user record by email
- [ ] Verify `onboarding_step = 'complete'`
- [ ] Verify `onboarding_completed = true`
- [ ] Verify `first_name` and `last_name` are set
- [ ] Verify `questions_answers` JSONB field has all 10 answers
- [ ] Verify `interests` array has selected interests

#### 9. Test Navigation After Completion
- [ ] From `/vibe`, click "Profile" in navbar
- [ ] Should go to `/profile` (not redirect to onboarding)
- [ ] From `/vibe`, click "Chat" in navbar
- [ ] Should go to `/chat` (not redirect to onboarding)
- [ ] Manually navigate to `/` (home)
- [ ] Should redirect to `/vibe` (not show welcome page)
- [ ] Manually navigate to `/onboarding`
- [ ] Should redirect to `/vibe` (not show onboarding)

### Debugging Checklist

If completion redirects back to beginning:

1. **Check Browser Console:**
   - Look for `[OnboardingController]` logs
   - Check for any error messages
   - Verify save succeeded: `✅ Completion saved successfully`

2. **Check Network Tab:**
   - Look for `/api/users` PUT request
   - Verify response status is 200
   - Check response body: `{ success: true, ... }`

3. **Check Database:**
   - Query: `SELECT onboarding_step, onboarding_completed FROM users WHERE email = 'test@example.com'`
   - Should show: `onboarding_step = 'complete'`, `onboarding_completed = true`

4. **Common Issues:**
   - Save failing silently → Check API route logs
   - User ID missing → Check auth state
   - Database not updating → Check RLS policies
   - Redirect loop → Check routing guards

### Expected Console Output (Success)

```
[OnboardingController] Saving completion to database... {userId: "...", step: "complete", completed: true}
[OnboardingController] ✅ Completion saved successfully
[OnboardingController] ✅ Save verified - onboarding is complete
[OnboardingController] Navigating to /vibe...
```

### Expected Console Output (Failure)

```
[OnboardingController] Saving completion to database...
[OnboardingController] ❌ Save completion FAILED: [error message]
```

### Manual Database Check Query

```sql
SELECT 
  id,
  email,
  first_name,
  last_name,
  onboarding_step,
  onboarding_completed,
  questions_answers,
  interests
FROM users
WHERE email = 'your-test-email@example.com';
```

Expected result:
- `onboarding_step` = `'complete'`
- `onboarding_completed` = `true`
- `first_name` and `last_name` should be set
- `questions_answers` should be a JSON object with 10 keys
- `interests` should be an array of interest IDs

