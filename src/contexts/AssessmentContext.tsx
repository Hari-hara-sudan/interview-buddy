import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

export interface Assessment {
  id: string;
  parsedResume: {
    name: string;
    email: string;
    skills: string[];
    experience: string;
    education: string;
    summary: string;
  };
  scores: {
    aptitude: number;
    programming: number;
    verbal: number;
  };
  config: {
    aptitude: number;
    programming: number;
    verbal: number;
  };
  submitted: boolean;
  createdAt: any;
  updatedAt?: any;
}

interface AssessmentContextType {
  assessments: Assessment[];
}

const AssessmentContext = createContext<AssessmentContextType>({
  assessments: [],
});

export const useAssessments = () => useContext(AssessmentContext);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setAssessments([]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "assessments"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Assessment[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Assessment);
      });
      setAssessments(fetched);
    }, (error) => {
      console.error("Failed to fetch assessments:", error);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <AssessmentContext.Provider value={{ assessments }}>
      {children}
    </AssessmentContext.Provider>
  );
};
