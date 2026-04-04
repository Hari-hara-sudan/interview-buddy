import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VoiceAvatar from "@/components/VoiceAvatar";
import TranscriberBar from "@/components/TranscriberBar";
import { useInterviews } from "@/contexts/InterviewContext";

const InterviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInterview, updateInterview } = useInterviews();
  const interview = getInterview(id || "");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [answerInput, setAnswerInput] = useState("");

  useEffect(() => {
    if (!interview) navigate("/");
  }, [interview, navigate]);

  if (!interview) return null;

  const askQuestion = (index: number) => {
    setAgentSpeaking(true);
    setTranscript(interview.questions[index]);
    setTimeout(() => setAgentSpeaking(false), 2500);
  };

  const startInterview = () => {
    setIsStarted(true);
    askQuestion(0);
  };

  const submitAnswer = () => {
    if (!answerInput.trim()) return;

    setUserSpeaking(true);
    setTranscript(answerInput);
    const newAnswers = [...answers, answerInput];
    setAnswers(newAnswers);
    setAnswerInput("");

    setTimeout(() => {
      setUserSpeaking(false);
      if (currentQuestion < interview.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        askQuestion(currentQuestion + 1);
      } else {
        // Interview complete — generate feedback
        setTranscript("Interview complete! Evaluating your answers...");
        setAgentSpeaking(true);
        setTimeout(() => {
          updateInterview(interview.id, {
            completed: true,
            feedback: {
              score: 78,
              summary: "Strong technical knowledge with good communication skills. Some areas could benefit from more depth.",
              strengths: [
                "Clear and structured answers",
                "Good understanding of core concepts",
                "Practical examples provided",
              ],
              improvements: [
                "Could dive deeper into system design",
                "Add more real-world project examples",
                "Practice explaining complex topics simply",
              ],
            },
          });
          setAgentSpeaking(false);
          navigate(`/feedback/${interview.id}`);
        }, 3000);
      }
    }, 1500);
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-4 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Interview Session</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {interview.role} • {interview.techStack} • <span className="capitalize">{interview.interviewType?.replace("-", " ") || "Mixed"}</span>
        </p>
      </div>

      {isStarted && (
        <div className="text-center mb-6">
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            Question {currentQuestion + 1} of {interview.questions.length}
          </span>
        </div>
      )}

      <div className="flex items-center justify-center gap-16 mb-10 animate-scale-in">
        <VoiceAvatar type="agent" isSpeaking={agentSpeaking} />
        <div className="flex flex-col items-center gap-2">
          <div className="w-px h-12 bg-border" />
          <span className="text-xs text-muted-foreground">VS</span>
          <div className="w-px h-12 bg-border" />
        </div>
        <VoiceAvatar type="user" isSpeaking={userSpeaking} />
      </div>

      <TranscriberBar text={transcript} isListening={isStarted && !agentSpeaking} />

      <div className="mt-8 flex flex-col items-center gap-4 animate-fade-in">
        {!isStarted ? (
          <button
            onClick={startInterview}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all hover:scale-105"
          >
            Start Interview
          </button>
        ) : !agentSpeaking ? (
          <div className="w-full max-w-2xl flex gap-3">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
              placeholder="Type your answer (simulates voice input)..."
              className="flex-1 h-11 px-4 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            <button
              onClick={submitAnswer}
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Submit
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default InterviewPage;
