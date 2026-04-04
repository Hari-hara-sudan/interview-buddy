import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import VoiceAvatar from "@/components/VoiceAvatar";
import { genAI } from "@/lib/gemini";
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
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `The user is writing code for: ${activeQuestion.title}.
Current code snapshot in ${language}:
\`\`\`
${currentCode}
\`\`\`
Check if there is a very obvious syntax typo (like "fur" instead of "for", "whil" instead of "while", missing obvious brackets, etc.) or a major fatal logical error.
If there is a clear error, reply ONLY with a short, friendly hint (1 sentence max). Do not be overly pedantic if it's just incomplete (like a missing closing brace on a newly opened function).
If their code is fine, or incomplete but correct so far, reply EXACTLY with "SILENT".`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            if (text && text !== "SILENT" && !text.includes("SILENT") && text.length > 5) {
                // Use vapi.say() to FORCE the agent to speak immediately
                // @ts-ignore
                vapi.say(text);
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
            <div ref={containerRef} className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
                <div className="max-w-xl text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-foreground tracking-tight drop-shadow-md">
                        Programming Assessment
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium">
                        This environment strictly monitors your logical reasoning and syntax via an AI Overseer.
                        Entering will require Fullscreen mode to protect assessment integrity.
                    </p>
                    <div className="pt-8">
                        <button
                            onClick={handleStartSession}
                            className="bg-primary text-primary-foreground font-bold px-10 py-5 rounded-2xl shadow-[0_0_40px_rgba(var(--primary),0.4)] hover:scale-105 transition-all duration-300 text-xl"
                        >
                            Start Assessment
                        </button>
                    </div>
                    <button onClick={() => navigate("/")} className="mt-4 text-sm font-semibold text-muted-foreground hover:text-foreground underline">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-screen bg-background flex flex-col p-6 max-w-[1920px] mx-auto text-foreground overflow-hidden">
            <div className="flex items-center justify-between mb-6 animate-fade-in px-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-foreground tracking-tight drop-shadow-md">
                        Programming Environment
                    </h1>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 text-success flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse block"></span> Live Overseer Active
                    </p>
                </div>
                <button onClick={handleExit} className="px-6 py-2 border border-border rounded-xl hover:bg-destructive hover:text-white hover:border-destructive font-semibold transition-all">
                    End Session
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 animate-scale-in pb-4">
                {/* Left Side: Agent Monitoring, Seed Questions & Constraints */}
                <div className="w-full lg:w-1/3 flex flex-col min-h-0 h-full gap-6">
                    <div className="bg-card border border-white/5 p-6 rounded-3xl glassmorphism shadow-2xl relative overflow-hidden group flex-1 flex flex-col min-h-0">
                        <div className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none -z-10 group-hover:bg-primary/20 transition-colors duration-1000"></div>

                        {/* Visual Overseer */}
                        <div className="flex items-center gap-6 pb-6 border-b border-white/10 dark:border-white/5 mb-6">
                            <div className="relative group-hover:scale-105 transition-transform duration-700 w-16 h-16 shrink-0">
                                <VoiceAvatar type="agent" isSpeaking={agentSpeaking} />
                            </div>
                            <div>
                                <span className="text-xs font-black tracking-[0.2em] uppercase text-primary block mb-1">
                                    AI Overseer
                                </span>
                                <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full", vapiConnected ? "bg-success animate-pulse" : "bg-destructive")}></span>
                                    {vapiConnected ? "Live Listening..." : "Connecting Voice Engine..."}
                                </span>
                            </div>
                        </div>

                        {/* Question Selector List */}
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Select Challenge</h3>
                        <div className="flex flex-col gap-3 mb-6">
                            {PROGRAMMING_QUESTIONS.map(q => (
                                <button
                                    key={q.id}
                                    onClick={() => handleSwitchQuestion(q.id)}
                                    className={cn(
                                        "px-4 py-3 rounded-xl border text-left font-medium transition-all flex items-center justify-between",
                                        q.id === activeQuestionId
                                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                                            : "bg-black/10 dark:bg-white/5 border-white/5 hover:border-primary/40"
                                    )}
                                >
                                    <span className="truncate">{q.title}</span>
                                    <span className={cn("text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider", q.id === activeQuestionId ? "bg-black/20" : "bg-black/20 text-muted-foreground")}>{q.difficulty}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <h2 className="text-lg font-bold mb-3 flex items-center justify-between">
                                Active Constraint
                            </h2>
                            <div className="text-sm text-muted-foreground font-medium leading-relaxed bg-black/10 dark:bg-white/5 p-5 rounded-2xl border border-white/5 mb-4">
                                <p>{activeQuestion.description}</p>
                            </div>

                            <h2 className="text-lg font-bold mb-3">Test Cases</h2>
                            <div className="space-y-3">
                                {activeQuestion.testCases.map((tc, i) => (
                                    <div key={i} className="bg-black/10 dark:bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-mono text-muted-foreground break-all">
                                        <div className="mb-1"><span className="font-bold text-foreground">Input:</span> {tc.input}</div>
                                        <div><span className="font-bold text-primary">Output:</span> {tc.expected}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Code Editor & AI Feedback Console */}
                <div className="w-full lg:w-2/3 flex flex-col gap-6">
                    <div className="flex-1 bg-white/95 border border-white/20 dark:border-white/5 rounded-3xl overflow-hidden glassmorphism shadow-2xl flex flex-col group relative">
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
