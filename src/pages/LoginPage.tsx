import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resumeLink, setResumeLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'github' | 'linkedin' | null>(null);
  const [error, setError] = useState("");
  const { login, signup, loginWithGitHub, loginWithLinkedIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password, name, resumeLink);
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setError("");
    setOauthLoading("github");
    try {
      await loginWithGitHub();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "GitHub login failed");
    } finally {
      setOauthLoading(null);
    }
  };

  const handleLinkedInLogin = async () => {
    setError("");
    setOauthLoading("linkedin");
    try {
      await loginWithLinkedIn();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "LinkedIn login failed");
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-secondary/20 px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 blur-3xl rounded-full opacity-50 block pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-3xl rounded-full opacity-50 block pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 ring-1 ring-primary/20">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vox Mentor</h1>
          <p className="text-sm text-muted-foreground mt-2">
            AI-powered voice interview preparation
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-card-foreground mb-6 text-center">
            {isSignup ? "Create an account" : "Welcome back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="animate-fade-in">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                placeholder="you@example.com"
                required
              />
            </div>

            {isSignup && (
              <div className="animate-fade-in">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Resume Link (Optional)</label>
                <input
                  type="url"
                  value={resumeLink}
                  onChange={(e) => setResumeLink(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                  placeholder="https://linkedin.com/in/or/portfolio"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Link your resume or LinkedIn to generate more personalized questions later.
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-6 btn-gradient rounded-xl text-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : isSignup ? (
                "Sign up"
              ) : (
                "Sign in"
              )}
            </button>

            {/* OAuth Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground font-medium">Or continue with</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGitHubLogin}
                disabled={oauthLoading === 'github'}
                className="h-10 flex items-center justify-center gap-2 rounded-xl border border-input bg-background/50 hover:bg-background text-foreground text-sm font-medium transition-all disabled:opacity-50"
              >
                {oauthLoading === 'github' ? (
                  <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLinkedInLogin}
                disabled={oauthLoading === 'linkedin'}
                className="h-10 flex items-center justify-center gap-2 rounded-xl border border-input bg-background/50 hover:bg-background text-foreground text-sm font-medium transition-all disabled:opacity-50"
              >
                {oauthLoading === 'linkedin' ? (
                  <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.047-8.733 0-9.652h3.554v1.366c.43-.664 1.199-1.608 2.918-1.608 2.135 0 3.755 1.395 3.755 4.397v5.497zM5.337 8.855c-1.144 0-1.915-.758-1.915-1.708 0-.951.77-1.708 1.915-1.708 1.144 0 1.915.757 1.915 1.708 0 .95-.771 1.708-1.915 1.708zm1.595 11.597H3.762V9.558h3.17v10.894zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                    </svg>
                    LinkedIn
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}
          </form>

          <div className="mt-6 flex items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-gradient font-semibold hover:opacity-80 hover:underline transition-all"
              >
                {isSignup ? "Sign in" : "Create one now"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
