import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useInterviews } from "@/contexts/InterviewContext";
import { useAssessments } from "@/contexts/AssessmentContext";
import InterviewCard from "@/components/InterviewCard";
import AssessmentCard from "@/components/AssessmentCard";
import JobMarketStats from "@/components/JobMarketStats";

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { interviews } = useInterviews();
  const { assessments } = useAssessments();
  const navigate = useNavigate();

  const totalItems = interviews.length + assessments.length;
  const hasNoData = totalItems === 0;

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome,{" "}
            <span className="animated-gradient-text">
              {user?.displayName || "there"} 👋
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prepare for your next interview with AI-powered practice
          </p>
        </div>

        <button
          onClick={() => navigate("/generate")}
          className="btn-gradient px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Generate Interview
        </button>
      </div>

      {/* Job Market Stats Section */}
      <JobMarketStats />

      {hasNoData ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <path d="M12 2a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Get Started</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first interview or take a resume assessment
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/generate")}
              className="btn-gradient px-5 py-2.5 rounded-lg text-sm"
            >
              Generate Interview
            </button>
            <button
              onClick={() => navigate("/resume-assessment")}
              className="px-5 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-all"
            >
              Resume Assessment
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Section headers with dividers */}
          {interviews.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-foreground">Your Interviews</h2>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-200">
                  {interviews.length}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mb-8">
                {interviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            </>
          )}

          {assessments.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-4 mt-8 pt-4 border-t border-gray-200">
                <h2 className="text-lg font-bold text-foreground">Resume Assessments</h2>
                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-200">
                  {assessments.length}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {assessments.map((assessment) => (
                  <AssessmentCard key={assessment.id} assessment={assessment} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
