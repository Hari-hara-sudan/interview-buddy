import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Interview } from "@/contexts/InterviewContext";

interface InterviewCardProps {
  interview: Interview;
}

const InterviewCard: React.FC<InterviewCardProps> = ({ interview }) => {
  const navigate = useNavigate();

  const levelColors = {
    entry: "bg-success/10 text-success",
    mid: "bg-primary/10 text-primary",
    senior: "bg-accent text-accent-foreground",
  };

  return (
    <div className="group rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-md hover:border-primary/30 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-card-foreground">{interview.role}</h3>
          <p className="text-sm text-muted-foreground mt-1">{interview.techStack}</p>
        </div>
        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full capitalize", levelColors[interview.experienceLevel])}>
          {interview.experienceLevel}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {interview.questions.length} questions • {new Date(interview.createdAt).toLocaleDateString()}
        </span>

        {interview.completed ? (
          <button
            onClick={() => navigate(`/feedback/${interview.id}`)}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View Feedback →
          </button>
        ) : (
          <button
            onClick={() => navigate(`/interview/${interview.id}`)}
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Attend Interview
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewCard;
