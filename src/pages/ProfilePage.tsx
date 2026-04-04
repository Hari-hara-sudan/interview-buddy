import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInterviews } from "@/contexts/InterviewContext";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { interviews } = useInterviews();

  const completedCount = interviews.filter((i) => i.completed).length;
  const avgScore = completedCount > 0
    ? Math.round(interviews.filter(i => i.feedback).reduce((sum, i) => sum + (i.feedback?.score || 0), 0) / completedCount)
    : 0;

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-8">Profile</h1>

      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {user?.displayName?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">{user?.displayName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 text-center">
          <div className="text-3xl font-bold text-foreground">{interviews.length}</div>
          <p className="text-sm text-muted-foreground mt-1">Total Interviews</p>
        </div>
        <div className="rounded-xl border bg-card p-5 text-center">
          <div className="text-3xl font-bold text-foreground">{completedCount}</div>
          <p className="text-sm text-muted-foreground mt-1">Completed</p>
        </div>
        <div className="rounded-xl border bg-card p-5 text-center">
          <div className="text-3xl font-bold text-primary">{avgScore || "—"}</div>
          <p className="text-sm text-muted-foreground mt-1">Avg Score</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
