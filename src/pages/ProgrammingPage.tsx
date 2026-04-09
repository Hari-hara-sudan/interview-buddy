import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import VoiceAvatar from "@/components/VoiceAvatar";
import { genAI } from "@/lib/gemini";
import { groq } from "@/lib/groq";
import { cn } from "@/lib/utils";
import { detectTypo, resetTypoTracking } from "@/lib/typoDetector";
import vapi from "@/lib/vapi";

type SupportedLanguage = "javascript" | "python" | "java";

const PROGRAMMING_QUESTIONS = [
    {
        id: "two-sum",
        title: "Two Sum",
        difficulty: "Easy",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target. Assume exactly one solution.",
        testCases: [
            { input: "nums = [2,7,11,15], target = 9", expected: "[0,1]" },
            { input: "nums = [3,2,4], target = 6", expected: "[1,2]" }
        ],
        defaultCode: {
            javascript: "function twoSum(nums, target) {\n  // Write your code here\n  \n}",
            python: "def twoSum(nums, target):\n    # Write your code here\n    pass",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}"
        }
    },
    {
        id: "reverse-string",
        title: "Reverse String",
        difficulty: "Easy",
        description: "Write a function that reverses a string. The input string is given as an array of characters `s`. You must do this by modifying the input array in-place with O(1) extra memory.",
        testCases: [
            { input: "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]", expected: "[\"o\",\"l\",\"l\",\"e\",\"h\"]" },
            { input: "s = [\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", expected: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]" }
        ],
        defaultCode: {
            javascript: "function reverseString(s) {\n  // Write your code here\n  \n}",
            python: "def reverseString(s):\n    # Write your code here\n    pass",
            java: "class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n        \n    }\n}"
        }
    },
    {
        id: "lru-cache",
        title: "LRU Cache",
        difficulty: "Hard",
        description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the LRUCache class with get(key) and put(key, value) operations.",
        testCases: [
            { input: "[\"LRUCache\", \"put\", \"put\", \"get\", \"put\"]\n[[2], [1, 1], [2, 2], [1], [3, 3]]", expected: "[null, null, null, 1, null]" }
        ],
        defaultCode: {
            javascript: "class LRUCache {\n  constructor(capacity) {\n    \n  }\n\n  get(key) {\n    \n  }\n\n  put(key, value) {\n    \n  }\n}",
            python: "class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass",
            java: "class LRUCache {\n    public LRUCache(int capacity) {\n        \n    }\n    \n    public int get(int key) {\n        return -1;\n    }\n    \n    public void put(int key, int value) {\n        \n    }\n}"
        }
    }
];

export default function ProgrammingPage() {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    const [hasStarted, setHasStarted] = useState(false);
    const [language, setLanguage] = useState<SupportedLanguage>("javascript");
    const [activeQuestionId, setActiveQuestionId] = useState(PROGRAMMING_QUESTIONS[0].id);
    const activeQuestion = PROGRAMMING_QUESTIONS.find(q => q.id === activeQuestionId)!;

    const [code, setCode] = useState(activeQuestion.defaultCode[language]);
    const [agentSpeaking, setAgentSpeaking] = useState(false);
    const [vapiConnected, setVapiConnected] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousCodeRef = useRef<string>(activeQuestion.defaultCode[language]);

    // Initial Fullscreen Start Flow & Vapi Init
    const handleStartSession = async () => {
        try {
            if (containerRef.current && !document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            }
        } catch (err) {
            console.error("Fullscreen API failed", err);
        }
        setHasStarted(true);

        const prompt = `You are a highly capable AI programming tutor evaluating a candidate in real time. 
The user is currently starting to solve a coding challenge in JavaScript/Java/Python.
CHALLENGE TITLE: ${activeQuestion.title}

YOUR TASKS:
1. Speak immediately. Welcome them to the programming round, read the challenge title, and instruct them to begin coding in the editor.
2. The user will type code. 
3. If they ask you a question verbally, answer it and help them write the code.
4. You will occasionally receive SYSTEM ALERTS if the background engine detects a syntax typo (like "fur" instead of "for"). When you get an alert, IMMEDIATELY speak out to the user and tell them about the error gently.`;

        // Start Vapi dynamic assistant
        vapi.start({
            model: {
                provider: "google",
                model: "gemini-2.5-flash",
                messages: [{ role: "system", content: prompt }]
            },
            voice: {
                provider: "11labs",
                voiceId: "bIHbv24MWmeRgasZH58o" // human-like default voice
            }
        });
    };

    // Listeners for Vapi states
    useEffect(() => {
        const onSpeechStart = () => setAgentSpeaking(true);
        const onSpeechEnd = () => setAgentSpeaking(false);
        const onCallStart = () => setVapiConnected(true);
        const onCallEnd = () => setVapiConnected(false);

        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);

        return () => {
            vapi.off("speech-start", onSpeechStart);
            vapi.off("speech-end", onSpeechEnd);
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
        };
    }, []);

    // Release fullscreen on exit
    const handleExit = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.log(err));
        }
        vapi.stop();
        resetTypoTracking();
        navigate("/");
    };

    // Switch questions
    const handleSwitchQuestion = (id: string) => {
        setActiveQuestionId(id);
        const pq = PROGRAMMING_QUESTIONS.find(q => q.id === id)!;
        setCode(pq.defaultCode[language]);
        previousCodeRef.current = pq.defaultCode[language];
        resetTypoTracking();

        if (vapiConnected) {
            vapi.send({
                type: "add-message",
                message: {
                    role: "system",
                    content: `The user switched the programming challenge! They are now solving: ${pq.title}. Description: ${pq.description}. Acknowledge this playfully and tell them to begin.`
                }
            });
        }
    };

    // Switch language
    const handleSwitchLanguage = (lang: SupportedLanguage) => {
        setLanguage(lang);
        setCode(activeQuestion.defaultCode[lang]);
        previousCodeRef.current = activeQuestion.defaultCode[lang];
        resetTypoTracking();
        // Notify the voice agent about the language change
        if (vapiConnected) {
            try {
                // @ts-ignore
                vapi.say(`I see you've switched to ${lang}. Go ahead and start coding in ${lang}!`);
            } catch (e) { /* ignore */ }
        }
    };

    // Continual snapshot sensing & Vapi integration via dual-model evaluation
    const analyzeCode = async (currentCode: string) => {
        if (!hasStarted || !vapiConnected) return;

        try {
            const prompt = `The user is writing code for: ${activeQuestion.title}.
Current code snapshot in ${language}:
\`\`\`
${currentCode}
\`\`\`
Check if there is a very obvious syntax typo (like "fur" instead of "for", "whil" instead of "while", missing obvious brackets, etc.) or a major fatal logical error.
If there is a clear error, reply ONLY with a short, friendly hint (1 sentence max). Do not be overly pedantic if it's just incomplete (like a missing closing brace on a newly opened function).
If their code is fine, or incomplete but correct so far, reply EXACTLY with "SILENT".`;

            let responseText = "";
            
            // Try Gemini first
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const result = await model.generateContent(prompt);
                responseText = result.response.text().trim();
            } catch (geminiErr) {
                console.warn("⚠️ Gemini analysis failed, trying Groq fallback...", geminiErr);
                
                // Fallback to Groq
                const groqResponse = await groq.chat.completions.create({
                    model: "llama-3.1-70b-versatile",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 256
                });
                
                responseText = groqResponse.choices[0]?.message?.content?.trim() || "";
            }

            if (responseText && responseText !== "SILENT" && !responseText.includes("SILENT") && responseText.length > 5) {
                // Use vapi.say() to FORCE the agent to speak immediately
                // @ts-ignore
                vapi.say(responseText);
            }
        } catch (err) {
            console.error("Background AI evaluation error", err);
        }
    };

    // ── Instant client-side typo detection (Layer 1) ──────────────────
    const handleCodeChange = useCallback((newCode: string) => {
        // Layer 1: Instant client-side typo check
        if (vapiConnected && hasStarted) {
            const typoResult = detectTypo(newCode, previousCodeRef.current, language);
            if (typoResult) {
                // Speak immediately via Vapi — zero API latency
                try {
                    // @ts-ignore
                    vapi.say(typoResult.message);
                } catch (e) {
                    console.error("Vapi say error", e);
                }
            }
        }
        previousCodeRef.current = newCode;
        setCode(newCode);
    }, [vapiConnected, hasStarted, language]);

    useEffect(() => {
        if (!hasStarted || !vapiConnected) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            analyzeCode(code);
        }, 4000); // 4 seconds — Gemini handles deep logic only, not typos

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [code, language, hasStarted, vapiConnected]);

    // Render Fullscreen Gate if not started
    if (!hasStarted) {
        return (
            <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-50 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
                {/* Soft gradient orbs specifically for the fullscreen container */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[10%] w-[55%] h-[55%] rounded-full bg-blue-300/20 blur-[120px]" />
                    <div className="absolute bottom-[-5%] right-[5%] w-[45%] h-[45%] rounded-full bg-purple-300/20 blur-[100px]" />
                    <div className="absolute top-[35%] left-[30%] w-[35%] h-[35%] rounded-full bg-indigo-200/15 blur-[90px]" />
                </div>

                <div className="max-w-lg text-center space-y-5 z-10 w-full pt-10">
                    {/* Decorative icon */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                        Programming{" "}
                        <span className="animated-gradient-text">Assessment</span>
                    </h1>

                    <p className="text-base text-gray-500 font-medium leading-relaxed">
                        This environment strictly monitors your logical reasoning and
                        syntax via an AI Overseer. Entering will require Fullscreen mode to
                        protect assessment integrity.
                    </p>

                    {/* Info pills */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {["AI Monitored", "Fullscreen Mode", "Voice AI Active"].map(tag => (
                            <span key={tag} className="text-[11px] font-semibold px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleStartSession}
                            className="btn-gradient px-10 py-4 rounded-2xl text-base"
                        >
                            Start Assessment
                        </button>
                    </div>

                    <button
                        onClick={() => navigate("/")}
                        className="text-sm text-gray-400 hover:text-gray-700 underline transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-screen bg-gradient-to-br from-blue-100 to-purple-50 flex flex-col p-5 max-w-[1920px] mx-auto overflow-hidden relative transition-colors duration-500">
            {/* Soft gradient orbs specifically for the fullscreen container */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[10%] w-[55%] h-[55%] rounded-full bg-blue-300/20 blur-[120px]" />
                <div className="absolute bottom-[-5%] right-[5%] w-[45%] h-[45%] rounded-full bg-purple-300/20 blur-[100px]" />
                <div className="absolute top-[35%] left-[30%] w-[35%] h-[35%] rounded-full bg-indigo-200/15 blur-[90px]" />
            </div>

            <div className="flex items-center justify-between mb-4 px-2 shrink-0 z-10">
                <div>
                    <h1 className="text-xl font-black text-gray-900">
                        Programming{" "}
                        <span className="animated-gradient-text">Environment</span>
                    </h1>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse block" />
                        Live Overseer Active
                    </p>
                </div>
                <button
                    onClick={handleExit}
                    className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 bg-white/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                >
                    End Session
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 animate-scale-in pb-4 z-10 w-full">
                {/* Left Side: Agent Monitoring, Seed Questions & Constraints */}
                <div className="w-full lg:w-1/3 flex flex-col min-h-0 h-full">
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex-1 flex flex-col min-h-0">

                        {/* AI Overseer — compact inline status */}
                        <div className="flex items-center gap-3 pb-3 border-b border-border/20 mb-3 shrink-0">
                            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500", agentSpeaking ? "border-primary bg-primary/20 shadow-[0_0_12px_rgba(var(--primary),0.4)]" : "border-border/40 bg-secondary/50")}>
                                <svg className={cn("w-4 h-4 transition-colors", agentSpeaking ? "text-primary" : "text-muted-foreground")} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path d="M12 2a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
                                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary block leading-tight">AI Overseer</span>
                                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", vapiConnected ? "bg-success animate-pulse" : "bg-destructive")}></span>
                                    {vapiConnected ? "Live" : "Connecting..."}
                                </span>
                            </div>
                        </div>

                        {/* Challenge Selector */}
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5 shrink-0">Select Challenge</h3>
                        <div className="flex flex-col gap-2 mb-4 shrink-0">
                            {PROGRAMMING_QUESTIONS.map(q => (
                                <button
                                    key={q.id}
                                    onClick={() => handleSwitchQuestion(q.id)}
                                    className={cn(
                                        "px-3.5 py-2.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between gap-2",
                                        q.id === activeQuestionId
                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md"
                                            : "bg-gray-50 border-gray-200 hover:border-blue-400 text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    <span className="truncate">{q.title}</span>
                                    <span className={cn("text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider shrink-0", q.id === activeQuestionId ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500")}>{q.difficulty}</span>
                                </button>
                            ))}
                        </div>

                        {/* Scrollable Constraint + Test Cases */}
                        <div className="flex-1 overflow-y-auto min-h-0 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border/40 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <h2 className="text-sm font-bold mb-2 text-foreground">Active Constraint</h2>
                            <div className="text-sm text-muted-foreground font-medium leading-relaxed bg-secondary/50 p-4 rounded-xl border border-border/30 mb-4">
                                <p>{activeQuestion.description}</p>
                            </div>

                            <h2 className="text-sm font-bold mb-2 text-foreground">Test Cases</h2>
                            <div className="space-y-2">
                                {activeQuestion.testCases.map((tc, i) => (
                                    <div key={i} className="bg-secondary/50 border border-border/30 rounded-xl p-3 text-xs font-mono text-muted-foreground break-all">
                                        <div className="mb-1"><span className="font-bold text-foreground">Input:</span> {tc.input}</div>
                                        <div><span className="font-bold text-primary">Output:</span> {tc.expected}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Code Editor */}
                <div className="w-full lg:w-2/3 flex flex-col gap-4">
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                        <div className="px-6 py-4 border-b border-border/50 bg-black/5 dark:bg-black/10 flex items-center justify-between shrink-0 backdrop-blur-md z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                <span className="text-sm font-semibold ml-4 text-muted-foreground tracking-widest uppercase">Solution.{language === 'python' ? 'py' : language === 'java' ? 'java' : 'js'}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <select
                                    value={language}
                                    onChange={(e) => handleSwitchLanguage(e.target.value as SupportedLanguage)}
                                    className="bg-transparent border border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                </select>
                            </div>
                        </div>

                        {/* Monaco Code Editor */}
                        <div className="flex-1 overflow-hidden">
                            <MonacoEditor
                                height="100%"
                                language={language}
                                theme="vs"
                                value={code}
                                onChange={(value) => handleCodeChange(value || "")}
                                options={{
                                    fontFamily: '"Fira Code", "Consolas", "Courier New", monospace',
                                    fontSize: 14,
                                    lineHeight: 22,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    padding: { top: 16, bottom: 16 },
                                    automaticLayout: true,
                                    tabSize: 4,
                                    insertSpaces: true,
                                    autoClosingBrackets: "always",
                                    autoClosingQuotes: "always",
                                    autoIndent: "full",
                                    formatOnPaste: true,
                                    formatOnType: true,
                                    suggestOnTriggerCharacters: true,
                                    wordWrap: "on",
                                    bracketPairColorization: { enabled: true },
                                    cursorBlinking: "smooth",
                                    cursorSmoothCaretAnimation: "on",
                                    smoothScrolling: true,
                                    renderLineHighlight: "all",
                                    lineNumbers: "on",
                                    glyphMargin: false,
                                    folding: true,
                                    contextmenu: false,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
