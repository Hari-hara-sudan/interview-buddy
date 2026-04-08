/**
 * IMPORTANT: LinkedIn OAuth Token Exchange Backend
 * 
 * This is a simple Node.js/Express backend to handle LinkedIn OAuth token exchange.
 * The authorization code exchange MUST happen on your backend (not frontend) to keep
 * your LinkedIn Client Secret secure.
 * 
 * Setup:
 * 1. npm install express cors dotenv
 * 2. Add to .env: LINKEDIN_CLIENT_SECRET=your_secret_here
 * 3. Run: node linkedin-backend.js
 * 4. Update VITE_BACKEND_URL in .env to http://localhost:3001
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(express.json());
app.use(cors());

const LINKEDIN_CLIENT_ID = process.env.VITE_LINKEDIN_CLIENT_ID || '866vvzh6a59f2l';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

console.log('🔍 Environment Check:');
console.log('- LINKEDIN_CLIENT_ID:', LINKEDIN_CLIENT_ID ? '✓ Found' : '✗ Missing');
console.log('- LINKEDIN_CLIENT_SECRET:', LINKEDIN_CLIENT_SECRET ? '✓ Found' : '✗ Missing');

if (!LINKEDIN_CLIENT_SECRET) {
  console.error('\n❌ ERROR: LINKEDIN_CLIENT_SECRET not found in .env');
  console.error('Get your Client Secret from: https://www.linkedin.com/developers/apps');
  process.exit(1);
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LinkedIn OAuth backend is running' });
});

/**
 * POST /api/auth/linkedin/token
 * Exchanges authorization code for access token
 */
app.post('/api/auth/linkedin/token', async (req, res) => {
  try {
    const { code, redirectUri, clientId } = req.body;

    console.log('\n📝 LinkedIn Token Exchange Request:');
    console.log('- Code:', code?.substring(0, 20) + '...' || '✗ Missing');
    console.log('- Redirect URI:', redirectUri || 'using fallback');
    console.log('- Client ID:', clientId?.substring(0, 10) + '...' || 'using LINKEDIN_CLIENT_ID');

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const finalRedirectUri = redirectUri || 'http://localhost:8080/auth/linkedin/callback';
    const finalClientId = clientId || LINKEDIN_CLIENT_ID;

    console.log('🔐 Making token request to LinkedIn...');
    console.log('  - Code received:', code?.substring(0, 30) + '...');
    console.log('  - Final redirect_uri:', finalRedirectUri);
    console.log('  - Final client_id:', finalClientId?.substring(0, 10) + '...');

    // Build the request body
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: finalRedirectUri,
      client_id: finalClientId,
      client_secret: LINKEDIN_CLIENT_SECRET
    }).toString();

    console.log('📤 Request body (sanitized):', tokenBody.replace(LINKEDIN_CLIENT_SECRET, '***').replace(code, code.substring(0, 20) + '***'));

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody
    });

    const responseText = await tokenResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Response is not JSON:', responseText);
      return res.status(400).json({ error: 'Invalid response from LinkedIn', raw: responseText });
    }

    if (!tokenResponse.ok) {
      console.error('❌ LinkedIn Token Error (status', tokenResponse.status + '):', responseData);
      
      // Provide helpful error messages for common LinkedIn errors
      let helpfulError = responseData.error_description || responseData.error || JSON.stringify(responseData);
      
      if (responseData.error === 'invalid_grant') {
        helpfulError = 'Invalid authorization code (may have expired). Try connecting again.';
      } else if (responseData.error === 'invalid_redirect_uri') {
        helpfulError = `Invalid redirect_uri. Check LinkedIn app settings. Expected: ${finalRedirectUri}`;
      } else if (responseData.error === 'invalid_client_id') {
        helpfulError = 'Invalid Client ID. Check your VITE_LINKEDIN_CLIENT_ID in .env';
      } else if (responseData.error === 'invalid_client') {
        helpfulError = 'Invalid Client credentials. Check your LinkedIn OAuth app configuration.';
      }
      
      return res.status(400).json({ error: helpfulError, rawError: responseData.error });
    }

    console.log('✅ Token Exchange Success');
    const tokenData = responseData;
    const { access_token, expires_in } = tokenData;

    console.log('📌 Fetching LinkedIn Profile...');
    console.log('   Token:', access_token.substring(0, 20) + '...');
    
    // Get user profile with access token
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    });

    console.log('   Profile Response Status:', profileResponse.status);

    if (!profileResponse.ok) {
      const profileError = await profileResponse.text();
      console.error('❌ Profile Fetch Error:', profileResponse.status);
      console.error('   Response:', profileError);
      
      // Return detailed error for debugging
      return res.status(400).json({ 
        error: `Failed to fetch profile: ${profileResponse.status}`,
        details: profileError,
        debug: {
          status: profileResponse.status,
          message: profileError,
          hint: 'Make sure your LinkedIn app has "Sign in with LinkedIn" product enabled and proper scopes authorized'
        }
      });
    }

    const profile = await profileResponse.json();
    console.log('✅ Profile Fetched:', profile.id);

    // Get email address
    let email = '';
    try {
      const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      });

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        if (emailData.elements && emailData.elements[0]) {
          email = emailData.elements[0]['handle~']?.emailAddress || '';
          console.log('✅ Email Fetched:', email);
        }
      } else {
        console.warn('⚠️ Email fetch returned:', emailResponse.status);
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch email:', err.message);
    }

    console.log('✅ Returning success response');
    res.json({
      access_token,
      expires_in,
      profile: {
        id: profile.id,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        profilePicture: profile.profilePicture?.displayImage || '',
        profileUrl: `https://www.linkedin.com/in/${profile.id}`,
        email
      }
    });
  } catch (error) {
    console.error('❌ Backend Error:', error.message || error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 LinkedIn OAuth backend running on http://localhost:${PORT}`);
  console.log('Make sure VITE_BACKEND_URL=http://localhost:3001 is in your .env\n');
});
