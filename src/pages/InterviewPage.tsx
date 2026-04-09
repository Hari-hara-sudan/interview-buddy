import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VoiceAvatar from "@/components/VoiceAvatar";
import TranscriberBar from "@/components/TranscriberBar";
import { useInterviews } from "@/contexts/InterviewContext";
import vapi, { VAPI_ASSISTANT_ID_INTERVIEW } from "@/lib/vapi";
import { genAI } from "@/lib/gemini";
import { openai } from "@/lib/openai";
import { useAuth } from "@/contexts/AuthContext";

type Step = "idle" | "connecting" | "listening" | "evaluating" | "done";

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
  const [vapiError, setVapiError] = useState<string | null>(null);
  const fullConversationRef = useRef("");
  const callEndedRef = useRef(false);

  useEffect(() => {
    if (!interview) { navigate("/"); return; }

    const handleCallStart = () => {
      callEndedRef.current = false;
      setVapiError(null);
      setStep("listening");
      setAgentSpeaking(true);
    };
    const handleSpeechStart = () => { setAgentSpeaking(false); setUserSpeaking(true); };
    const handleSpeechEnd = () => { setUserSpeaking(false); };

    const handleMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const text = message.transcript;
        const speaker = message.role === "assistant" ? "Interviewer" : "Candidate";
        setTranscript(text);
        fullConversationRef.current += `\n${speaker}: ${text}`;
        if (message.role === "assistant") { setAgentSpeaking(true); setTimeout(() => setAgentSpeaking(false), 2000); }
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
        const interviewQuestions = interview.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n");
        const prompt = `You are an expert interviewer evaluating a candidate for a ${interview.role} role (${interview.techStack}, ${interview.experienceLevel}, ${interview.interviewType}).
Here are the questions they were supposed to be asked: 
${interviewQuestions}

Below is the transcript of the interview:
${fullConversationRef.current}

Return JSON strictly in this format without markdown code blocks: { "score": <0-100 number>, "summary": "<2 sentences string>", "strengths": ["...", "..."], "improvements": ["..."] }`;
        
        let responseText = "";
        
        // Try Gemini first
        try {
          console.log("📌 Attempting evaluation with Gemini...");
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent(prompt);
          responseText = result.response.text();
          console.log("✅ Gemini evaluation succeeded");
        } catch (geminiErr) {
          console.warn("⚠️ Gemini evaluation failed, trying Groq fallback...", geminiErr);
          setTranscript("Using OpenAI for evaluation...");
          
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
          console.log("✅ OpenAI evaluation succeeded");
        }
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const feedback = JSON.parse(jsonMatch[0]);
          await updateInterview(interview.id, { 
            completed: true, 
            transcript: fullConversationRef.current,
            feedback: feedback 
          });
          setTranscript("Evaluation complete! Redirecting...");
          setStep("done");
          setTimeout(() => navigate(`/feedback/${interview.id}`), 2000);
        } else {
          throw new Error("JSON parse failed");
        }
      } catch (err) {
        console.error("❌ Evaluation error:", err);
        setTranscript("Evaluation failed. Saving transcript without feedback...");
        await updateInterview(interview.id, { completed: true, transcript: fullConversationRef.current });
        setStep("idle");
      }
    };

    const handleError = (err: any) => {
      console.error("Vapi Error:", err);
      
      // Ignore normal call end events wrapped as Daily.co errors
      if (err?.type === "daily-error" && err?.error?.errorMsg === "Meeting has ended") {
        return;
      }
      
      const errorMessage = err?.message || err?.error?.errorMsg || "Failed to connect to the interview session. Please check your microphone permissions and try again.";
      setVapiError(errorMessage);
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
      if (step === "listening") vapi.stop();
    };
  }, [interview, navigate, updateInterview]);

  if (!interview) return null;

  const startInterview = async () => {
    setVapiError(null);
    setStep("connecting");
    setTranscript("Connecting to your interview session...");
    fullConversationRef.current = "";
    try {
      // Check if microphone permissions are available
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      const formattedQuestions = interview.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
      // Optional: Build a very strict string to inject into the `questions` variable 
      // if the dashboard simply dumps {{questions}} into the prompt.
      const strictQuestionsList = `Here are the exact questions you MUST ask:
${formattedQuestions}
      
Instructions: Ask ONLY these questions one by one. Do NOT make up your own.`;

      const result = await vapi.start(VAPI_ASSISTANT_ID_INTERVIEW, {
        firstMessage: `Hello ${user?.displayName || "there"}! I'm your AI interviewer for the ${interview.role} position. We have a few questions to go over today. Are you ready to begin?`,
        variableValues: { 
          username: user?.displayName || "Candidate", 
          questions: strictQuestionsList,
        },
      });
      console.log("Vapi interview started:", result);
    } catch (err: any) {
      console.error("Failed to start Vapi interview:", err);
      setVapiError(err?.message || "Failed to start the interview. Please check microphone permissions and try again.");
      setStep("idle");
      setTranscript("");
    }
  };

  const endInterview = () => {
    vapi.stop();
    // Do NOT navigate away here! Let the "call-end" event listener handle 
    // the evaluation and redirect the user automatically once it finishes.
  };

  // ── PRE-INTERVIEW BRIEF ────────────────────────────────────────────────
  if (step === "idle") {
    const requirements = [
      { icon: "🎧", label: "Headphones or speakers recommended" },
      { icon: "🎙️", label: "Working microphone required" },
      { icon: "📷", label: "Webcam required" },
      { icon: "📶", label: "Stable internet connection" },
      { icon: "🤫", label: "Quiet environment preferred" },
    ];
    const expectations = [
      "You will be asked questions about your experience and background.",
      "The AI voice agent will guide you through the entire interview.",
      "Speak clearly and take your time — there is no rush.",
      "Your responses will be recorded and reviewed by the hiring team.",
      "You will receive a follow-up email with next steps after the interview.",
    ];

    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Interview Details */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-5">Interview Details</p>
              <div className="grid grid-cols-2 gap-y-5">
                {[
                  ["Position", interview.role],
                  ["Experience", interview.experienceLevel],
                  ["Duration", "20–40 minutes"],
                  ["Type", interview.interviewType],
                  ["Tech Stack", interview.techStack],
                  ["Questions", `${interview.questions.length} questions`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] text-gray-400 mb-1">{label}</p>
                    <p className="font-semibold text-sm text-gray-900 capitalize">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1 rounded-full">English</span>
              </div>
            </div>

            {/* Before You Begin */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-5">Before You Begin</p>
              <div className="grid grid-cols-2 gap-3">
                {requirements.map((r, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <span className="text-lg shrink-0">{r.icon}</span>
                    <p className="text-xs text-gray-600 leading-snug">{r.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* What to Expect */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-5">What to Expect</p>
              <ul className="space-y-3.5">
                {expectations.map((e, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                      <path d="M8 12l3 3 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm text-gray-600 leading-relaxed">{e}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ready to Begin */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="12" cy="7" r="4" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Ready to begin?</p>
                  <p className="text-xs text-gray-400">Confirm your details to start the interview</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Full Name</label>
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 font-medium">
                    {user?.displayName || "Candidate"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Invite sent to</label>
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500">
                    {user?.email || "candidate@example.com"}
                  </div>
                </div>
              </div>

              {vapiError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 leading-relaxed">
                  ⚠️ {vapiError}
                </div>
              )}
              <button
                onClick={startInterview}
                disabled={step === "connecting"}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm py-3.5 rounded-xl hover:from-blue-700 hover:to-purple-700 active:scale-[0.98] transition-all duration-150 shadow-md disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {step === "connecting" ? (
                  <>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                    Connecting...
                  </>
                ) : (
                  <>
                    Start
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE INTERVIEW ───────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <div className="flex flex-col h-full px-4 py-3 gap-2">
        {/* Header - Ultra Compact */}
        <div className="flex-shrink-0 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 uppercase px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full whitespace-nowrap">
                {interview.interviewType}
              </span>
              <h1 className="text-sm font-bold text-gray-900 truncate">Interview Session</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {interview.role} • {interview.experienceLevel} • {interview.techStack}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full border text-xs font-bold uppercase flex-shrink-0 whitespace-nowrap ${step === "listening" ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-100 border-gray-200 text-gray-600"}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${step === "listening" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></span>
            {step === "listening" ? "Live" : "Ready"}
          </div>
        </div>

        {/* Interview Arena - Flex Layout */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* Participants - Compact Horizontal */}
          <div className="flex items-center justify-center gap-2 flex-shrink-0">
            {/* AI Interviewer */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-2 py-2 flex-1 flex flex-col items-center">
              <div className="relative mb-1 flex justify-center">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-200 to-purple-200 blur-lg transition-opacity ${agentSpeaking ? "opacity-100" : "opacity-30"}`}></div>
                <div className="relative scale-65">
                  <VoiceAvatar type="agent" isSpeaking={agentSpeaking} />
                </div>
              </div>
              <p className="text-xs font-bold text-blue-600">AI</p>
            </div>

            {/* Divider */}
            <div className="w-px h-16 bg-gray-200 flex-shrink-0"></div>

            {/* You (Candidate) */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg px-2 py-2 flex-1 flex flex-col items-center">
              <div className="relative mb-1 flex justify-center">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-200 to-pink-200 blur-lg transition-opacity ${userSpeaking ? "opacity-100" : "opacity-30"}`}></div>
                <div className="relative scale-65">
                  <VoiceAvatar type="user" isSpeaking={userSpeaking} />
                </div>
              </div>
              <p className="text-xs font-bold text-purple-600">You</p>
            </div>
          </div>

          {/* Transcript - Flexible Height */}
          <div className="flex-1 flex flex-col min-h-0 bg-gray-50 border border-gray-100 rounded-lg p-2">
            <p className="text-xs font-bold text-gray-500 mb-1 flex-shrink-0">Live Conversation</p>
            <div className="bg-white border border-gray-200 rounded p-2 overflow-y-auto flex-1 text-xs leading-relaxed">
              {transcript ? (
                <TranscriberBar text={transcript} isListening={step === "listening" && !agentSpeaking} />
              ) : (
                <div className="text-gray-400 text-xs italic">
                  {step === "connecting" ? "Connecting to agent..." : step === "evaluating" ? "Analyzing your responses..." : "Interview paused..."}
                </div>
              )}
            </div>
          </div>

          {/* Stats & Buttons Row */}
          <div className="flex gap-2 flex-shrink-0">
            {/* Stats */}
            <div className="flex gap-2 flex-1">
              <div className="flex-1 bg-gray-50 border border-gray-100 rounded p-1.5 text-center">
                <p className="text-xs text-gray-500 font-bold">Q</p>
                <p className="text-sm font-black text-gray-900">0/3</p>
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-100 rounded p-1.5 text-center">
                <p className="text-xs text-gray-500 font-bold">Time</p>
                <p className="text-sm font-black text-gray-900">0:00</p>
              </div>
              <div className={`flex-1 rounded p-1.5 border text-center font-bold ${step === "listening" ? "bg-green-50 border-green-100" : step === "evaluating" ? "bg-yellow-50 border-yellow-100" : "bg-blue-50 border-blue-100"}`}>
                <p className="text-xs text-gray-500 font-bold">ST</p>
                <p className={`text-sm font-black ${step === "listening" ? "text-green-600" : step === "evaluating" ? "text-yellow-600" : "text-blue-600"}`}>
                  {step === "listening" ? "●" : step === "evaluating" ? "⋯" : "✓"}
                </p>
              </div>
            </div>

            {/* Button */}
            {step === "listening" && (
              <button
                onClick={endInterview}
                className="px-3 py-1.5 bg-red-500 text-white rounded font-bold text-xs hover:bg-red-600 transition-all flex-shrink-0 whitespace-nowrap h-fit"
              >
                End
              </button>
            )}
            {step === "evaluating" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded font-bold text-xs flex-shrink-0 whitespace-nowrap h-fit">
                <div className="w-2 h-2 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                Wait
              </div>
            )}
            {step === "done" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded font-bold text-xs flex-shrink-0 whitespace-nowrap h-fit">
                ✓ Done
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
