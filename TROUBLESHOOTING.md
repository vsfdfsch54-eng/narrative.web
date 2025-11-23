# Troubleshooting: Invalid API Key Error

## Quick Fix Checklist

### ✅ Step 1: Verify API Key is Valid
Your API key is **valid** (tested and working). The issue is likely that Next.js hasn't loaded it.

### ✅ Step 2: Check .env.local Format
Make sure your `.env.local` file has:
```
OPENAI_API_KEY=sk-proj-...
```
- **NO spaces** around the `=` sign
- **NO quotes** around the value
- **NO trailing spaces** at the end of the line

### ✅ Step 3: Restart Dev Server
**This is the most common fix:**

1. **Stop your dev server completely:**
   ```bash
   # Press Ctrl+C in the terminal running npm run dev
   ```

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Check the terminal output:**
   - You should see: `[OpenAI Service] ✅ OpenAI client initialized (key length: XXX)`
   - If you see an error about missing key, the `.env.local` file isn't being read

### ✅ Step 4: Verify Environment Variable is Loaded
After restarting, when you complete onboarding, check the terminal logs:
- Look for: `[Personality Generate] OPENAI_API_KEY available: true`
- If it says `false`, the key isn't being loaded

### ✅ Step 5: Check File Location
Make sure `.env.local` is in the **project root** (same directory as `package.json`):
```
narrative/
  ├── .env.local          ← Should be here
  ├── package.json
  ├── next.config.js
  └── ...
```

### ✅ Step 6: If Still Not Working
1. **Check for typos:**
   - Variable name must be exactly: `OPENAI_API_KEY`
   - Not: `OPENAI_KEY`, `OPEN_AI_API_KEY`, etc.

2. **Try adding to next.config.js:**
   ```js
   // This shouldn't be necessary, but can help
   module.exports = {
     env: {
       OPENAI_API_KEY: process.env.OPENAI_API_KEY,
     },
   }
   ```

3. **Check if .env.local is in .gitignore:**
   - It should be (to keep your key secret)
   - But make sure the file exists locally

## Testing Your API Key

To manually test if your key works:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $(grep OPENAI_API_KEY .env.local | cut -d= -f2)"
```

If you get a list of models → Key is valid ✅
If you get 401 Unauthorized → Key is invalid ❌

## Common Issues

### Issue: "OPENAI_API_KEY environment variable is not set"
**Solution:** Restart dev server after adding to `.env.local`

### Issue: "Invalid API key" from OpenAI
**Solution:** 
1. Check key is valid at https://platform.openai.com/api-keys
2. Create new key if expired/revoked
3. Update `.env.local` with new key
4. Restart dev server

### Issue: Key works in terminal but not in Next.js
**Solution:** 
1. Make sure `.env.local` is in project root
2. Restart dev server
3. Check for spaces/quotes in `.env.local`

## Still Having Issues?

Check the terminal output when you try onboarding:
- Look for `[OpenAI Service]` logs
- Look for `[Personality Generate]` logs
- Share the error message you see

