import React, { createContext, useContext, useState } from "react";

export type InterviewType = "technical" | "behavioral" | "mixed" | "system-design" | "hr";

export interface Interview {
  id: string;
  role: string;
  techStack: string;
  experienceLevel: "entry" | "mid" | "senior";
  interviewType: InterviewType;
  questions: string[];
  createdAt: string;
  completed: boolean;
  feedback?: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
}

interface InterviewContextType {
  interviews: Interview[];
  addInterview: (interview: Interview) => void;
  updateInterview: (id: string, updates: Partial<Interview>) => void;
  getInterview: (id: string) => Interview | undefined;
}

const InterviewContext = createContext<InterviewContextType>({
  interviews: [],
  addInterview: () => {},
  updateInterview: () => {},
  getInterview: () => undefined,
});

export const useInterviews = () => useContext(InterviewContext);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);

  const addInterview = (interview: Interview) => {
    setInterviews((prev) => [interview, ...prev]);
  };

  const updateInterview = (id: string, updates: Partial<Interview>) => {
    setInterviews((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const getInterview = (id: string) => interviews.find((i) => i.id === id);

  return (
    <InterviewContext.Provider value={{ interviews, addInterview, updateInterview, getInterview }}>
      {children}
    </InterviewContext.Provider>
  );
};
