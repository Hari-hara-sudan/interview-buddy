import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VoiceAvatar from "@/components/VoiceAvatar";
import TranscriberBar from "@/components/TranscriberBar";
import { useInterviews } from "@/contexts/InterviewContext";
import vapi, { VAPI_ASSISTANT_ID_INTERVIEW } from "@/lib/vapi";
import { genAI } from "@/lib/gemini";
import { useAuth } from "@/contexts/AuthContext";

type Step = "idle" | "listening" | "evaluating" | "done";

const InterviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInterview, updateInterview } = useInterviews();
  const { user } = useAuth();
  const interview = getInterview(id || "");

  const [step, setStep] = useState<Step>("idle");
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const fullConversationRef = useRef("");
  const callEndedRef = useRef(false);

  useEffect(() => {
    if (!interview) {
      navigate("/");
      return;
    }

    const handleCallStart = () => {
      callEndedRef.current = false;
      setStep("listening");
      setAgentSpeaking(true);
    };

    const handleSpeechStart = () => {
      setAgentSpeaking(false);
      setUserSpeaking(true);
    };

    const handleSpeechEnd = () => {
      setUserSpeaking(false);
    };

    const handleMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const text = message.transcript;
        const speaker = message.role === "assistant" ? "Interviewer" : "Candidate";
        setTranscript(text);
        fullConversationRef.current += `\n${speaker}: ${text}`;

        if (message.role === "assistant") {
          setAgentSpeaking(true);
          setTimeout(() => setAgentSpeaking(false), 2000);
        }
      }
    };

    const handleCallEnd = async () => {
      if (callEndedRef.current) return;
      callEndedRef.current = true;

      setStep("evaluating");
      setAgentSpeaking(false);
      setUserSpeaking(false);
      setTranscript("Evaluating your answers...");

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `You are an expert technical and behavioral interviewer evaluating a candidate for a ${interview.role} role. 
The expected tech stack is ${interview.techStack}. Experience level: ${interview.experienceLevel}.
The interview was a ${interview.interviewType} type.

Here are the target questions the interviewer was supposed to ask:
${interview.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Here is the full conversation transcript:
${fullConversationRef.current}

Analyze the candidate's responses carefully.
Provide a JSON strictly structured like this:
{
  "score": <number out of 100>,
  "summary": "<overall summary in 2 sentences>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const feedback = JSON.parse(jsonMatch[0]);
          await updateInterview(interview.id, {
            completed: true,
            feedback,
          });
          setTranscript("Evaluation complete! Redirecting...");
          setStep("done");
          setTimeout(() => navigate(`/feedback/${interview.id}`), 2000);
        } else {
          throw new Error("Failed to parse evaluation JSON from Gemini.");
        }
      } catch (err) {
        console.error("Evaluation Error:", err);
        setTranscript("Failed to evaluate. Please try refreshing or ending the interview gracefully.");
        setStep("idle");
      }
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("message", handleMessage);
    vapi.on("call-end", handleCallEnd);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("message", handleMessage);
      vapi.off("call-end", handleCallEnd);

      if (step === "listening") {
        vapi.stop();
      }
    };
  }, [interview, navigate, updateInterview]);

  if (!interview) return null;

  const startInterview = () => {
    fullConversationRef.current = "";
    vapi.start(VAPI_ASSISTANT_ID_INTERVIEW, {
      variableValues: {
        username: user?.displayName || "Candidate",
        questions: JSON.stringify(interview.questions)
      }
    });
  };

  const endInterview = () => {
    vapi.stop();
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Immersive Environment Glows */}
      <div className="absolute top-[10%] left-[20%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute bottom-[10%] right-[20%] w-[35rem] h-[35rem] bg-accent-foreground/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-glow" style={{ animationDelay: '2s' }} />

      <div className="container max-w-5xl mx-auto backdrop-blur-2xl bg-card/40 border border-white/10 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-10 md:p-14 animate-fade-in transition-all duration-500">
        <div className="text-center mb-16 relative">
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold tracking-widest uppercase mb-4 backdrop-blur-md glow-agent">
            {interview.interviewType}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground via-primary to-accent-foreground drop-shadow-md mb-4 mt-6">
            Interview Session
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">
            <span className="text-foreground/90">{interview.role}</span> • {interview.experienceLevel} • <span className="font-mono text-primary/80">{interview.techStack}</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-14 md:gap-28 mb-16 relative z-10 w-full px-8">
          <div className="relative group transition-transform duration-[600ms] hover:scale-[1.08] hover:-translate-y-2">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms]"></div>
            <VoiceAvatar type="agent" isSpeaking={agentSpeaking} />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 font-bold text-sm text-primary transition-opacity opacity-0 group-hover:opacity-100 uppercase tracking-widest">AI INTERVIEWER</span>
          </div>

          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent hidden md:block" />
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent md:hidden" />

            <div className={`relative px-6 py-2 rounded-full border transition-all duration-300 backdrop-blur-sm ${step === 'listening' ? 'border-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.3)] bg-primary/10' : 'border-border bg-background'}`}>
              <span className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors ${step === 'listening' ? 'text-primary' : 'text-muted-foreground'}`}>
                {step === 'listening' ? 'Live Connection' : 'Ready'}
              </span>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent hidden md:block" />
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent md:hidden" />
          </div>

          <div className="relative group transition-transform duration-[600ms] hover:scale-[1.08] hover:-translate-y-2">
            <div className="absolute inset-0 bg-success/30 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms]"></div>
            <VoiceAvatar type="user" isSpeaking={userSpeaking} />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 font-bold text-sm text-success transition-opacity opacity-0 group-hover:opacity-100 uppercase tracking-widest">CANDIDATE</span>
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto rounded-3xl overflow-hidden glassmorphism shadow-inner bg-black/5 dark:bg-white/5 p-6 border border-white/10 dark:border-white/5 transform transition-all duration-500 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)]">
          <TranscriberBar text={transcript} isListening={step === "listening" && !agentSpeaking} />
        </div>

        <div className="mt-14 flex flex-col items-center gap-5">
          {step === "idle" && (
            <button
              onClick={startInterview}
              className="group relative px-10 py-5 bg-gradient-to-br from-primary to-accent-foreground text-primary-foreground rounded-2xl text-xl font-bold shadow-[0_10px_40px_rgba(var(--primary),0.3)] hover:shadow-[0_15px_50px_rgba(var(--primary),0.5)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-[150%] skew-x-[-45deg] group-hover:block transition-all duration-700 ease-out group-hover:translate-x-[150%]" />
              <span className="relative flex items-center justify-center gap-3">
                <svg className="w-6 h-6 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Secure Target Uplink
              </span>
            </button>
          )}

          {step === "listening" && (
            <button
              onClick={endInterview}
              className="group relative px-10 py-4 bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground rounded-2xl text-lg font-bold shadow-[0_10px_40px_rgba(var(--destructive),0.4)] transition-all duration-300 hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center gap-2 tracking-wide">
                Terminate Interview Matrix
              </span>
            </button>
          )}

          {step === "evaluating" && (
            <div className="flex items-center gap-4 text-base font-semibold text-muted-foreground backdrop-blur-xl bg-secondary/80 border border-white/5 px-10 py-5 rounded-full shadow-2xl">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin glow-agent" />
              Analyzing complex behavioral patterns...
            </div>
          )}

          {step === "done" && (
            <div className="text-success font-black flex items-center gap-3 px-10 py-5 bg-success/10 border border-success/30 shadow-[0_0_40px_rgba(var(--success),0.3)] rounded-2xl transform transition-all duration-500 hover:scale-105">
              <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              Calculations Finalized! Routing Payload...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
