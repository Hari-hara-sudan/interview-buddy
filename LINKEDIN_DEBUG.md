# LinkedIn OAuth Debugging Guide

## Current Status ✅
- Backend server: **RUNNING** on http://localhost:3001
- Environment variables: **CONFIGURED**
- Client ID: ✓ Found
- Client Secret: ✓ Found

---

## Testing LinkedIn Connection

### Step 1: Check Backend is Running
Open a new terminal and run:
```bash
node linkedin-backend.js
```

You should see:
```
🚀 LinkedIn OAuth backend running on http://localhost:3001
```

### Step 2: Verify Backend Health
Open browser and visit:
```
http://localhost:3001/health
```

Should show:
```json
{"status":"ok","message":"LinkedIn OAuth backend is running"}
```

### Step 3: Debug Console Logs
When attempting to connect LinkedIn via ProfilePage:

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Click "Connect" button for LinkedIn**

You should see logs like:
```
🔗 Using backend URL: http://localhost:3001
📤 Exchanging LinkedIn authorization code...
📥 Backend response status: 200 OK
✅ Got response from backend
✅ LinkedIn OAuth Success - User: [Your Name]
```

### Step 4: Troubleshooting

#### Problem: "Failed to exchange authorization code"
- Check backend logs for error messages starting with `❌`
- Then check if REDIRECT_URI matches your app's registered URI at LinkedIn

#### Problem: No backend logs when clicking Connect
- Backend might not be running - restart it
- Or frontend might not be connecting to `http://localhost:3001`

#### Problem: "No profile data received"
- LinkedIn API might be failing
- Check: https://api.linkedin.com/v2/me with Bearer token

---

## Configuration Check

### .env Variables (should have all these):
```
VITE_LINKEDIN_CLIENT_ID=866vvzh6a59f2l
VITE_BACKEND_URL=http://localhost:3001
VITE_LINKEDIN_REDIRECT_URI=http://localhost:8080/auth/linkedin/callback
LINKEDIN_CLIENT_SECRET=WPL_AP1.X...
```

### LinkedIn App Registration
- Login to: https://www.linkedin.com/developers/apps
- Ensure these Redirect URIs are configured:
  - `http://localhost:8080/auth/linkedin/callback` (for dev)
  - Your production URL (for prod)

---

## Quick Test Checklist
- [ ] Backend running: `node linkedin-backend.js`
- [ ] Backend health check returns ok
- [ ] Browser DevTools shows "🔗 Using backend URL: http://localhost:3001"
- [ ] LinkedIn OAuth popup opens
- [ ] Browser DevTools shows "✅ LinkedIn OAuth Success"
- [ ] Profile data appears in Firestore

---

## Detailed Flow

1. **User clicks "Connect" on LinkedIn card** → ProfilePage.handleConnectLinkedin()
2. **Frontend makes OAuth request** → LinkedIn auth popup opens
3. **User authorizes app** → Redirects to /auth/linkedin/callback
4. **LinkedInCallbackPage extracts code** → Sends to main window via postMessage
5. **Frontend exchanges code for token** → POST to http://localhost:3001/api/auth/linkedin/token
6. **Backend securely exchanges** → Using Client Secret (kept on backend only)
7. **Backend fetches profile** → GET https://api.linkedin.com/v2/me
8. **Frontend gets access_token + profile** → Saves to Firestore
9. **Profile appears on ProfilePage** ✅

---

## Still Having Issues?

Check browser console for detailed error messages (with 📥 🔗 ✅ ❌ emoji prefixes).
Each error should explain exactly what failed and at which step.
