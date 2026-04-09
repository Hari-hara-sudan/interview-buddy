import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoiceAvatar from "@/components/VoiceAvatar";
import TranscriberBar from "@/components/TranscriberBar";
import { useInterviews, type Interview, type InterviewType } from "@/contexts/InterviewContext";
import vapi, { VAPI_ASSISTANT_ID_ONBOARDING } from "@/lib/vapi";
import { genAI } from "@/lib/gemini";
import { openai } from "@/lib/openai";
import { useAuth } from "@/contexts/AuthContext";

type Step = "idle" | "connecting" | "listening" | "generating" | "done";

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
            
            // Tell the voice agent to say goodbye and hang up immediately
            // This prevents the tool-call timeout and triggers the Gemini generation locally.
            vapi.send({
              type: "say",
              content: "Perfect, I have all the details. Generating your interview now.",
              endCallAfterSpoken: true
            });
            
          } catch (e) {
            console.error("Failed to parse tool call arguments", e);
          }
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
  "questions": ["Write actual question 1 here", "Write actual question 2 here", "Write actual question 3 here"] // Length must equal ${details.amount || 5}
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
  "questions": ["Write actual question 1 here", "Write actual question 2 here", "Write actual question 3 here"] // Length must equal the requested amount
}`;
        }

        let responseText = "";
        
        // Try Gemini first
        try {
          console.log("📌 Attempting to generate with Gemini...");
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent(prompt);
          responseText = result.response.text();
          console.log("✅ Gemini succeeded");
        } catch (geminiErr) {
          console.warn("⚠️ Gemini failed, trying OpenAI fallback...", geminiErr);
          setTranscript("Gemini overloaded, using OpenAI...");
          
          // Fallback to OpenAI
          const openaiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1024
          });
          
          responseText = openaiResponse.choices[0]?.message?.content || "";
          console.log("✅ OpenAI generation succeeded");
        }

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
          throw new Error("Failed to parse JSON from AI response");
        }
      } catch (err) {
        console.error("❌ Question generation error:", err);
        setTranscript("Failed to generate interview. Please try again.");
        setStep("idle");
      }
    };

    const handleError = (error: any) => {
      console.error("Vapi Error Event:", error);
      
      // Ignore normal call end events wrapped as Daily.co errors
      if (error?.type === "daily-error" && error?.error?.errorMsg === "Meeting has ended") {
        return;
      }
      
      const errorMessage = error?.message || error?.error?.errorMsg || error?.toString?.() || "Connection failed";
      setTranscript(`Error: ${errorMessage}`);
      setStep("idle");
      setAgentSpeaking(false);
      setUserSpeaking(false);
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("message", handleMessage);
    vapi.on("call-end", handleCallEnd);
    vapi.on("error", handleError);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("message", handleMessage);
      vapi.off("call-end", handleCallEnd);
      vapi.off("error", handleError);
    };
  }, [addInterview, navigate]);

  const startConversation = async () => {
    fullConversationRef.current = "";
    setStep("connecting");
    
    try {
      // Check if microphone permissions are available
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      const result = await vapi.start(VAPI_ASSISTANT_ID_ONBOARDING, {
        variableValues: {
          username: user?.displayName || "Candidate",
          userId: user?.uid || "guest_user_" + Math.random().toString(36).substring(7),
        }
      });
      
      console.log("Vapi call started:", result);
    } catch (err: any) {
      console.error("Failed to start Vapi call:", err);
      setStep("idle");
      setTranscript(`Error: ${err?.message || "Failed to connect to agent. Please check microphone permissions and try again."}`);
      alert(`Connection failed: ${err?.message || "Unknown error. Check browser console for details."}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <div className="flex flex-col h-full px-4 py-3 gap-2">
        {/* Header - Ultra Compact */}
        <div className="flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900">Voice Onboarding</h1>
          <p className="text-xs text-gray-500 mt-0.5">Tell our AI about your interview preferences</p>
        </div>

        {/* Main Content - Flexible Layout */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* Participants - Compact */}
          <div className="flex items-center justify-center gap-2 flex-shrink-0">
            {/* Agent */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative mb-1">
                <div className={`absolute inset-0 rounded-full bg-blue-200 blur-lg transition-opacity ${agentSpeaking ? "opacity-100" : "opacity-30"}`}></div>
                <div className="relative scale-65">
                  <VoiceAvatar type="agent" isSpeaking={agentSpeaking} />
                </div>
              </div>
              <p className="text-xs font-bold text-blue-600">AI</p>
            </div>

            {/* Divider */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-px h-12 bg-gray-200"></div>
              <p className="text-xs text-gray-500 font-bold">Sync</p>
              <div className="w-px h-12 bg-gray-200"></div>
            </div>

            {/* User */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative mb-1">
                <div className={`absolute inset-0 rounded-full bg-green-200 blur-lg transition-opacity ${userSpeaking ? "opacity-100" : "opacity-30"}`}></div>
                <div className="relative scale-65">
                  <VoiceAvatar type="user" isSpeaking={userSpeaking} />
                </div>
              </div>
              <p className="text-xs font-bold text-green-600">You</p>
            </div>
          </div>

          {/* Transcript Area - Flexible Height */}
          <div className="flex-1 flex flex-col min-h-0 bg-gray-50 border border-gray-100 rounded-lg p-2">
            <p className="text-xs font-bold text-gray-500 mb-1 flex-shrink-0">Live Conversation</p>
            <div className="bg-white border border-gray-200 rounded p-2 overflow-y-auto flex-1 text-xs leading-relaxed">
              {transcript ? (
                <TranscriberBar text={transcript} isListening={step === "listening" && !agentSpeaking} />
              ) : (
                <div className="text-gray-400 text-xs italic">{step === "idle" ? "Ready to start..." : "Connecting to agent..."}</div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center gap-2 flex-shrink-0">
            {step === "idle" && (
              <button
                onClick={startConversation}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-xs hover:from-blue-700 hover:to-purple-700 transition-all whitespace-nowrap"
              >
                Call
              </button>
            )}

            {step === "connecting" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg font-bold text-xs flex-shrink-0 whitespace-nowrap">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
                Connecting...
              </div>
            )}

            {step === "listening" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg font-bold text-xs flex-shrink-0 whitespace-nowrap">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Listening...
              </div>
            )}

            {step === "generating" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg font-bold text-xs flex-shrink-0 whitespace-nowrap">
                <div className="w-2 h-2 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                Generating...
              </div>
            )}

            {step === "done" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg font-bold text-xs flex-shrink-0 whitespace-nowrap">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Ready!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateInterviewPage;
