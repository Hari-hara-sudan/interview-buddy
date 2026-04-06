import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInterviews, type Interview } from "@/contexts/InterviewContext";
import { cn } from "@/lib/utils";

interface InterviewCardProps {
  interview: Interview;
}

const InterviewCard: React.FC<InterviewCardProps> = ({ interview }) => {
  const navigate = useNavigate();
  const { deleteInterview } = useInterviews();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this interview?")) {
      try {
        setIsDeleting(true);
        await deleteInterview(interview.id);
      } catch {
        setIsDeleting(false);
      }
    }
  };

  const handleAction = () => {
    if (interview.completed) {
      navigate(`/feedback/${interview.id}`);
    } else {
      navigate(`/interview/${interview.id}`);
    }
  };

  const typeLabel = interview.interviewType?.replace("-", " ") || "Mixed";

  return (
    <div
      className={cn(
        "group relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col gap-3",
        isDeleting && "opacity-50 pointer-events-none"
      )}
      onClick={handleAction}
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-150"
        title="Delete"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>

      {/* Top row: type badge + status dot */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          {typeLabel}
        </span>
        <span className={cn(
          "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
          interview.completed
            ? "bg-green-50 text-green-600 border border-green-200"
            : "bg-blue-50 text-blue-600 border border-blue-200"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", interview.completed ? "bg-green-500" : "bg-blue-500")} />
          {interview.completed ? "Completed" : "Pending"}
        </span>
      </div>

      {/* Role title */}
      <h3 className="text-base font-bold text-gray-900 capitalize leading-tight">
        {interview.role}
      </h3>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {[
          { label: "Tech Stack", value: interview.techStack },
          { label: "Experience", value: interview.experienceLevel },
          { label: "Questions", value: `${interview.questions?.length ?? 0}` },
          { label: "Type", value: typeLabel },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
            <p className="text-xs text-gray-700 font-medium capitalize truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* Action button */}
      <button
        onClick={handleAction}
        className="w-full btn-gradient py-2 rounded-xl text-xs font-semibold"
      >
        {interview.completed ? "View Feedback →" : "Attend Interview →"}
      </button>
    </div>
  );
};

export default InterviewCard;
