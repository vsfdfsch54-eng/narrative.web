# Supabase Email Configuration Guide

If you're not receiving verification emails, follow these steps:

## 1. Check Supabase Email Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Ensure **"Confirm signup"** template is enabled
5. Check that email sending is configured

## 2. Configure Email Provider

Supabase uses one of these methods:

### Option A: Supabase Email Service (Default - Limited)
- Works out of the box but has rate limits
- Good for development/testing
- May go to spam folder

### Option B: Custom SMTP (Recommended for Production)
1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure your SMTP provider:
   - **Gmail**: Use App Password
   - **SendGrid**: Use API key
   - **Mailgun**: Use API credentials
   - **AWS SES**: Use AWS credentials
   - **Other**: Use standard SMTP settings

## 3. Add Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local dev)
   - `https://yourdomain.com/auth/callback` (for production)
   - `https://your-vercel-app.vercel.app/auth/callback` (if using Vercel)

## 4. Check Email Templates

1. Go to **Authentication** → **Email Templates**
2. Click on **"Confirm signup"** template
3. Ensure the template includes:
   - `{{ .ConfirmationURL }}` or `{{ .Token }}`
   - Proper redirect URL

## 5. Test Email Sending

1. Try signing up with a test email
2. Check browser console for errors
3. Check Supabase Dashboard → **Logs** → **Auth Logs** for email sending errors
4. Check your email spam folder

## 6. Common Issues

### Emails going to spam
- Add SPF/DKIM records to your domain
- Use a custom SMTP provider
- Verify your domain in Supabase

### No emails at all
- Check Supabase project is active
- Verify email sending is enabled
- Check rate limits (free tier has limits)
- Verify SMTP credentials if using custom SMTP

### Email link not working
- Verify redirect URLs are correct
- Check that `/auth/callback` route exists
- Ensure callback route handles verification properly

## 7. Quick Fix: Disable Email Confirmation (Development Only)

⚠️ **Only for development/testing:**

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to OFF
3. Users can sign up without email verification

**Note:** Re-enable this for production!

## 8. Debug Steps

1. Open browser console (F12)
2. Look for these logs:
   - "Attempting signup with email: ..."
   - "Signup response: ..."
   - "Email confirmation required: ..."
3. Check Supabase Dashboard → **Logs** → **Auth Logs**
4. Look for email sending errors

## Need Help?

If emails still aren't working:
1. Check Supabase status page
2. Verify your Supabase project is on a paid plan (free tier has email limits)
3. Contact Supabase support
4. Consider using a custom SMTP provider

