import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoiceAvatar from "@/components/VoiceAvatar";
import TranscriberBar from "@/components/TranscriberBar";
import { useInterviews, type Interview, type InterviewType } from "@/contexts/InterviewContext";
import vapi, { VAPI_ASSISTANT_ID_ONBOARDING } from "@/lib/vapi";
import { genAI } from "@/lib/gemini";
import { useAuth } from "@/contexts/AuthContext";

type Step = "idle" | "listening" | "generating" | "done";

const GenerateInterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { addInterview } = useInterviews();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const fullConversationRef = React.useRef("");
  const confirmedDetailsRef = React.useRef<any>(null);
  const callEndedRef = React.useRef(false);

  useEffect(() => {
    const handleCallStart = () => {
      callEndedRef.current = false;
      confirmedDetailsRef.current = null;
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
        const speaker = message.role === "assistant" ? "Agent" : "User";
        setTranscript(text);
        fullConversationRef.current += `\n${speaker}: ${text}`;

        if (message.role === "assistant") {
          setAgentSpeaking(true);
          setTimeout(() => setAgentSpeaking(false), 2000);
        }
      } else if (message.type === "tool-calls") {
        const toolCall = message.toolCalls.find((t: any) => t.function.name === 'getUserData');
        if (toolCall) {
          try {
            confirmedDetailsRef.current = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.error("Failed to parse tool call arguments", e);
          }
          // The Vapi agent will say goodbye and then trigger call-end automatically based on its system prompt.
        }
      }
    };

    const handleCallEnd = async () => {
      if (callEndedRef.current) return;
      callEndedRef.current = true;

      setStep("generating");
      setAgentSpeaking(false);
      setUserSpeaking(false);
      setTranscript("Analyzing your requirements...");

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";
        if (confirmedDetailsRef.current) {
          const details = confirmedDetailsRef.current;
          prompt = `Generate ${details.amount || 5} interview questions (${details.type || "Mixed"}) for a ${details.level || "mid"}-level ${details.role || "Software Engineer"} focusing on this tech stack: ${details.techstack || "React"}.
Return purely a JSON object structured exactly like this:
{
  "role": "${details.role || "extracted role"}",
  "techStack": "${details.techstack || "extracted tech stack"}",
  "experienceLevel": "${details.level || "mid"}",
  "interviewType": "${details.type || "Mixed"}",
  "questions": ["Q1", "Q2", "Q3", ...] // Exact 'amount' requested by user
}`;
        } else {
          prompt = `Based on the following conversation between an AI assistant and a user, extract the user's interview requirements and generate the exact number of technical or behavioral questions they requested.
If missing, assume default: Software Engineer, React, Mid level, Mixed type, 5 questions.
Conversation: ${fullConversationRef.current}

Return purely a JSON object structured exactly like this:
{
  "role": "extracted role",
  "techStack": "extracted tech stack",
  "experienceLevel": "entry | mid | senior",
  "interviewType": "Technical | Behavioural | Mixed",
  "questions": ["Q1", "Q2", "Q3", ...] // Exact 'amount' requested by user
}`;
        }

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const interview: Interview = {
            id: crypto.randomUUID(),
            role: parsed.role || confirmedDetailsRef.current?.role || "Software Engineer",
            techStack: parsed.techStack || confirmedDetailsRef.current?.techstack || "React",
            experienceLevel: parsed.experienceLevel || confirmedDetailsRef.current?.level || "mid",
            interviewType: parsed.interviewType || confirmedDetailsRef.current?.type || "Mixed",
            questions: parsed.questions || ["Tell me about yourself."],
            createdAt: new Date().toISOString(),
            completed: false,
          };
          await addInterview(interview);
          setTranscript("Interview generated! Redirecting...");
          setStep("done");
          setTimeout(() => navigate("/"), 2000);
        } else {
          throw new Error("Failed to parse JSON");
        }
      } catch (err) {
        console.error("Gemini Error:", err);
        setTranscript("Failed to generate interview. Try again.");
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
    };
  }, [addInterview, navigate]);

  const startConversation = () => {
    fullConversationRef.current = "";
    vapi.start(VAPI_ASSISTANT_ID_ONBOARDING, {
      variableValues: {
        username: user?.displayName || "Candidate",
        userId: user?.uid || "",
      }
    });
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[20%] left-[10%] w-[35rem] h-[35rem] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute bottom-[20%] right-[10%] w-[25rem] h-[25rem] bg-accent-foreground/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="container max-w-4xl mx-auto backdrop-blur-xl bg-background/60 border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl p-10 md:p-14 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-foreground drop-shadow-sm mb-4">
            Voice Onboarding
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Let's chat! Our AI will analyze your background and instantly tailor your interview session.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20 mb-14 relative z-10">
          <div className="relative group transition-transform duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <VoiceAvatar type="agent" isSpeaking={agentSpeaking} />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent" />
            <span className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Sync</span>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent" />
          </div>
          <div className="relative group transition-transform duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-success/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <VoiceAvatar type="user" isSpeaking={userSpeaking} />
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden glassmorphism shadow-inner bg-black/5 dark:bg-white/5 p-4 transform transition-all duration-300 hover:shadow-primary/10">
          <TranscriberBar text={transcript} isListening={step === "listening" && !agentSpeaking} />
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          {step === "idle" && (
            <button
              onClick={startConversation}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground rounded-2xl text-lg font-bold hover:shadow-[0_0_40px_rgba(var(--primary),0.4)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                <svg className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Commence Voice Onboarding
              </span>
            </button>
          )}

          {step === "listening" && (
            <div className="flex items-center gap-3 text-sm font-semibold text-primary backdrop-blur-md bg-primary/10 border border-primary/20 px-8 py-4 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.1)] animate-pulse">
              <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
              Actively securely transmitting...
            </div>
          )}

          {step === "generating" && (
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground backdrop-blur-xl bg-secondary/80 border border-white/5 px-8 py-4 rounded-full shadow-lg">
              <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Synthesizing your requirements...
            </div>
          )}

          {step === "done" && (
            <div className="text-success font-bold flex items-center gap-3 px-8 py-4 bg-success/10 border border-success/20 shadow-[0_0_30px_rgba(var(--success),0.2)] rounded-full transform transition-all duration-500 hover:scale-105">
              <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Interview Ready! Redirecting instantly...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateInterviewPage;
