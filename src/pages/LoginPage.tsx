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
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password, name, resumeLink);
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch {
      // Handle error
    } finally {
      setLoading(false);
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
              className="w-full h-11 mt-6 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md shadow-primary/20"
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
          </form>

          <div className="mt-6 flex items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-primary hover:text-primary/80 font-semibold hover:underline transition-all"
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
