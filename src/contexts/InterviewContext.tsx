import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

export type InterviewType = "Technical" | "Behavioural" | "Mixed" | "technical" | "behavioral" | "mixed" | "system-design" | "hr" | string;

export interface Interview {
  id: string;
  role: string;
  techStack: string;
  experienceLevel: "entry" | "mid" | "senior" | string;
  interviewType: InterviewType;
  questions: string[];
  createdAt: string;
  completed: boolean;
  transcript?: string;
  feedback?: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
}

interface InterviewContextType {
  interviews: Interview[];
  addInterview: (interview: Interview) => Promise<void>;
  updateInterview: (id: string, updates: Partial<Interview>) => Promise<void>;
  deleteInterview: (id: string) => Promise<void>;
  getInterview: (id: string) => Interview | undefined;
}

const InterviewContext = createContext<InterviewContextType>({
  interviews: [],
  addInterview: async () => { },
  updateInterview: async () => { },
  deleteInterview: async () => { },
  getInterview: () => undefined,
});

export const useInterviews = () => useContext(InterviewContext);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setInterviews([]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "interviews"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Interview[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push(docSnap.data() as Interview);
      });
      setInterviews(fetched);
    });

    return () => unsubscribe();
  }, [user]);

  const addInterview = React.useCallback(async (interview: Interview) => {
    if (!user) return;
    const interviewRef = doc(collection(db, "users", user.uid, "interviews"), interview.id);
    await setDoc(interviewRef, interview);
  }, [user]);

  const updateInterview = React.useCallback(async (id: string, updates: Partial<Interview>) => {
    if (!user) return;
    const interviewRef = doc(collection(db, "users", user.uid, "interviews"), id);
    await updateDoc(interviewRef, updates as any);
  }, [user]);

  const deleteInterview = React.useCallback(async (id: string) => {
    if (!user) return;
    const interviewRef = doc(collection(db, "users", user.uid, "interviews"), id);
    await deleteDoc(interviewRef);
  }, [user]);

  const getInterview = React.useCallback((id: string) => interviews.find((i) => i.id === id), [interviews]);

  return (
    <InterviewContext.Provider value={{ interviews, addInterview, updateInterview, deleteInterview, getInterview }}>
      {children}
    </InterviewContext.Provider>
  );
};
