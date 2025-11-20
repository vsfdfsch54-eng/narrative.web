# Diagnose Email Issue - Quick Checklist

## Step 1: Check Browser Console

1. Open your browser DevTools (F12)
2. Go to Console tab
3. Try signing up
4. Look for these logs:
   - "Attempting signup with email: ..."
   - "Signup response: ..."
   - "Email not confirmed, attempting to resend..."
   - Any error messages

## Step 2: Check Supabase Dashboard

### A. Email Templates
1. Go to: **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Check if **"Confirm signup"** template exists and is enabled
3. Verify the template has `{{ .ConfirmationURL }}` or similar

### B. Email Provider Settings
1. Go to: **Settings** → **Auth** → **SMTP Settings**
2. Check if SMTP is configured:
   - If **NOT configured**: Supabase uses default email service (limited, may go to spam)
   - If **configured**: Verify SMTP credentials are correct

### C. Email Confirmation Setting
1. Go to: **Authentication** → **Providers** → **Email**
2. Check **"Confirm email"** toggle:
   - **ON**: Users must verify email (emails should be sent)
   - **OFF**: No verification required (no emails sent)

### D. Redirect URLs
1. Go to: **Authentication** → **URL Configuration**
2. Check **Redirect URLs** includes:
   - `http://localhost:3000/auth/callback` (for local)
   - `https://yourdomain.com/auth/callback` (for production)

## Step 3: Check Supabase Logs

1. Go to: **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Look for:
   - Email sending errors
   - Rate limit errors
   - SMTP errors
   - Authentication errors

## Step 4: Common Issues & Fixes

### Issue: "Email sending failed" or no email at all

**Possible Causes:**
1. Email confirmation disabled in Supabase
2. SMTP not configured (using default service with limits)
3. Email going to spam
4. Rate limits exceeded
5. Invalid email address

**Fixes:**
1. Enable email confirmation: **Auth** → **Providers** → **Email** → Toggle **"Confirm email"** ON
2. Configure SMTP: **Settings** → **Auth** → **SMTP Settings** → Add your SMTP provider
3. Check spam folder
4. Wait a few minutes if rate limited
5. Try a different email address

### Issue: "Rate limit" error

**Fix:**
- Free tier Supabase has email sending limits
- Wait 5-10 minutes between attempts
- Upgrade to paid plan for higher limits
- Configure custom SMTP to bypass limits

### Issue: Email link doesn't work

**Fix:**
- Add redirect URL to Supabase: **Auth** → **URL Configuration** → **Redirect URLs**
- Ensure `/auth/callback` route exists in your app

## Step 5: Test Email Configuration

Run this in browser console after signing up:

```javascript
// Check if Supabase is configured
fetch('/api/test-email')
  .then(r => r.json())
  .then(console.log)
```

## Step 6: Quick Fix for Development

If you just need to test without emails:

1. Go to: **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** OFF
3. Users can sign up without verification
4. **Remember to turn it back ON for production!**

## Still Not Working?

1. Check Supabase status: https://status.supabase.com
2. Verify your Supabase project is active (not paused)
3. Check if you're on free tier (has email limits)
4. Try configuring custom SMTP (Gmail, SendGrid, etc.)
5. Contact Supabase support with error logs

## Most Common Issue

**90% of email issues are:**
- Email confirmation is **DISABLED** in Supabase
- OR emails are going to **SPAM folder**

**Quick check:**
1. Supabase Dashboard → Auth → Providers → Email
2. Is "Confirm email" toggle ON?
3. Check your spam folder!

