import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
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
    if (window.confirm("Are you sure you want to delete this interview?")) {
      try {
        setIsDeleting(true);
        await deleteInterview(interview.id);
      } catch (err) {
        console.error("Failed to delete", err);
        setIsDeleting(false);
      }
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (interview.completed) {
      navigate(`/feedback/${interview.id}`);
    } else {
      navigate(`/interview/${interview.id}`);
    }
  };

  const typeDisplay = interview.interviewType?.replace("-", " ") || "mixed";
  const actionText = interview.completed ? "View Feedback" : "Attend Interview";

  return (
    <StyledWrapper $isDeleting={isDeleting}>
      <div className="card" onClick={handleAction}>
        <button
          onClick={handleDelete}
          title="Delete Interview"
          className="delete-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>

        <div className="content">
          <p className="logo capitalize">{typeDisplay} Interview</p>
          <div className="h6">{interview.role}</div>
          <div className="hover_content">
            <div className="info-grid">
              <div>
                <strong>Experience:</strong><br />
                <span className="capitalize">{interview.experienceLevel}</span>
              </div>
              <div>
                <strong>Tech Stack:</strong><br />
                {interview.techStack}
              </div>
              <div>
                <strong>Questions:</strong><br />
                {interview.questions.length} included
              </div>
            </div>

            <button className="action-button" onClick={handleAction}>
              {actionText}
            </button>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

// using transient prop $isDeleting to pass it to styled without react warning
const StyledWrapper = styled.div<{ $isDeleting: boolean }>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.$isDeleting ? 0.5 : 1};
  pointer-events: ${props => props.$isDeleting ? 'none' : 'auto'};
  transform: ${props => props.$isDeleting ? 'scale(0.95)' : 'none'};
  transition: all 0.3s ease;

  .card {
    position: relative;
    display: flex;
    justify-content: center;
    cursor: pointer;
    width: 100%;
    max-width: 24em;
    margin: 0 auto;
    padding: 2.5em 0;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border) / 0.4);
    border-radius: 1rem;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.35s ease;
    overflow: hidden;
  }

  .card::before, .card::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: hsl(var(--primary));
    height: 4px;
  }

  .card::before {
    width: 0;
    opacity: 0;
    transition: opacity 0s ease, width 0s ease;
    transition-delay: 0.5s;
  }

  .card::after {
    width: 100%;
    background: transparent;
    transition: width 0.5s ease;
  }

  .card .content {
    width: 85%;
    max-width: 90%;
    position: relative;
    z-index: 2;
  }

  .card .logo {
    margin: 0 0 0.8em;
    width: 100%;
    color: hsl(var(--primary));
    font-size: 0.85em;
    font-weight: 700;
    letter-spacing: 1px;
    transition: all 0.35s ease;
  }

  .card .h6 {
    color: hsl(var(--card-foreground));
    font-size: 1.25em;
    font-weight: 800;
    text-transform: capitalize;
    margin: 0;
    transition: color 0.3s ease;
  }

  .card .hover_content {
    overflow: hidden;
    max-height: 0;
    transform: translateY(1em);
    transition: all 0.55s ease;
    opacity: 0;
  }

  .card .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1em;
    margin: 1.5em 0 2em;
    color: hsl(var(--muted-foreground));
    font-size: 0.85em;
    line-height: 1.5em;
  }
  
  .card .info-grid strong {
    color: hsl(var(--foreground));
    font-weight: 600;
  }

  .action-button {
    width: 100%;
    padding: 0.75em;
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.9em;
    transition: background 0.2s ease;
  }
  
  .action-button:hover {
    background: hsl(var(--primary) / 0.9);
  }

  .delete-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem;
    color: hsl(var(--muted-foreground) / 0.5);
    border-radius: 9999px;
    opacity: 0;
    transition: all 0.2s ease;
    z-index: 10;
  }

  .delete-button:hover {
    color: hsl(var(--destructive));
    background: hsl(var(--destructive) / 0.1);
  }

  .card:hover {
    box-shadow: 0 15px 30px 0 rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
    border-color: hsl(var(--primary) / 0.3);
  }

  .card:hover .delete-button {
    opacity: 1;
  }

  .card:hover::before {
    width: 100%;
    opacity: 1;
    transition: opacity 0.5s ease, width 0.5s ease;
    transition-delay: 0s;
  }

  .card:hover::after {
    width: 0;
    opacity: 0;
    transition: width 0s ease;
  }

  .card:hover .logo {
    margin-bottom: 0.2em;
  }

  .card:hover .hover_content {
    max-height: 25em;
    transform: none;
    opacity: 1;
  }
`;

export default InterviewCard;
