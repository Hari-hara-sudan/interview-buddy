import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import VoiceAvatar from "@/components/VoiceAvatar";
import TranscriberBar from "@/components/TranscriberBar";
import { useInterviews, type Interview } from "@/contexts/InterviewContext";

type Step = "idle" | "role" | "techStack" | "experience" | "generating" | "done";

const SAMPLE_QUESTIONS = [
  "Explain the concept of closures in JavaScript.",
  "What is the difference between SQL and NoSQL databases?",
  "Describe the SOLID principles in software design.",
  "How does garbage collection work in your preferred language?",
  "What are microservices and when would you use them?",
];

const GenerateInterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { addInterview } = useInterviews();
  const [step, setStep] = useState<Step>("idle");
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [role, setRole] = useState("");
  const [techStack, setTechStack] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"entry" | "mid" | "senior">("mid");
  const [isActive, setIsActive] = useState(false);

  const simulateAgent = useCallback((message: string, nextStep: Step) => {
    setAgentSpeaking(true);
    setTranscript(message);
    setTimeout(() => {
      setAgentSpeaking(false);
      setStep(nextStep);
    }, 2500);
  }, []);

  const startConversation = () => {
    setIsActive(true);
    setStep("role");
    simulateAgent("Hi! I'm your interview prep assistant. What role are you preparing for?", "role");
  };

  const handleUserResponse = (value: string) => {
    setUserSpeaking(true);
    setTranscript(value);

    setTimeout(() => {
      setUserSpeaking(false);

      if (step === "role") {
        setRole(value);
        simulateAgent("Great! What tech stack are you working with?", "techStack");
      } else if (step === "techStack") {
        setTechStack(value);
        simulateAgent("And what's your experience level? Entry, Mid, or Senior?", "experience");
      } else if (step === "experience") {
        const level = value.toLowerCase().includes("senior") ? "senior" : value.toLowerCase().includes("entry") ? "entry" : "mid";
        setExperienceLevel(level);
        setStep("generating");
        generateInterview(role, techStack, level);
      }
    }, 1500);
  };

  const generateInterview = (r: string, ts: string, level: "entry" | "mid" | "senior") => {
    setAgentSpeaking(true);
    setTranscript("Generating your interview questions...");

    setTimeout(() => {
      const interview: Interview = {
        id: crypto.randomUUID(),
        role: r || "Software Engineer",
        techStack: ts || "React, Node.js",
        experienceLevel: level,
        questions: SAMPLE_QUESTIONS,
        createdAt: new Date().toISOString(),
        completed: false,
      };
      addInterview(interview);
      setAgentSpeaking(false);
      setStep("done");
      setTranscript("Your interview has been generated! Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    }, 3000);
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Generate Interview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about yourself via voice and we'll create a tailored interview
        </p>
      </div>

      <div className="flex items-center justify-center gap-16 mb-10 animate-scale-in">
        <VoiceAvatar type="agent" isSpeaking={agentSpeaking} />
        <div className="flex flex-col items-center gap-2">
          <div className="w-px h-12 bg-border" />
          <span className="text-xs text-muted-foreground">VS</span>
          <div className="w-px h-12 bg-border" />
        </div>
        <VoiceAvatar type="user" isSpeaking={userSpeaking} />
      </div>

      <TranscriberBar text={transcript} isListening={isActive && !agentSpeaking} />

      <div className="mt-8 flex justify-center animate-fade-in">
        {!isActive ? (
          <button
            onClick={startConversation}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all hover:scale-105"
          >
            Start Voice Onboarding
          </button>
        ) : step === "role" && !agentSpeaking ? (
          <div className="flex gap-3 flex-wrap justify-center">
            {["Frontend Developer", "Backend Developer", "Full Stack Engineer", "Data Scientist"].map((r) => (
              <button
                key={r}
                onClick={() => handleUserResponse(r)}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm hover:bg-secondary/80 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        ) : step === "techStack" && !agentSpeaking ? (
          <div className="flex gap-3 flex-wrap justify-center">
            {["React, Node.js", "Python, Django", "Java, Spring", "Go, Kubernetes"].map((ts) => (
              <button
                key={ts}
                onClick={() => handleUserResponse(ts)}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm hover:bg-secondary/80 transition-colors"
              >
                {ts}
              </button>
            ))}
          </div>
        ) : step === "experience" && !agentSpeaking ? (
          <div className="flex gap-3">
            {["Entry", "Mid", "Senior"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleUserResponse(lvl)}
                className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg text-sm hover:bg-secondary/80 transition-colors"
              >
                {lvl}
              </button>
            ))}
          </div>
        ) : step === "generating" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Generating your interview...
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GenerateInterviewPage;
