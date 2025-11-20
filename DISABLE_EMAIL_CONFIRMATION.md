# How to Disable Email Confirmation in Supabase

## Steps to Disable Email Confirmation

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Email Provider Settings**
   - Go to: **Authentication** → **Providers** → **Email**
   - Find the **"Confirm email"** toggle

3. **Disable Email Confirmation**
   - Toggle **"Confirm email"** to **OFF**
   - Save changes

## What Happens When Disabled

✅ **Users can sign up immediately** - No email verification required
✅ **Faster onboarding** - Users go straight to the app
✅ **No email sending limits** - Won't hit Supabase email quotas
✅ **Better for development/testing** - No need to check emails

⚠️ **Security Note**: 
- Less secure (anyone with email can create account)
- Only use for development/testing
- **Re-enable for production!**

## Code Changes Made

The app now handles both scenarios:

1. **Email confirmation ON**: Users go to verify step, must click email link
2. **Email confirmation OFF**: Users are automatically verified, skip to `/signed-up`

## Testing

After disabling email confirmation:

1. Try signing up with a new account
2. User should be automatically logged in
3. Should redirect to `/signed-up` page
4. Then to `/vibe` after clicking continue

## Re-enabling for Production

When ready for production:

1. Go back to: **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to **ON**
3. Consider setting up SMTP for better email delivery
4. Test the email verification flow

## Alternative: Set Up SMTP

Instead of disabling email confirmation, you can:

1. Keep email confirmation **ON**
2. Set up SMTP (Gmail, SendGrid, etc.)
3. This bypasses Supabase email limits
4. Better email deliverability

See `SUPABASE_EMAIL_SETUP.md` for SMTP setup instructions.

