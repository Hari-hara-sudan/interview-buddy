import React from "react";
import { useNavigate } from "react-router-dom";
import { type Assessment } from "@/contexts/AssessmentContext";
import { cn } from "@/lib/utils";

interface AssessmentCardProps {
  assessment: Assessment;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment }) => {
  const navigate = useNavigate();
  const overallScore = Math.round(
    (assessment.scores.aptitude + assessment.scores.programming + assessment.scores.verbal) / 3
  );

  const createdDate = assessment.createdAt?.toDate?.()
    ? new Date(assessment.createdAt.toDate()).toLocaleDateString()
    : new Date().toLocaleDateString();

  const handleViewDetails = () => {
    navigate("/resume-assessment", { 
      state: { assessmentId: assessment.id, assessment } 
    });
  };

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-50";
    if (score >= 60) return "bg-blue-50";
    if (score >= 40) return "bg-yellow-50";
    return "bg-red-50";
  };

  return (
    <div
      className={cn(
        "group relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col gap-3"
      )}
      onClick={handleViewDetails}
    >
      {/* Top row: type badge + overall score */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
          Resume Assessment
        </span>
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm",
          getScoreBg(overallScore),
          getScoreColor(overallScore)
        )}>
          {overallScore}%
        </div>
      </div>

      {/* Candidate name */}
      <h3 className="text-base font-bold text-gray-900 leading-tight">
        {assessment.parsedResume.name}
      </h3>

      {/* Skills preview */}
      <div>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Skills</p>
        <div className="flex flex-wrap gap-1">
          {assessment.parsedResume.skills.slice(0, 4).map((skill, i) => (
            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full border border-blue-100">
              {skill}
            </span>
          ))}
          {assessment.parsedResume.skills.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
              +{assessment.parsedResume.skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Score breakdown grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Aptitude", score: assessment.scores.aptitude, icon: "🧠" },
          { label: "Programming", score: assessment.scores.programming, icon: "💻" },
          { label: "Verbal", score: assessment.scores.verbal, icon: "📝" },
        ].map(({ label, score, icon }) => (
          <div key={label} className="text-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-lg mb-0.5">{icon}</p>
            <p className={cn("text-sm font-bold", getScoreColor(score))}>
              {score}%
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5 capitalize">{label}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* Metadata & Date */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Taken On</p>
          <p className="text-xs text-gray-600 font-medium">{createdDate}</p>
        </div>
        <button
          onClick={handleViewDetails}
          className="btn-gradient px-3 py-1.5 rounded-lg text-xs font-semibold"
        >
          View →
        </button>
      </div>
    </div>
  );
};

export default AssessmentCard;
