import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  signInWithPopup,
  linkWithPopup,
  unlink,
  GithubAuthProvider,
  linkWithCredential,
  GoogleAuthProvider,
  OAuthProvider
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";

interface SocialProfile {
  github?: {
    username: string;
    profileUrl: string;
    accessToken?: string;
    repos?: Array<{
      id: number;
      name: string;
      description: string;
      url: string;
      language: string;
      stars: number;
      lastUpdated: string;
    }>;
  };
  linkedin?: {
    id?: string;
    profileUrl: string;
    accessToken?: string;
    displayName?: string;
    email?: string;
  };
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  resumeLink?: string;
  socialProfiles?: SocialProfile;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, resumeLink?: string) => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  refreshGitHubRepos: () => Promise<void>;
  disconnectGitHub: () => Promise<void>;
  disconnectLinkedIn: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => { },
  signup: async () => { },
  loginWithGitHub: async () => { },
  loginWithLinkedIn: async () => { },
  refreshGitHubRepos: async () => { },
  disconnectGitHub: async () => { },  disconnectLinkedIn: async () => { },  logout: () => { },
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, name: string, resumeLink?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    // Save additional fields
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name,
      email,
      resumeLink: resumeLink || "",
      socialProfiles: {},
      createdAt: new Date().toISOString(),
    });
  };

  const loginWithGitHub = async () => {
    const provider = new GithubAuthProvider();
    provider.addScope('user:email');
    provider.addScope('read:user');
    provider.addScope('public_repo');
    
    try {
      let result: any;
      
      // If user is already logged in, link the provider instead of signing in
      if (auth.currentUser) {
        result = await linkWithPopup(auth.currentUser, provider);
      } else {
        result = await signInWithPopup(auth, provider);
      }
      
      // Save GitHub profile info to Firestore
      if (result.user) {
        const userRef = doc(db, "users", result.user.uid);
        const userSnap = await getDoc(userRef);
        
        const socialProfiles = userSnap.exists() ? (userSnap.data().socialProfiles || {}) : {};
        
        // Get GitHub access token from OAuth credential
        const credential = GithubAuthProvider.credentialFromResult(result);
        let accessToken = credential?.accessToken;
        
        // Fallback: Try to get token from OAuth provider if credentialFromResult fails
        if (!accessToken && result.credential && (result.credential as any).accessToken) {
          accessToken = (result.credential as any).accessToken;
        }
        
        // Last resort: Check if provider data has AccessToken
        if (!accessToken && result.user.providerData?.length > 0) {
          const githubProvider = result.user.providerData.find((p: any) => p.providerId === 'github.com');
          if (githubProvider && (githubProvider as any).accessToken) {
            accessToken = (githubProvider as any).accessToken;
          }
        }
        
        console.log('GitHub Auth Result:', { hasAccessToken: !!accessToken, displayName: result.user.displayName, credentialExists: !!credential });
        
        if (!accessToken) {
          throw new Error('Failed to retrieve GitHub access token. Please try again.');
        }
        
        // Fetch GitHub repos using correct token format
        let repos: any[] = [];
        let githubUsername = '';
        
        if (accessToken) {
          // FIRST: Get authenticated user's actual GitHub username from API
          let userResponse = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `token ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            githubUsername = userData.login;
            console.log('Got authenticated GitHub username:', githubUsername);
            
            // SECOND: Fetch repos with correct username (no type=owner filter)
            const reposResponse = await fetch(
              `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`,
              {
                headers: {
                  'Authorization': `token ${accessToken}`,
                  'Accept': 'application/vnd.github.v3+json'
                }
              }
            );
            
            if (reposResponse.ok) {
              const reposData = await reposResponse.json();
              console.log('Fetched repos from API:', reposData.length);
              
              repos = reposData
                .filter((repo: any) => !repo.fork) // Exclude forked repos
                .map((repo: any) => ({
                  id: repo.id,
                  name: repo.name,
                  description: repo.description || '',
                  url: repo.html_url,
                  language: repo.language || 'N/A',
                  stars: repo.stargazers_count,
                  lastUpdated: repo.updated_at
                }))
                .slice(0, 10); // Show up to 10 repos
              
              console.log('Processed repos:', repos.length);
            } else {
              console.error('GitHub repos API error:', reposResponse.status, reposResponse.statusText);
            }
          } else {
            console.error('Failed to get GitHub user info:', userResponse.status, userResponse.statusText);
          }
        } else {
          console.warn('No GitHub access token available after all attempts');
          throw new Error('No GitHub access token available');
        }
        
        // Only save if we have a valid username
        if (!githubUsername) {
          throw new Error('Failed to retrieve GitHub username. Please try again.');
        }
        
        // Merge GitHub profile with existing data
        await setDoc(userRef, {
          name: result.user.displayName || 'User',
          email: result.user.email || '',
          photoURL: result.user.photoURL || '',
          socialProfiles: {
            ...socialProfiles,
            github: {
              username: githubUsername,
              profileUrl: `https://github.com/${githubUsername}`,
              accessToken: accessToken,
              repos: repos
            }
          },
          ...(userSnap.exists() ? {} : { createdAt: new Date().toISOString() })
        }, { merge: true });
        
        // Refresh user in context
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists()) {
          const data = updatedDoc.data();
          setUser({
            uid: result.user.uid,
            email: result.user.email || "",
            displayName: result.user.displayName || "",
            photoURL: result.user.photoURL || undefined,
            resumeLink: data.resumeLink || "",
            socialProfiles: data.socialProfiles || {},
          });
        }
      }
    } catch (error) {
      const firebaseError = error as FirebaseError;
      
      // Handle popup blocked
      if (firebaseError.code === 'auth/popup-blocked' || firebaseError.message?.includes('popup')) {
        throw new Error('Popup blocked. Please enable popups for this site and try again.');
      }
      
      // Handle credential already in use (GitHub connected to another account)
      if (firebaseError.code === 'auth/credential-already-in-use') {
        throw new Error(
          'This GitHub account is already connected to another profile. ' +
          'Please disconnect any existing GitHub connections first, or sign in with the account where GitHub is connected.'
        );
      }
      
      throw new Error(firebaseError.message || 'Failed to connect GitHub');
    }
  };

  const loginWithLinkedIn = async () => {
    try {
      // LinkedIn OAuth parameters
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      const rawRedirectUri = import.meta.env.VITE_LINKEDIN_REDIRECT_URI || (window.location.origin + '/auth/linkedin/callback');
      
      console.log('🔐 LinkedIn OAuth Starting:');
      console.log('- Client ID:', clientId ? '✓' : '✗ MISSING');
      console.log('- Redirect URI:', rawRedirectUri);
      
      if (!clientId) {
        throw new Error('LinkedIn Client ID not configured. Add VITE_LINKEDIN_CLIENT_ID to .env');
      }
      
      // LinkedIn OAuth 2.0 scopes: openid, profile, email
      // Must be space-separated and URL-encoded properly
      const state = Math.random().toString(36).substring(7);

      // Store state in sessionStorage for verification
      sessionStorage.setItem('linkedin_oauth_state', state);

      // Build the URL manually to ensure proper encoding
      // LinkedIn scopes: profile, email (openid may not be available in all apps)
      const linkedInAuthUrl = 
        `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(rawRedirectUri)}&` +
        `scope=${encodeURIComponent('profile email')}&` +
        `state=${encodeURIComponent(state)}`;
      
      console.log('📍 LinkedIn Authorization URL:');
      console.log(linkedInAuthUrl.substring(0, 100) + '...');
      console.log('- Scopes: profile email');

      // Open LinkedIn auth in popup
      const popup = window.open(linkedInAuthUrl, 'LinkedIn Login', 'width=500,height=700');
      
      if (!popup) {
        throw new Error('Popup blocked. Please enable popups for this site.');
      }

      console.log('✅ LinkedIn OAuth pop-up opened');

      // Create a promise-based approach to handle the entire flow
      const authPromise = new Promise<any>((resolve, reject) => {
        let timeoutId: NodeJS.Timeout;
        
        // Set timeout for the entire OAuth flow
        timeoutId = setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          reject(new Error('LinkedIn login timeout. Please try again.'));
        }, 60000); // 60 second timeout

        // Listen for message from callback window
        const handleMessage = async (event: MessageEvent) => {
          // Verify origin for security
          if (event.origin !== window.location.origin) return;

          try {
            if (event.data.type === 'linkedin_auth_code') {
              clearTimeout(timeoutId);
              window.removeEventListener('message', handleMessage);
              popup?.close();

              const { code } = event.data;

              // Exchange authorization code for access token via backend
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
              
              console.log('🔗 Using backend URL:', backendUrl);
              console.log('📤 Exchanging LinkedIn authorization code...');
              
              const tokenResponse = await fetch(`${backendUrl}/api/auth/linkedin/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  code, 
                  clientId,
                  redirectUri: import.meta.env.VITE_LINKEDIN_REDIRECT_URI 
                })
              });

              console.log('📥 Backend response status:', tokenResponse.status, tokenResponse.statusText);

              if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json().catch(() => ({ error: 'Token exchange failed' }));
                console.error('❌ Token exchange error:', tokenResponse.status, errorData);
                
                // If there's debug info from backend about LinkedIn, show it
                let errorMsg = errorData.error || 'Token exchange failed';
                if (errorData.debug) {
                  console.error('   LinkedIn API Debug:', errorData.debug);
                  errorMsg += ` - ${errorData.debug.hint || errorData.debug.message}`;
                }
                if (errorData.details) {
                  console.error('   Details:', errorData.details);
                  errorMsg += ` (${errorData.details})`;
                }
                
                throw new Error(errorMsg);
              }

              const responseJson = await tokenResponse.json();
              console.log('✅ Got response from backend');
              
              const { access_token, profile } = responseJson;

              if (!access_token) {
                console.error('❌ No access token in response:', responseJson);
                throw new Error('No access token received from LinkedIn');
              }

              if (!profile) {
                console.error('❌ No profile in response:', responseJson);
                throw new Error('No profile data received from LinkedIn');
              }

              console.log('✅ LinkedIn OAuth Success - User:', profile.name);
              resolve({ access_token, profile });

            } else if (event.data.type === 'linkedin_auth_error') {
              clearTimeout(timeoutId);
              window.removeEventListener('message', handleMessage);
              popup?.close();
              reject(new Error(event.data.error || 'LinkedIn authentication failed'));
            }
          } catch (error) {
            clearTimeout(timeoutId);
            window.removeEventListener('message', handleMessage);
            reject(error);
          }
        };

        window.addEventListener('message', handleMessage);
      });

      // Wait for OAuth to complete
      const { access_token, profile } = await authPromise;

      // Check if user exists in Firestore
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        // Create user record for LinkedIn login only
        const userRef = doc(db, 'users', `linkedin_${profile.id}`);
        await setDoc(userRef, {
          name: profile.name,
          email: profile.email,
          photoURL: profile.profilePicture || '',
          socialProfiles: {
            linkedin: {
              id: profile.id,
              profileUrl: profile.profileUrl,
              accessToken: access_token,
              displayName: profile.name,
              email: profile.email
            }
          },
          createdAt: new Date().toISOString(),
          authMethod: 'linkedin'
        });

        // Set user in context
        setUser({
          uid: `linkedin_${profile.id}`,
          email: profile.email,
          displayName: profile.name,
          photoURL: profile.profilePicture || '',
          socialProfiles: {
            linkedin: {
              id: profile.id,
              profileUrl: profile.profileUrl,
              accessToken: access_token,
              displayName: profile.name,
              email: profile.email
            }
          }
        });
      } else {
        // User already logged in with Firebase, link LinkedIn profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const socialProfiles = userSnap.exists() ? (userSnap.data().socialProfiles || {}) : {};

        await setDoc(userRef, {
          socialProfiles: {
            ...socialProfiles,
            linkedin: {
              id: profile.id,
              profileUrl: profile.profileUrl,
              accessToken: access_token,
              displayName: profile.name,
              email: profile.email
            }
          }
        }, { merge: true });

        // Refresh user in context
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists()) {
          const data = updatedDoc.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || undefined,
            resumeLink: data.resumeLink || "",
            socialProfiles: data.socialProfiles || {},
          });
        }
      }
    } catch (error) {
      console.error('❌ LinkedIn login error:', error);
      throw new Error(error instanceof Error ? error.message : 'LinkedIn login failed');
    }
  };

  const refreshGitHubRepos = async () => {
    if (!auth.currentUser || !user?.socialProfiles?.github) {
      throw new Error('GitHub not connected');
    }

    try {
      if (!user.socialProfiles.github.username) {
        throw new Error('GitHub username not found. Please disconnect and reconnect GitHub.');
      }

      let accessToken = user.socialProfiles.github.accessToken;
      let githubUsername = user.socialProfiles.github.username;

      if (!accessToken) {
        // Try to fetch from Firestore directly as fallback
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        accessToken = userDoc.data()?.socialProfiles?.github?.accessToken;
        
        if (!accessToken) {
          throw new Error('No GitHub access token found. Please reconnect GitHub.');
        }
        
        console.log('Retrieved access token from Firestore as fallback');
      }

      // Get latest user data (in case username changed)
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        githubUsername = userData.login;
      }

      // Fetch repos (no type=owner filter to get all repos)
      const reposResponse = await fetch(
        `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`,
        {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!reposResponse.ok) {
        throw new Error(`Failed to fetch repos: ${reposResponse.statusText}`);
      }

      const reposData = await reposResponse.json();
      const repos = reposData
        .filter((repo: any) => !repo.fork)
        .map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description || '',
          url: repo.html_url,
          language: repo.language || 'N/A',
          stars: repo.stargazers_count,
          lastUpdated: repo.updated_at
        }))
        .slice(0, 10);

      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(
        userRef,
        {
          socialProfiles: {
            github: {
              ...user.socialProfiles.github,
              repos: repos
            }
          }
        },
        { merge: true }
      );

      // Update context
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        const data = updatedDoc.data();
        setUser({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || '',
          displayName: auth.currentUser.displayName || '',
          photoURL: auth.currentUser.photoURL || undefined,
          resumeLink: data.resumeLink || '',
          socialProfiles: data.socialProfiles || {}
        });
      }

      console.log('GitHub repos refreshed:', repos.length);
    } catch (error) {
      console.error('Failed to refresh GitHub repos:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to refresh repos');
    }
  };

  const disconnectGitHub = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }
      await unlink(auth.currentUser, 'github.com');
      console.log('GitHub provider unlinked from Firebase');
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(
        userRef,
        {
          socialProfiles: {
            github: null
          }
        },
        { merge: true }
      );
      console.log('GitHub data removed from Firestore');
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        const data = updatedDoc.data();
        setUser({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || "",
          displayName: auth.currentUser.displayName || "",
          photoURL: auth.currentUser.photoURL || undefined,
          resumeLink: data.resumeLink || "",
          socialProfiles: data.socialProfiles || {},
        });
      }
      console.log('GitHub disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to disconnect GitHub');
    }
  };

  const disconnectLinkedIn = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }
      
      // Remove LinkedIn profile from Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(
        userRef,
        {
          socialProfiles: {
            linkedin: null
          }
        },
        { merge: true }
      );
      console.log('LinkedIn data removed from Firestore');
      
      // Update user in context
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        const data = updatedDoc.data();
        setUser({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || "",
          displayName: auth.currentUser.displayName || "",
          photoURL: auth.currentUser.photoURL || undefined,
          resumeLink: data.resumeLink || "",
          socialProfiles: data.socialProfiles || {},
        });
      }
      console.log('LinkedIn disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect LinkedIn:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to disconnect LinkedIn');
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userDocData: any = {};
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            userDocData = userDoc.data();
          }
        } catch (e) {
          console.error("Failed to fetch user record", e);
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || undefined,
          resumeLink: userDocData.resumeLink || "",
          socialProfiles: userDocData.socialProfiles || {},
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, loginWithGitHub, loginWithLinkedIn, refreshGitHubRepos, disconnectGitHub, disconnectLinkedIn, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
