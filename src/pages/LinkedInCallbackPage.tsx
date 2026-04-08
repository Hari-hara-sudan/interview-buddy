import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function LinkedInCallbackPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      window.opener?.postMessage(
        {
          type: 'linkedin_auth_error',
          error: errorDescription || error
        },
        window.location.origin
      );
      window.close();
      return;
    }

    if (!code) {
      window.opener?.postMessage(
        {
          type: 'linkedin_auth_error',
          error: 'No authorization code received'
        },
        window.location.origin
      );
      window.close();
      return;
    }

    // Verify state
    const storedState = window.opener?.sessionStorage?.getItem('linkedin_oauth_state');
    if (state !== storedState) {
      window.opener?.postMessage(
        {
          type: 'linkedin_auth_error',
          error: 'State mismatch - possible CSRF attack'
        },
        window.location.origin
      );
      window.close();
      return;
    }

    // Send success callback with authorization code
    // The main window will handle the token exchange
    window.opener?.postMessage(
      {
        type: 'linkedin_auth_code',
        code: code,
        state: state
      },
      window.location.origin
    );

    // Close popup after sending code
    setTimeout(() => window.close(), 500);
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center w-full h-screen bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Connecting to LinkedIn...</p>
      </div>
    </div>
  );
}
