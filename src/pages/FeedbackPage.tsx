import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInterviews } from "@/contexts/InterviewContext";
import { cn } from "@/lib/utils";

const FeedbackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInterview } = useInterviews();
  const interview = getInterview(id || "");

  if (!interview || !interview.feedback) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">No feedback available.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Go Home
        </button>
      </div>
    );
  }

  const { feedback } = interview;
  const scoreColor = feedback.score >= 80 ? "text-success" : feedback.score >= 60 ? "text-primary" : "text-destructive";

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-foreground">Interview Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {interview.role} • {interview.techStack} • <span className="capitalize">{interview.interviewType?.replace("-", " ") || "Mixed"}</span>
        </p>
      </div>

      {/* Score */}
      <div className="text-center mb-10">
        <div className={cn("text-6xl font-bold", scoreColor)}>{feedback.score}</div>
        <p className="text-sm text-muted-foreground mt-2">Overall Score</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <h2 className="font-semibold text-card-foreground mb-2">Summary</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{feedback.summary}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Strengths */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            Strengths
          </h2>
          <ul className="space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Areas to Improve
          </h2>
          <ul className="space-y-2">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center mt-10">
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default FeedbackPage;
