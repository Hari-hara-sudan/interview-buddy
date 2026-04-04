import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useInterviews } from "@/contexts/InterviewContext";
import InterviewCard from "@/components/InterviewCard";

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { interviews } = useInterviews();
  const navigate = useNavigate();

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {user?.displayName || "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prepare for your next interview with AI-powered practice
          </p>
        </div>

        <button
          onClick={() => navigate("/generate")}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Generate Interview
        </button>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <path d="M12 2a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No interviews yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Generate your first AI interview to get started
          </p>
          <button
            onClick={() => navigate("/generate")}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Generate Interview
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {interviews.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
